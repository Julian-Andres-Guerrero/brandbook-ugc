import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Input } from '../../components/ui'
import { INACTIVITY_DELETE_DAYS, INACTIVITY_WARN_DAYS } from '../../config'
import { logEvent, useAuth } from '../../lib/auth'
import { buildBackup, importBackup } from '../../lib/backup'
import { downloadBlob } from '../../lib/files'
import { supabase } from '../../lib/supabase'
import type { AuditEntry } from '../../lib/types'

const ACTION_LABEL: Record<string, string> = {
  insert: 'Creó', update: 'Editó', delete: 'Borró', login: 'Inicio de sesión', logout: 'Cierre de sesión',
  mfa_enabled: '2FA activado', mfa_disabled: '2FA desactivado', export: 'Exportación', import: 'Importación', signout_others: 'Cerró otras sesiones',
}
const TABLE_LABEL: Record<string, string> = { product_records: 'registro', campaigns: 'campaña', profiles: 'perfil' }

async function listAll(bucket: string, prefix: string): Promise<string[]> {
  const out: string[] = []
  const stack = [prefix]
  while (stack.length) {
    const dir = stack.pop()!
    const { data } = await supabase.storage.from(bucket).list(dir, { limit: 1000 })
    for (const it of data ?? []) (it.id === null ? stack : out).push(`${dir}/${it.name}`)
  }
  return out
}

function MfaSection() {
  const { refreshMfa } = useAuth()
  const [factorId, setFactorId] = useState<string | null>(null)
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null)
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)

  const load = async () => {
    const { data } = await supabase.auth.mfa.listFactors()
    setFactorId(data?.totp.find((f) => f.status === 'verified')?.id ?? null)
  }
  useEffect(() => {
    load()
  }, [])

  async function start() {
    setMsg(null)
    // Limpia intentos previos sin verificar.
    const { data: list } = await supabase.auth.mfa.listFactors()
    for (const f of list?.all ?? []) if (f.status === 'unverified') await supabase.auth.mfa.unenroll({ factorId: f.id })
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: `app-${Date.now()}` })
    if (error) return setMsg({ kind: 'error', text: error.message })
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret })
  }
  async function verify(e: FormEvent) {
    e.preventDefault()
    if (!enroll) return
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enroll.id, code: code.trim() })
    if (error) return setMsg({ kind: 'error', text: 'Código incorrecto. Revisa la hora de tu teléfono e inténtalo otra vez.' })
    setEnroll(null)
    setCode('')
    await logEvent('mfa_enabled').catch(() => {})
    await refreshMfa()
    await load()
    setMsg({ kind: 'ok', text: '2FA activado. Desde ahora te pediremos el código al entrar.' })
  }
  async function disable() {
    if (!factorId || !confirm('¿Desactivar la verificación en dos pasos?')) return
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    if (error) return setMsg({ kind: 'error', text: error.message })
    await logEvent('mfa_disabled').catch(() => {})
    await supabase.auth.refreshSession()
    await load()
    setMsg({ kind: 'ok', text: '2FA desactivado.' })
  }

  return (
    <Card className="space-y-3">
      <h2 className="font-semibold">Verificación en dos pasos (2FA)</h2>
      <p className="text-sm text-muted">Con 2FA, además de tu contraseña necesitas un código de una app como Google Authenticator, 1Password o Authy. Si está activo, la base de datos no entrega tus registros ni facturas sin ese código.</p>
      {factorId ? (
        <div className="flex flex-wrap items-center gap-3"><span className="text-sm text-ok">● Activado</span><Button variant="danger" onClick={disable}>Desactivar</Button></div>
      ) : enroll ? (
        <form onSubmit={verify} className="space-y-3">
          <p className="text-sm">1. Escanea este código QR con tu app de autenticación:</p>
          <img src={enroll.qr} alt="Código QR para configurar 2FA" className="size-44 rounded-lg bg-white p-2" />
          <p className="text-xs text-muted">¿No puedes escanear? Escribe esta clave: <code className="break-all text-ink">{enroll.secret}</code></p>
          <Input label="2. Escribe el código de 6 dígitos" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value)} />
          <Button>Activar 2FA</Button>
        </form>
      ) : (
        <Button variant="secondary" onClick={start}>Configurar 2FA</Button>
      )}
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
    </Card>
  )
}

