import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Alert, Button, Input } from '../../components/ui'
import { logEvent, useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { AuthShell, authError } from './AuthShell'

// Freno en el navegador además del rate limiting real de Supabase Auth (por IP).
const LOCK_KEY = 'login-failures'
const MAX_FAILS = 5
const LOCK_MS = 5 * 60_000
function lockState() {
  const s = JSON.parse(localStorage.getItem(LOCK_KEY) ?? '{"n":0,"t":0}') as { n: number; t: number }
  const locked = s.n >= MAX_FAILS && Date.now() - s.t < LOCK_MS
  return { ...s, locked, wait: Math.ceil((LOCK_MS - (Date.now() - s.t)) / 60_000) }
}

export default function Login() {
  const { session, needsMfa, loading, refreshMfa } = useAuth()
  const nav = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/panel'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!loading && session && !needsMfa) return <Navigate to={from} replace />

  async function onLogin(e: FormEvent) {
    e.preventDefault()
    const lock = lockState()
    if (lock.locked) return setError(`Demasiados intentos fallidos. Espera ${lock.wait} min.`)
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (error) {
      localStorage.setItem(LOCK_KEY, JSON.stringify({ n: lock.n + 1, t: Date.now() }))
      return setError(authError(error.message))
    }
    localStorage.removeItem(LOCK_KEY)
    await refreshMfa()
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (data?.nextLevel === 'aal2' && data.currentLevel !== 'aal2') return // muestra el paso 2FA
    logEvent('login').catch(() => {})
    nav(from, { replace: true })
  }

  async function onMfa(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const totp = factors?.totp.find((f) => f.status === 'verified')
    if (!totp) {
      setBusy(false)
      return setError('No se encontró tu factor 2FA.')
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: totp.id, code: code.trim() })
    setBusy(false)
    if (error) return setError(authError(error.message))
    await refreshMfa()
    logEvent('login', { mfa: true }).catch(() => {})
    nav(from, { replace: true })
  }

  if (session && needsMfa) {
    return (
      <AuthShell title="Verificación en dos pasos">
        <form onSubmit={onMfa} className="flex flex-col gap-4">
          <p className="text-sm text-muted">Escribe el código de 6 dígitos de tu app de autenticación.</p>
          <Input label="Código" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} />
          {error && <Alert kind="error">{error}</Alert>}
          <Button disabled={busy}>{busy ? 'Verificando…' : 'Verificar'}</Button>
          <button type="button" onClick={() => supabase.auth.signOut()} className="text-sm text-muted underline">
            Cancelar y salir
          </button>
        </form>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Entrar">
      <form onSubmit={onLogin} className="flex flex-col gap-4">
        <Input label="Correo" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Contraseña" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <Alert kind="error">{error}</Alert>}
        <Button disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</Button>
        <div className="flex justify-between text-sm">
          <Link to="/recuperar" className="text-accent underline">¿Olvidaste tu contraseña?</Link>
          <Link to="/registro" className="text-muted underline">Crear cuenta</Link>
        </div>
      </form>
    </AuthShell>
  )
}
