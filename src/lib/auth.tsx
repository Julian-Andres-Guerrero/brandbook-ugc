import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, supabaseMissing } from './supabase'
import type { Profile } from './types'

type AuthState = {
  loading: boolean
  session: Session | null
  profile: Profile | null
  /** true si el usuario tiene 2FA y aún no ha verificado el segundo factor en esta sesión. */
  needsMfa: boolean
  refreshProfile: () => Promise<void>
  refreshMfa: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const ACTIVITY_KEY = 'last-activity-ping'
/** Cuenta como actividad para la regla de inactividad (máximo una vez por hora). */
async function pingActivity() {
  const last = Number(localStorage.getItem(ACTIVITY_KEY) ?? 0)
  if (Date.now() - last < 3_600_000) return
  localStorage.setItem(ACTIVITY_KEY, String(Date.now()))
  await supabase.rpc('touch_activity')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(!supabaseMissing)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [needsMfa, setNeedsMfa] = useState(false)

  const loadProfile = useCallback(async (s: Session | null) => {
    if (!s) return setProfile(null)
    const { data } = await supabase.from('profiles').select('*').eq('id', s.user.id).maybeSingle()
    setProfile((data as Profile) ?? null)
  }, [])

  const refreshMfa = useCallback(async () => {
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    setNeedsMfa(!!data && data.nextLevel === 'aal2' && data.currentLevel !== 'aal2')
  }, [])

  useEffect(() => {
    if (supabaseMissing) return
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session) {
        await Promise.all([loadProfile(data.session), refreshMfa()])
        pingActivity().catch(() => {})
      }
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setNeedsMfa(false)
        localStorage.removeItem(ACTIVITY_KEY)
      }
      // Diferido: no se deben hacer llamadas a Supabase dentro del callback.
      if (s && (event === 'SIGNED_IN' || event === 'MFA_CHALLENGE_VERIFIED' || event === 'USER_UPDATED')) {
        setTimeout(() => {
          loadProfile(s)
          refreshMfa()
        }, 0)
      }
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile, refreshMfa])

  return (
    <AuthContext.Provider
      value={{ loading, session, profile, needsMfa, refreshProfile: () => loadProfile(session), refreshMfa }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const c = useContext(AuthContext)
  if (!c) throw new Error('useAuth fuera de AuthProvider')
  return c
}

/** Registra un evento de auditoría que solo conoce el cliente (login, exportación…). */
export async function logEvent(action: string, details: Record<string, unknown> = {}) {
  await supabase.rpc('log_event', { p_action: action, p_details: details })
}

export function avatarUrl(path: string | null | undefined) {
  if (!path) return null
  return supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl
}
