import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Alert, Button, Input, Spinner } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import { AuthShell, authError } from './AuthShell'

/** Página a la que llega el enlace del correo de recuperación (sesión temporal de recuperación). */
export default function ResetPassword() {
  const { session, loading } = useAuth()
  const nav = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) return setError('Las contraseñas no coinciden.')
    setBusy(true)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(authError(error.message))
    // Por seguridad, cerramos las demás sesiones abiertas con la contraseña anterior.
    await supabase.auth.signOut({ scope: 'others' })
    nav('/panel', { replace: true })
  }

  if (loading) return <AuthShell title="Nueva contraseña"><Spinner /></AuthShell>
  if (!session) {
    return (
      <AuthShell title="Nueva contraseña">
        <Alert kind="error">El enlace no es válido o ya venció.</Alert>
        <Link to="/recuperar" className="mt-4 inline-block text-accent underline">Pedir un enlace nuevo</Link>
      </AuthShell>
    )
  }
  return (
    <AuthShell title="Nueva contraseña">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input label="Contraseña nueva" type="password" autoComplete="new-password" minLength={10} required value={password} onChange={(e) => setPassword(e.target.value)} hint="Mínimo 10 caracteres, con mayúsculas, minúsculas y números." />
        <Input label="Repite la contraseña" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        {error && <Alert kind="error">{error}</Alert>}
        <Button disabled={busy}>{busy ? 'Guardando…' : 'Guardar contraseña'}</Button>
      </form>
    </AuthShell>
  )
}
