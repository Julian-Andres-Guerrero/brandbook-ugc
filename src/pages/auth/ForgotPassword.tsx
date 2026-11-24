import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Button, Input } from '../../components/ui'
import { SITE_URL } from '../../config'
import { supabase } from '../../lib/supabase'
import { AuthShell, authError } from './AuthShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/nueva-clave` })
    setBusy(false)
    // Por seguridad, el mensaje es el mismo exista o no la cuenta.
    if (error && /rate|too many/i.test(error.message)) return setError(authError(error.message))
    setSent(true)
  }

  return (
    <AuthShell title="Recuperar contraseña">
      {sent ? (
        <Alert kind="ok">Si existe una cuenta con <strong>{email}</strong>, te llegará un correo con un enlace para crear una contraseña nueva. El enlace vence en 1 hora.</Alert>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <p className="text-sm text-muted">Escribe el correo de tu cuenta y te enviaremos un enlace para crear una contraseña nueva.</p>
          <Input label="Correo" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          {error && <Alert kind="error">{error}</Alert>}
          <Button disabled={busy}>{busy ? 'Enviando…' : 'Enviar enlace'}</Button>
        </form>
      )}
      <p className="mt-4 text-sm"><Link to="/entrar" className="text-muted underline">Volver a entrar</Link></p>
    </AuthShell>
  )
}