export default function Account() {
  const { session, profile } = useAuth()
  const nav = useNavigate()
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [log, setLog] = useState<AuditEntry[]>([])
  const [confirmName, setConfirmName] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(30).then(({ data }) => setLog((data ?? []) as AuditEntry[]))
  }, [])

  if (!session || !profile) return null
  const uid = session.user.id

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.updateUser({ password: pw })
    setPw('')
    setMsg(error ? { kind: 'error', text: error.message } : { kind: 'ok', text: 'Contraseña actualizada.' })
  }
  async function signOutOthers() {
    const { error } = await supabase.auth.signOut({ scope: 'others' })
    if (!error) logEvent('signout_others').catch(() => {})
    setMsg(error ? { kind: 'error', text: error.message } : { kind: 'ok', text: 'Cerraste la sesión en todos tus otros dispositivos.' })
  }
  async function exportJson() {
    try {
      const b = await buildBackup(uid, session!.user.email ?? null)
      downloadBlob(JSON.stringify(b, null, 2), `brandbook-ugc-respaldo-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
      logEvent('export', { format: 'json' }).catch(() => {})
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    }
  }
  async function importJson(file: File | undefined) {
    if (!file) return
    try {
      const res = await importBackup(JSON.parse(await file.text()), uid)
      logEvent('import', res).catch(() => {})
      setMsg({ kind: 'ok', text: `Importados ${res.records} registros y ${res.campaigns} campañas. Los duplicados se omitieron. Las facturas se adjuntan de nuevo a mano.` })
    } catch (e) {
      setMsg({ kind: 'error', text: (e as Error).message })
    }
  }
  async function deleteAccount(e: FormEvent) {
    e.preventDefault()
    if (confirmName !== profile!.username) return
    setBusy(true)
    try {
      for (const bucket of ['invoices', 'avatars']) {
        const files = await listAll(bucket, uid)
        for (let i = 0; i < files.length; i += 100) await supabase.storage.from(bucket).remove(files.slice(i, i + 100))
      }
      const { error } = await supabase.rpc('delete_my_account')
      if (error) throw error
      await supabase.auth.signOut({ scope: 'local' })
      nav('/', { replace: true })
    } catch (e) {
      setBusy(false)
      setMsg({ kind: 'error', text: (e as Error).message })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Cuenta y seguridad</h1>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}

      <MfaSection />

      <Card className="space-y-4">
        <h2 className="font-semibold">Sesiones y contraseña</h2>
        <p className="text-sm text-muted">Cuenta: {session.user.email}</p>
        <Button variant="secondary" onClick={signOutOthers}>Cerrar sesión en otros dispositivos</Button>
        <form onSubmit={changePassword} className="flex flex-wrap items-end gap-3">
          <div className="min-w-60 flex-1"><Input label="Nueva contraseña" type="password" autoComplete="new-password" minLength={10} required value={pw} onChange={(e) => setPw(e.target.value)} /></div>
          <Button variant="secondary">Cambiar contraseña</Button>
        </form>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Tus datos</h2>
        <p className="text-sm text-muted">Descarga un respaldo completo (perfil, campañas, registros, lista de facturas e historial). Puedes importarlo después; los archivos de factura se descargan uno por uno desde cada registro.</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={exportJson}>Exportar respaldo (JSON)</Button>
          <label className="inline-flex cursor-pointer items-center rounded-xl border border-line px-4 py-2.5 font-medium hover:border-muted">
            Importar respaldo
            <input type="file" accept="application/json" className="sr-only" onChange={(e) => importJson(e.target.files?.[0])} />
          </label>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Actividad reciente</h2>
        <p className="text-xs text-muted">Inicios de sesión y cambios en tus datos. Solo se guarda qué campos cambiaron, nunca los valores.</p>
        <ul className="divide-y divide-line text-sm">
          {log.map((l) => (
            <li key={l.id} className="flex justify-between gap-3 py-2">
              <span>
                {ACTION_LABEL[l.action] ?? l.action} {l.table_name ? TABLE_LABEL[l.table_name] ?? l.table_name : ''}
                {l.details?.fields?.length ? <span className="text-muted"> ({l.details.fields.join(', ')})</span> : null}
              </span>
              <time className="shrink-0 text-muted" dateTime={l.created_at}>{new Date(l.created_at).toLocaleString('es-CO')}</time>
            </li>
          ))}
          {log.length === 0 && <li className="py-2 text-muted">Sin actividad todavía.</li>}
        </ul>
      </Card>

      <Card className="space-y-3 border-bad/40">
        <h2 className="font-semibold text-bad">Eliminar cuenta</h2>
        <p className="text-sm text-muted">
          Borra para siempre tu perfil público, campañas, registros, facturas e historial. No se puede deshacer. Exporta un respaldo antes si lo necesitas.
          Las cuentas sin actividad durante {INACTIVITY_WARN_DAYS} días reciben un aviso y se eliminan {INACTIVITY_DELETE_DAYS} días después si no hay actividad.
        </p>
        <form onSubmit={deleteAccount} className="flex flex-wrap items-end gap-3">
          <div className="min-w-60 flex-1"><Input label={`Escribe tu usuario (${profile.username}) para confirmar`} value={confirmName} onChange={(e) => setConfirmName(e.target.value)} /></div>
          <Button variant="danger" disabled={busy || confirmName !== profile.username}>{busy ? 'Eliminando…' : 'Eliminar mi cuenta'}</Button>
        </form>
      </Card>
    </div>
  )
}
