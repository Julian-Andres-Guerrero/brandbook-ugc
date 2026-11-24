import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Spinner, btn } from '../../components/ui'
import { logEvent } from '../../lib/auth'
import { downloadBlob } from '../../lib/files'
import { availableYears, computeTotals, filterRecords, toCsv, usd, type RecordFilters } from '../../lib/records'
import { PLATFORMS, PLATFORM_LABEL, RECORD_STATUS_LABEL, type Platform } from '../../lib/types'
import { YearSelect } from './Dashboard'
import { useRecords } from './useRecords'

const statusStyle = { received: 'bg-surface-2 text-ink', video_pending: 'bg-warn/15 text-warn', published: 'bg-accent/15 text-accent', paid: 'bg-ok/15 text-ok' }

export default function Records() {
  const { records, error } = useRecords()
  const [f, setF] = useState<RecordFilters>({ year: new Date().getFullYear(), platform: 'all', q: '' })
  const rows = useMemo(() => filterRecords(records ?? [], f), [records, f])
  const totals = computeTotals(rows)

  if (error) return <Alert kind="error">{error}</Alert>
  if (!records) return <Spinner />

  const exportCsv = () => {
    const name = `registros-${f.year}${f.platform !== 'all' ? `-${f.platform}` : ''}.csv`
    downloadBlob(toCsv(rows), name, 'text/csv;charset=utf-8')
    logEvent('export', { format: 'csv', rows: rows.length }).catch(() => {})
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Registros</h1>
        <div className="flex gap-2">
          <button onClick={exportCsv} className={btn.secondary} disabled={!rows.length}>Exportar CSV</button>
          <Link to="/panel/registros/nuevo" className={btn.primary}>+ Nuevo</Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-3">
        <label className="flex min-w-48 flex-1 items-center">
          <span className="sr-only">Buscar</span>
          <input
            type="search"
            placeholder="Buscar producto, marca, campaña o nota…"
            value={f.q}
            onChange={(e) => setF({ ...f, q: e.target.value })}
            className="w-full rounded-lg border border-line bg-bg px-3 py-1.5 text-sm"
          />
        </label>
        <YearSelect years={availableYears(records)} value={f.year} onChange={(year) => setF({ ...f, year })} allowAll />
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Plataforma</span>
          <select value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value as Platform | 'all' })} className="rounded-lg border border-line bg-bg px-2 py-1.5">
            <option value="all">Todas</option>
            {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
          </select>
        </label>
      </div>

      <p className="text-sm text-muted" aria-live="polite">
        {rows.length} registros · Productos {usd(totals.productValue)} · Efectivo {usd(totals.cash)} · <strong className="text-ink">Total {usd(totals.total)}</strong>
      </p>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">No hay registros con estos filtros.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[760px] text-left text-sm">
            <caption className="sr-only">Registros de productos e ingresos</caption>
            <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Recibido</th>
                <th scope="col" className="px-4 py-3">Producto</th>
                <th scope="col" className="px-4 py-3">Plataforma</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Valor producto</th>
                <th scope="col" className="px-4 py-3 text-right">Efectivo</th>
                <th scope="col" className="px-4 py-3 text-center">Factura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-surface">
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{r.received_on}</td>
                  <td className="px-4 py-3">
                    <Link to={`/panel/registros/${r.id}`} className="font-medium hover:underline">{r.product}</Link>
                    <p className="text-xs text-muted">{[r.brand, r.campaign].filter(Boolean).join(' · ')}</p>
                  </td>
                  <td className="px-4 py-3">{PLATFORM_LABEL[r.platform]}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle[r.status]}`}>{RECORD_STATUS_LABEL[r.status]}</span></td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.product_value == null ? <span className="text-warn">Pendiente</span> : usd(r.product_value)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{usd(r.cash_payment)}</td>
                  <td className="px-4 py-3 text-center">{r.invoice_path ? <span title={r.invoice_name ?? ''}>📎<span className="sr-only">Sí</span></span> : <span className="text-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
