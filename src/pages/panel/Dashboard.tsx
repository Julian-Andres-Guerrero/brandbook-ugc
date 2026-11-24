import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Card, Spinner, btn } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { availableYears, breakdownByPlatform, computeTotals, fiscalYear, pendingVideos, usd } from '../../lib/records'
import { RECORD_STATUS_LABEL } from '../../lib/types'
import { FinanceDisclaimer } from './PanelLayout'
import { useRecords } from './useRecords'

const urgencyStyle = { overdue: 'text-bad', soon: 'text-warn', ok: 'text-ok', none: 'text-muted' }

export function YearSelect({ years, value, onChange, allowAll = false }: { years: number[]; value: number | 'all'; onChange: (v: number | 'all') => void; allowAll?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-muted">Año fiscal</span>
      <select value={value} onChange={(e) => onChange(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="rounded-lg border border-line bg-bg px-2 py-1.5">
        {allowAll && <option value="all">Todos</option>}
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </label>
  )
}

export default function Dashboard() {
  const { profile } = useAuth()
  const { records, error } = useRecords()
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const yearRecords = useMemo(() => (records ?? []).filter((r) => fiscalYear(r) === year), [records, year])
  const totals = computeTotals(yearRecords)
  const byPlatform = breakdownByPlatform(yearRecords)
  const pending = pendingVideos(records ?? [])

  if (error) return <Alert kind="error">{error}</Alert>
  if (!records) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Hola{profile ? `, ${profile.display_name.split(' ')[0]}` : ''}</h1>
          <p className="text-sm text-muted">Tu contabilidad privada. Nada de esto aparece en tu perfil público.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <YearSelect years={availableYears(records)} value={year} onChange={(v) => setYear(v as number)} />
          <Link to="/panel/registros/nuevo" className={btn.primary}>+ Nuevo registro</Link>
        </div>
      </div>

      <section aria-label="Totales del año" className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Valor en productos</p>
          <p className="mt-1 text-3xl font-bold">{usd(totals.productValue)}</p>
          {totals.pendingValues > 0 && <p className="mt-1 text-xs text-warn">{totals.pendingValues} con valor pendiente</p>}
        </Card>
        <Card>
          <p className="text-sm text-muted">Pagos en efectivo</p>
          <p className="mt-1 text-3xl font-bold">{usd(totals.cash)}</p>
        </Card>
        <Card className="border-accent/50">
          <p className="text-sm text-muted">Total general {year}</p>
          <p className="mt-1 text-3xl font-bold text-accent">{usd(totals.total)}</p>
          <p className="mt-1 text-xs text-muted">{totals.count} registros</p>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Videos pendientes</h2>
          <p className="text-xs text-muted">Ordenados por fecha límite, el más urgente primero.</p>
          {pending.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No tienes videos pendientes.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line">
              {pending.map(({ record: r, days, urgency }) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <Link to={`/panel/registros/${r.id}`} className="block truncate font-medium hover:underline">{r.product}</Link>
                    <p className="text-xs text-muted">{[r.brand, RECORD_STATUS_LABEL[r.status]].filter(Boolean).join(' · ')}</p>
                  </div>
                  <p className={`shrink-0 text-right text-sm font-semibold ${urgencyStyle[urgency]}`}>
                    {days == null ? 'Sin fecha' : days < 0 ? `Vencido hace ${-days} d` : days === 0 ? 'Hoy' : `${days} días`}
                    {r.deadline_on && <span className="block text-xs font-normal text-muted">{r.deadline_on}</span>}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">¿De dónde vienen tus ingresos? ({year})</h2>
            <Link to={`/panel/resumen-fiscal?year=${year}`} className="text-sm text-accent underline">Resumen fiscal</Link>
          </div>
          {byPlatform.length === 0 ? (
            <p className="mt-4 text-sm text-muted">Sin registros este año.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {byPlatform.map((p) => (
                <li key={p.platform}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{p.label}</span>
                    <span>{usd(p.total)}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                    <div className="h-full rounded-full bg-accent" style={{ width: `${totals.total ? (p.total / totals.total) * 100 : 0}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted">Productos {usd(p.productValue)} · Efectivo {usd(p.cash)}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <FinanceDisclaimer />
    </div>
  )
}
