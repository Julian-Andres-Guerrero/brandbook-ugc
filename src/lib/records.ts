// Lógica pura del panel (sin red): filtros, totales, pendientes y CSV.
// Está separada de la interfaz para poder probarla con Vitest.
import { PLATFORM_LABEL, RECORD_STATUS_LABEL, type Platform, type ProductRecord } from './types'

export type RecordFilters = { year: number | 'all'; platform: Platform | 'all'; q: string }

/** Año fiscal de un registro: el año en que se recibió el producto. */
export const fiscalYear = (r: Pick<ProductRecord, 'received_on'>) => Number(r.received_on.slice(0, 4))

export const money = (n: number | null | undefined) => (n == null ? null : Math.round(Number(n) * 100) / 100)

export function filterRecords(records: ProductRecord[], f: RecordFilters): ProductRecord[] {
  const q = f.q.trim().toLowerCase()
  return records.filter((r) => {
    if (f.year !== 'all' && fiscalYear(r) !== f.year) return false
    if (f.platform !== 'all' && r.platform !== f.platform) return false
    if (!q) return true
    return [r.product, r.brand, r.campaign, r.notes, PLATFORM_LABEL[r.platform]]
      .filter(Boolean)
      .some((v) => v!.toLowerCase().includes(q))
  })
}

export type Totals = { productValue: number; cash: number; total: number; count: number; pendingValues: number }

const cents = (n: number | null | undefined) => Math.round(Number(n ?? 0) * 100)

export function computeTotals(records: ProductRecord[]): Totals {
  let pv = 0
  let cash = 0
  let pendingValues = 0
  for (const r of records) {
    if (r.product_value == null) pendingValues++
    pv += cents(r.product_value)
    cash += cents(r.cash_payment)
  }
  return { productValue: pv / 100, cash: cash / 100, total: (pv + cash) / 100, count: records.length, pendingValues }
}

export type PlatformBreakdown = { platform: Platform; label: string } & Totals

export function breakdownByPlatform(records: ProductRecord[]): PlatformBreakdown[] {
  const groups = new Map<Platform, ProductRecord[]>()
  for (const r of records) groups.set(r.platform, [...(groups.get(r.platform) ?? []), r])
  return [...groups.entries()]
    .map(([platform, rs]) => ({ platform, label: PLATFORM_LABEL[platform], ...computeTotals(rs) }))
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label))
}

export function availableYears(records: ProductRecord[], today = new Date()): number[] {
  const ys = new Set(records.map(fiscalYear))
  ys.add(today.getFullYear())
  return [...ys].sort((a, b) => b - a)
}

/** Días entre hoy y una fecha YYYY-MM-DD (negativo = vencida). */
export function daysUntil(date: string, today = new Date()): number {
  const [y, m, d] = date.split('-').map(Number)
  const target = Date.UTC(y, m - 1, d)
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target - now) / 86_400_000)
}

export type PendingItem = { record: ProductRecord; days: number | null; urgency: 'overdue' | 'soon' | 'ok' | 'none' }

/** Campañas con video sin publicar, ordenadas por urgencia (vencidas primero, sin fecha al final). */
export function pendingVideos(records: ProductRecord[], today = new Date()): PendingItem[] {
  return records
    .filter((r) => r.status === 'received' || r.status === 'video_pending')
    .map((record) => {
      const days = record.deadline_on ? daysUntil(record.deadline_on, today) : null
      const urgency: PendingItem['urgency'] = days == null ? 'none' : days < 0 ? 'overdue' : days <= 7 ? 'soon' : 'ok'
      return { record, days, urgency }
    })
    .sort((a, b) => (a.days ?? Infinity) - (b.days ?? Infinity))
}

function csvCell(v: unknown): string {
  if (v == null) return ''
  let s = String(v)
  // Evita inyección de fórmulas al abrir el CSV en Excel/Sheets.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const CSV_COLUMNS: { key: string; label: string; get: (r: ProductRecord) => unknown }[] = [
  { key: 'received_on', label: 'Fecha recibido', get: (r) => r.received_on },
  { key: 'product', label: 'Producto', get: (r) => r.product },
  { key: 'brand', label: 'Marca', get: (r) => r.brand },
  { key: 'campaign', label: 'Campaña', get: (r) => r.campaign },
  { key: 'platform', label: 'Plataforma', get: (r) => PLATFORM_LABEL[r.platform] },
  { key: 'status', label: 'Estado', get: (r) => RECORD_STATUS_LABEL[r.status] },
  { key: 'deadline_on', label: 'Fecha límite', get: (r) => r.deadline_on },
  { key: 'product_value', label: 'Valor producto USD', get: (r) => (r.product_value == null ? '' : Number(r.product_value).toFixed(2)) },
  { key: 'cash_payment', label: 'Pago efectivo USD', get: (r) => Number(r.cash_payment).toFixed(2) },
  { key: 'paid_on', label: 'Fecha de pago', get: (r) => r.paid_on },
  { key: 'product_url', label: 'Link producto', get: (r) => r.product_url },
  { key: 'order_url', label: 'Link orden', get: (r) => r.order_url },
  { key: 'video_url', label: 'Link video', get: (r) => r.video_url },
  { key: 'invoice', label: 'Factura adjunta', get: (r) => (r.invoice_path ? r.invoice_name ?? 'sí' : '') },
  { key: 'notes', label: 'Notas', get: (r) => r.notes },
]

export function toCsv(records: ProductRecord[]): string {
  const head = CSV_COLUMNS.map((c) => csvCell(c.label)).join(',')
  const rows = records.map((r) => CSV_COLUMNS.map((c) => csvCell(c.get(r))).join(','))
  // BOM para que Excel abra bien las tildes.
  return '﻿' + [head, ...rows].join('\r\n') + '\r\n'
}

export const usd = (n: number | null | undefined) =>
  n == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n))
