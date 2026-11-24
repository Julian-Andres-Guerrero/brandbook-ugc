// =============================================================================
// Edge Function: inactivity-sweeper
//
// Se ejecuta una vez al día (Supabase Cron, ver README). Para cada cuenta:
//   * 60 días sin actividad -> envía aviso por correo.
//   * 10 días después del aviso sin actividad -> borra facturas, avatar y la
//     cuenta completa (todo lo demás se borra en cascada). Irreversible.
//
// Secretos (Supabase > Edge Functions > Secrets), nunca en el código:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (los pone Supabase automáticamente)
//   CRON_SECRET     -> el cron envía este valor en el header x-cron-secret
//   RESEND_API_KEY  -> proveedor de correo (https://resend.com, plan gratis)
//   MAIL_FROM       -> ej. "Brandbook UGC <no-reply@tudominio.com>"
//   SITE_URL        -> ej. https://tudominio.com
//   DRY_RUN=true    -> opcional: solo reporta, no envía ni borra
// =============================================================================
import { createClient } from 'npm:@supabase/supabase-js@2'

type Due = {
  user_id: string
  email: string | null
  username: string | null
  display_name: string | null
  stage: 'warn' | 'delete'
  last_active_at: string
}

const env = (k: string) => Deno.env.get(k) ?? ''

async function sendMail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env('MAIL_FROM'), to, subject, html }),
  })
  if (!res.ok) throw new Error(`resend ${res.status}: ${await res.text()}`)
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

function warningEmail(name: string, site: string) {
  const n = escapeHtml(name)
  return `
  <p>Hola ${n} / Hi ${n},</p>
  <p><strong>ES:</strong> No vemos actividad en tu cuenta de Brandbook UGC desde hace más de 2 meses.
  Si no inicias sesión en los próximos <strong>10 días</strong>, tu cuenta, tu perfil público, tus registros
  y tus facturas se borrarán por completo y <strong>no se podrán recuperar</strong>.
  Para conservarla, solo entra en <a href="${site}/entrar">${site}/entrar</a>.
  Si quieres guardar una copia, exporta tus datos desde Cuenta &gt; Exportar.</p>
  <p><strong>EN:</strong> We haven't seen activity on your Brandbook UGC account for over 2 months.
  If you don't sign in within the next <strong>10 days</strong>, your account, public profile, records and
  invoices will be permanently deleted and <strong>cannot be recovered</strong>.
  To keep it, just sign in at <a href="${site}/entrar">${site}/entrar</a>.</p>`
}

function deletedEmail(name: string) {
  const n = escapeHtml(name)
  return `
  <p>Hola ${n} / Hi ${n},</p>
  <p><strong>ES:</strong> Tu cuenta de Brandbook UGC y todos sus datos fueron eliminados por inactividad, como
  te avisamos hace 10 días. Puedes crear una cuenta nueva cuando quieras.</p>
  <p><strong>EN:</strong> Your Brandbook UGC account and all its data were deleted due to inactivity, as notified
  10 days ago. You can create a new account at any time.</p>`
}

async function removeFolder(admin: ReturnType<typeof createClient>, bucket: string, prefix: string) {
  // Lista recursivamente <user_id>/... y borra en lotes.
  const stack = [prefix]
  const files: string[] = []
  while (stack.length) {
    const dir = stack.pop()!
    const { data, error } = await admin.storage.from(bucket).list(dir, { limit: 1000 })
    if (error) throw error
    for (const item of data ?? []) {
      const path = `${dir}/${item.name}`
      if (item.id === null) stack.push(path) // carpeta
      else files.push(path)
    }
  }
  for (let i = 0; i < files.length; i += 100) {
    const { error } = await admin.storage.from(bucket).remove(files.slice(i, i + 100))
    if (error) throw error
  }
  return files.length
}

Deno.serve(async (req) => {
  if (!env('CRON_SECRET') || req.headers.get('x-cron-secret') !== env('CRON_SECRET')) {
    return new Response('forbidden', { status: 403 })
  }
  const dryRun = env('DRY_RUN') === 'true'
  const site = env('SITE_URL').replace(/\/$/, '')
  const admin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })

  const { data, error } = await admin.rpc('inactivity_due')
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 })

  const report = { warned: 0, deleted: 0, errors: [] as string[], dryRun }
  for (const u of (data ?? []) as Due[]) {
    const name = u.display_name || u.username || ''
    try {
      if (dryRun) {
        report[u.stage === 'warn' ? 'warned' : 'deleted']++
        continue
      }
      if (u.stage === 'warn') {
        if (u.email) await sendMail(u.email, 'Tu cuenta se borrará en 10 días / Your account will be deleted in 10 days', warningEmail(name, site))
        const { error: e } = await admin.rpc('mark_inactivity_warned', { p_user: u.user_id })
        if (e) throw e
        report.warned++
      } else {
        await removeFolder(admin, 'invoices', u.user_id)
        await removeFolder(admin, 'avatars', u.user_id)
        const { error: e } = await admin.auth.admin.deleteUser(u.user_id)
        if (e) throw e
        if (u.email) await sendMail(u.email, 'Cuenta eliminada / Account deleted', deletedEmail(name)).catch(() => {})
        report.deleted++
      }
    } catch (e) {
      // Nunca se registra el correo del usuario, solo su id.
      report.errors.push(`${u.user_id}: ${(e as Error).message}`)
    }
  }
  return new Response(JSON.stringify(report), { headers: { 'Content-Type': 'application/json' } })
})
