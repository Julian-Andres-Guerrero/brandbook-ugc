import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Card, Input, Select, Spinner, Textarea } from '../../components/ui'
import { INVOICE_MAX_BYTES } from '../../config'
import { useAuth } from '../../lib/auth'
import { formatBytes, prepareInvoice, safeFileName } from '../../lib/files'
import { supabase } from '../../lib/supabase'
import { PLATFORMS, PLATFORM_LABEL, RECORD_STATUSES, RECORD_STATUS_LABEL, type ProductRecord } from '../../lib/types'
import { openInvoice } from './useRecords'

type Form = {
  product: string; brand: string; campaign: string; platform: ProductRecord['platform']
  received_on: string; deadline_on: string; product_url: string; order_url: string; video_url: string
  product_value: string; cash_payment: string; paid_on: string; status: ProductRecord['status']; notes: string
}

const today = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local
const empty: Form = {
  product: '', brand: '', campaign: '', platform: 'stackinfluence', received_on: today(), deadline_on: '',
  product_url: '', order_url: '', video_url: '', product_value: '', cash_payment: '0', paid_on: '', status: 'received', notes: '',
}

const fromRecord = (r: ProductRecord): Form => ({
  product: r.product, brand: r.brand ?? '', campaign: r.campaign ?? '', platform: r.platform,
  received_on: r.received_on, deadline_on: r.deadline_on ?? '', product_url: r.product_url ?? '', order_url: r.order_url ?? '',
  video_url: r.video_url ?? '', product_value: r.product_value == null ? '' : String(r.product_value),
  cash_payment: String(r.cash_payment ?? 0), paid_on: r.paid_on ?? '', status: r.status, notes: r.notes ?? '',
})

