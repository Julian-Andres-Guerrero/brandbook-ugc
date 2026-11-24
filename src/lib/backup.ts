// Respaldo completo de los datos del usuario en JSON (portabilidad de datos).
import { supabase } from './supabase'
import type { Campaign, ProductRecord, Profile, SocialLink } from './types'

export type Backup = {
  app: 'brandbook-ugc'
  version: 1
  exported_at: string
  account_email: string | null
  profile: Profile | null
  social_links: SocialLink[]
  campaigns: Campaign[]
  product_records: ProductRecord[]
  invoices: { record_id: string; product: string; file_name: string | null; storage_path: string; size_bytes: number | null; mime: string | null }[]
  audit_log: unknown[]
}

export async function buildBackup(userId: string, email: string | null): Promise<Backup> {
  const [p, l, c, r, a] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('social_links').select('*').order('position'),
    supabase.from('campaigns').select('*, campaign_videos(*)').eq('user_id', userId).order('position'),
    supabase.from('product_records').select('*').order('received_on'),
    supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(1000),
  ])
  for (const res of [p, l, c, r, a]) if (res.error) throw new Error(res.error.message)
  const records = (r.data ?? []) as ProductRecord[]
  return {
    app: 'brandbook-ugc',
    version: 1,
    exported_at: new Date().toISOString(),
    account_email: email,
    profile: p.data as Profile | null,
    social_links: ((l.data ?? []) as SocialLink[]).filter((x) => x.user_id === userId),
    campaigns: (c.data ?? []) as Campaign[],
    product_records: records,
    invoices: records
      .filter((x) => x.invoice_path)
      .map((x) => ({ record_id: x.id, product: x.product, file_name: x.invoice_name, storage_path: x.invoice_path!, size_bytes: x.invoice_size, mime: x.invoice_mime })),
    audit_log: a.data ?? [],
  }
}

const RECORD_FIELDS = [
  'product', 'brand', 'campaign', 'platform', 'received_on', 'deadline_on', 'product_url', 'order_url', 'video_url',
  'product_value', 'cash_payment', 'paid_on', 'status', 'notes',
] as const

/**
 * Importa registros y campañas desde un respaldo. Crea filas nuevas a nombre del
 * usuario actual (nunca reutiliza ids ni dueños del archivo) y omite duplicados.
 * Los archivos de factura no viajan en el JSON: se vuelven a adjuntar a mano.
 */
export async function importBackup(json: unknown, userId: string) {
  const b = json as Partial<Backup>
  if (b?.app !== 'brandbook-ugc' || b.version !== 1) throw new Error('El archivo no es un respaldo válido de Brandbook UGC.')
  const { data: existing } = await supabase.from('product_records').select('product, received_on')
  const seen = new Set((existing ?? []).map((x) => `${x.product}|${x.received_on}`))
  const newRecords = (b.product_records ?? [])
    .filter((r) => r && typeof r.product === 'string' && !seen.has(`${r.product}|${r.received_on}`))
    .map((r) => Object.fromEntries(RECORD_FIELDS.map((k) => [k, r[k] ?? null])))
    .map((r) => ({ ...r, cash_payment: r.cash_payment ?? 0, user_id: userId }))
  if (newRecords.length) {
    const { error } = await supabase.from('product_records').insert(newRecords)
    if (error) throw new Error(error.message)
  }

  const { data: existingC } = await supabase.from('campaigns').select('brand, title_en').eq('user_id', userId)
  const seenC = new Set((existingC ?? []).map((x) => `${x.brand}|${x.title_en}`))
  let campaigns = 0
  for (const c of b.campaigns ?? []) {
    if (!c?.brand || !c.title_en || seenC.has(`${c.brand}|${c.title_en}`)) continue
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        user_id: userId, brand: c.brand, title_en: c.title_en, title_es: c.title_es ?? null, description_en: c.description_en ?? null,
        description_es: c.description_es ?? null, via: c.via ?? null, status: c.status, is_public: c.is_public ?? true, position: c.position ?? 0,
      })
      .select('id')
      .single()
    if (error) throw new Error(error.message)
    const vids = (c.campaign_videos ?? []).map((v) => ({ campaign_id: data.id, user_id: userId, network: v.network, url: v.url, position: v.position, cover_path: v.cover_path?.startsWith(`${userId}/covers/`) ? v.cover_path : null }))
    if (vids.length) await supabase.from('campaign_videos').insert(vids)
    campaigns++
  }
  return { records: newRecords.length, campaigns }
}
