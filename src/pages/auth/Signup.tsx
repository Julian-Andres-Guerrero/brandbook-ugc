import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Alert, Button, Input } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { SITE_URL } from '../../config'
import { AuthShell, authError } from './AuthShell'

const USERNAME_RE = /^[a-z0-9](?:[a-z0-9._]{1,28}[a-z0-9])$/

export default function Signup() {
  const { session } = useAuth()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adult, setAdult] = useState(false)
  const [terms, setTerms] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const u = username.trim().toLowerCase()
  const validFormat = USERNAME_RE.test(u)

  useEffect(() => {
    setAvailable(null)
    if (!validFormat) return
    const id = setTimeout(async () => {
      const { data } = await supabase.rpc('username_available', { p_username: u })
      setAvailable(!!data)
    }, 400)
    return () => clearTimeout(id)
  }, [u, validFormat])

  if (session) return <Navigate to="/panel" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validFormat || available === false) return setError('Elige un nombre de usuario válido y disponible.')
    if (!adult || !terms) return setError('Debes confirmar que eres mayor de 18 años y aceptar los términos.')
    setBusy(true)
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: u, display_name: displayName.trim() || u },
        emailRedirectTo: `${SITE_URL}/panel`,
      },
    })
    setBusy(false)
    if (error) return setError(authError(error.message))
    if (!data.session) setDone(true) // requiere confirmar el correo
  }

  if (done) {
    return (
      <AuthShell title="Revisa tu correo">
        <p className="text-muted">
          Te enviamos un enlace a <strong className="text-ink">{email}</strong> para confirmar tu cuenta. Después podrás entrar a tu panel.
        </p>
      </AuthShell>
    )
  }

  const userHint = !u
    ? 'Será tu URL pública: /@usuario. Letras minúsculas, números, punto o guion bajo (3 a 30).'
    : !validFormat
      ? 'Formato no válido: 3 a 30 caracteres, minúsculas, números, punto o guion bajo; sin empezar ni terminar en símbolo.'
      : available === null
        ? 'Comprobando…'
        : available
          ? `Disponible: ${SITE_URL.replace(/^https?:\/\//, '')}/@${u}`
          : 'No disponible.'

  return (
    <AuthShell title="Crea tu perfil">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Nombre de usuario" required autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} hint={userHint} error={u && (!validFormat || available === false) ? userHint : null} />
        <Input label="Nombre público" autoComplete="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} />
        <Input label="Correo" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Contraseña" type="password" autoComplete="new-password" required minLength={10} value={password} onChange={(e) => setPassword(e.target.value)} hint="Mínimo 10 caracteres, con mayúsculas, minúsculas y números." />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 size-4" checked={adult} onChange={(e) => setAdult(e.target.checked)} required />
          Confirmo que tengo 18 años o más.
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 size-4" checked={terms} onChange={(e) => setTerms(e.target.checked)} required />
          <span>
            Acepto los <Link to="/legal/terminos" className="text-accent underline" target="_blank">Términos</Link> y la{' '}
            <Link to="/legal/privacidad" className="text-accent underline" target="_blank">Política de Privacidad</Link>, incluida la eliminación de cuentas inactivas.
          </span>
        </label>
        {error && <Alert kind="error">{error}</Alert>}
        <Button disabled={busy}>{busy ? 'Creando…' : 'Crear cuenta'}</Button>
        <p className="text-sm text-muted">¿Ya tienes cuenta? <Link to="/entrar" className="text-accent underline">Entrar</Link></p>
      </form>
    </AuthShell>
  )
}