const orNull = (s: string) => (s.trim() === '' ? null : s.trim())
const amount = (s: string) => {
  if (s.trim() === '') return null
  const n = Number(s.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN
}

export default function RecordForm() {
  const { id } = useParams()
  const isNew = !id
  const nav = useNavigate()
  const { session } = useAuth()
  const [form, setForm] = useState<Form>(empty)
  const [record, setRecord] = useState<ProductRecord | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileNote, setFileNote] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(!isNew)

  useEffect(() => {
    if (isNew) return
    supabase.from('product_records').select('*').eq('id', id).maybeSingle().then(({ data, error }) => {
      if (error || !data) setError('No se encontró el registro.')
      else {
        setRecord(data as ProductRecord)
        setForm(fromRecord(data as ProductRecord))
      }
      setLoading(false)
    })
  }, [id, isNew])

  const set = <K extends keyof Form>(k: K) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value as Form[K] }))

  async function onPickFile(f: File | undefined) {
    setFile(null)
    setFileNote(null)
    setError(null)
    if (!f) return
    try {
      const prepared = await prepareInvoice(f)
      setFile(prepared.file)
      setFileNote(prepared.note ?? null)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function uploadInvoice(recordId: string) {
    if (!file || !session) return null
    const path = `${session.user.id}/${recordId}/${Date.now()}-${safeFileName(file.name)}`
    const { error } = await supabase.storage.from('invoices').upload(path, file, { contentType: file.type, upsert: false })
    if (error) throw new Error(`No se pudo subir la factura: ${error.message}`)
    return { invoice_path: path, invoice_name: file.name.slice(0, 200), invoice_mime: file.type, invoice_size: file.size }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const pv = amount(form.product_value)
    const cash = amount(form.cash_payment) ?? 0
    if (Number.isNaN(pv) || Number.isNaN(cash)) return setError('Los valores deben ser números positivos (ej. 36.25).')
    if (form.deadline_on && form.deadline_on < form.received_on && !confirm('La fecha límite es anterior a la fecha de recibido. ¿Guardar igual?')) return
    setBusy(true)
    setError(null)
    const payload = {
      product: form.product.trim(), brand: orNull(form.brand), campaign: orNull(form.campaign), platform: form.platform,
      received_on: form.received_on, deadline_on: orNull(form.deadline_on), product_url: orNull(form.product_url),
      order_url: orNull(form.order_url), video_url: orNull(form.video_url), product_value: pv, cash_payment: cash,
      paid_on: orNull(form.paid_on), status: form.status, notes: orNull(form.notes),
    }
    try {
      let saved: ProductRecord
      if (isNew) {
        const { data, error } = await supabase.from('product_records').insert(payload).select().single()
        if (error) throw error
        saved = data as ProductRecord
      } else {
        const { data, error } = await supabase.from('product_records').update(payload).eq('id', id).select().single()
        if (error) throw error
        saved = data as ProductRecord
      }
      const inv = await uploadInvoice(saved.id)
      if (inv) {
        const old = saved.invoice_path
        const { error } = await supabase.from('product_records').update(inv).eq('id', saved.id)
        if (error) throw error
        if (old) await supabase.storage.from('invoices').remove([old])
      }
      nav('/panel/registros')
    } catch (e) {
      setError((e as Error).message)
      setBusy(false)
    }
  }

  async function removeInvoice() {
    if (!record?.invoice_path || !confirm('¿Quitar la factura adjunta? El archivo se borrará.')) return
    await supabase.storage.from('invoices').remove([record.invoice_path])
    const { data } = await supabase
      .from('product_records')
      .update({ invoice_path: null, invoice_name: null, invoice_mime: null, invoice_size: null })
      .eq('id', record.id).select().single()
    setRecord(data as ProductRecord)
  }

  async function onDelete() {
    if (!record || !confirm(`¿Borrar "${record.product}"? Esta acción no se puede deshacer.`)) return
    setBusy(true)
    if (record.invoice_path) await supabase.storage.from('invoices').remove([record.invoice_path])
    const { error } = await supabase.from('product_records').delete().eq('id', record.id)
    if (error) {
      setBusy(false)
      return setError(error.message)
    }
    nav('/panel/registros')
  }

  if (loading) return <Spinner />
  if (!isNew && !record) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Alert kind="error">{error ?? 'No se encontró el registro.'}</Alert>
        <Link to="/panel/registros" className="text-sm text-accent underline">Volver a registros</Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{isNew ? 'Nuevo registro' : 'Editar registro'}</h1>
        <Link to="/panel/registros" className="text-sm text-muted underline">Volver</Link>
      </div>

      <Card className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Input label="Producto" required maxLength={160} value={form.product} onChange={set('product')} /></div>
        <Input label="Marca" maxLength={80} value={form.brand} onChange={set('brand')} />
        <Input label="Campaña" maxLength={120} value={form.campaign} onChange={set('campaign')} />
        <Select label="Plataforma" value={form.platform} onChange={set('platform')}>
          {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
        </Select>
        <Select label="Estado de la campaña" value={form.status} onChange={set('status')}>
          {RECORD_STATUSES.map((s) => <option key={s} value={s}>{RECORD_STATUS_LABEL[s]}</option>)}
        </Select>
        <Input label="Fecha en que recibí el producto" type="date" required value={form.received_on} onChange={set('received_on')} />
        <Input label="Fecha límite para publicar" type="date" value={form.deadline_on} onChange={set('deadline_on')} />
      </Card>

      <Card className="grid gap-4 sm:grid-cols-3">
        <Input label="Valor del producto (USD)" inputMode="decimal" placeholder="Pendiente" value={form.product_value} onChange={set('product_value')} hint="Valor comercial: cuenta como ingreso en especie. Vacío = pendiente." />
        <Input label="Pago en efectivo (USD)" inputMode="decimal" value={form.cash_payment} onChange={set('cash_payment')} />
        <Input label="Fecha del pago" type="date" value={form.paid_on} onChange={set('paid_on')} />
      </Card>

      <Card className="grid gap-4">
        <Input label="Link del producto" type="url" placeholder="https://" value={form.product_url} onChange={set('product_url')} />
        <Input label="Link de la orden de compra" type="url" placeholder="https://www.amazon.com/…" value={form.order_url} onChange={set('order_url')} hint="Si compraste el producto y la campaña te lo reembolsa." />
        <Input label="Link del video publicado" type="url" placeholder="https://" value={form.video_url} onChange={set('video_url')} />
        <Textarea label="Notas" maxLength={4000} value={form.notes} onChange={set('notes')} />
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold">Factura de compra</h2>
        <p className="text-xs text-muted">
          PDF o imagen (JPG, PNG, WebP). Máximo {formatBytes(INVOICE_MAX_BYTES)} por archivo; las fotos más grandes se reducen automáticamente.
          Se guarda en almacenamiento privado y solo se abre con un enlace temporal.
        </p>
        {record?.invoice_path && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-surface-2 p-3 text-sm">
            <span className="flex-1 truncate">📎 {record.invoice_name} {record.invoice_size ? `(${formatBytes(record.invoice_size)})` : ''}</span>
            <button type="button" className="rounded-lg border border-line px-3 py-1.5" onClick={() => openInvoice(record.invoice_path!).catch((e) => setError(e.message))}>Ver</button>
            <button type="button" className="rounded-lg border border-line px-3 py-1.5" onClick={() => openInvoice(record.invoice_path!, record.invoice_name ?? 'factura').catch((e) => setError(e.message))}>Descargar</button>
            <button type="button" className="rounded-lg px-3 py-1.5 text-bad" onClick={removeInvoice}>Quitar</button>
          </div>
        )}
        <label className="block text-sm">
          <span className="mb-1.5 block font-medium">{record?.invoice_path ? 'Reemplazar factura' : 'Adjuntar factura'}</span>
          <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => onPickFile(e.target.files?.[0])} className="block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-2 file:px-3 file:py-2 file:text-ink" />
        </label>
        {file && <p className="text-xs text-ok">Listo para subir: {file.name} ({formatBytes(file.size)})</p>}
        {fileNote && <p className="text-xs text-muted">{fileNote}</p>}
      </Card>

      {error && <Alert kind="error">{error}</Alert>}
      <div className="flex flex-wrap justify-between gap-3">
        <Button disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</Button>
        {!isNew && <Button type="button" variant="danger" onClick={onDelete} disabled={busy}>Borrar registro</Button>}
      </div>
    </form>
  )
}
