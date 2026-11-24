import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Alert, Spinner, btn } from '../../components/ui'
import { useAuth } from '../../lib/auth'
import { availableYears, breakdownByPlatform, computeTotals, fiscalYear, usd } from '../../lib/records'
import { PLATFORM_LABEL } from '../../lib/types'
import { YearSelect } from './Dashboard'
import { FinanceDisclaimer } from './PanelLayout'
import { useRecords } from './useRecords'

/** Página limpia e imprimible (o "Guardar como PDF") para entregar al contador. */
export default function FiscalSummary() {
  const { profile, session } = useAuth()
  const { records, error } = useRecords()
  const [params, setParams] = useSearchParams()
  const year = Number(params.get('year')) || new Date().getFullYear()
  const rows = useMemo(() => (records ?? []).filter((r) => fiscalYear(r) === year).sort((a, b) => a.received_on.localeCompare(b.received_on)), [records, year])
  const totals = computeTotals(rows)
  const byPlatform = breakdownByPlatform(rows)

  if (error) return <Alert kind="error">{error}</Alert>
  if (!records) return <Spinner />

  const cell = 'px-3 py-2 border-b border-line print-plain'
  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <YearSelect years={availableYears(records)} value={year} onChange={(y) => setParams({ year: String(y) })} />
        <button onClick={() => window.print()} className={btn.secondary}>Imprimir / Guardar PDF</button>
      </div>

      <article className="print-plain space-y-6 rounded-2xl border border-line bg-surface p-6">
        <header>
          <h1 className="text-2xl font-bold">Resumen de ingresos {year}</h1>
          <p className="text-sm text-muted print-plain">
            {profile?.display_name} · {session?.user.email} · Generado el {new Date().toLocaleDateString('es-CO')} · Valores en USD
          </p>
        </header>

        <section>
          <h2 className="mb-2 font-semibold">Totales por tipo de ingreso</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr><th scope="row" className={`${cell} text-left font-normal`}>Ingreso en especie (valor de productos recibidos)</th><td className={`${cell} text-right tabular-nums`}>{usd(totals.productValue)}</td></tr>
              <tr><th scope="row" className={`${cell} text-left font-normal`}>Pagos en efectivo</th><td className={`${cell} text-right tabular-nums`}>{usd(totals.cash)}</td></tr>
              <tr><th scope="row" className={`${cell} text-left font-bold`}>Total general</th><td className={`${cell} text-right font-bold tabular-nums`}>{usd(totals.total)}</td></tr>
            </tbody>
          </table>
          {totals.pendingValues > 0 && (
            <p className="mt-2 text-xs text-warn print-plain">Atención: {totals.pendingValues} registro(s) sin valor de producto. El total en especie puede estar incompleto.</p>
          )}
        </section>

        <section>
          <h2 className="mb-2 font-semibold">Por plataforma</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted print-plain">
                <th scope="col" className={cell}>Plataforma</th>
                <th scope="col" className={`${cell} text-right`}>Registros</th>
                <th scope="col" className={`${cell} text-right`}>Productos</th>
                <th scope="col" className={`${cell} text-right`}>Efectivo</th>
                <th scope="col" className={`${cell} text-right`}>Total</th>
              </tr>
            </thead>
            <tbody>
              {byPlatform.map((p) => (
                <tr key={p.platform}>
                  <th scope="row" className={`${cell} text-left font-normal`}>{p.label}</th>
                  <td className={`${cell} text-right`}>{p.count}</td>
                  <td className={`${cell} text-right tabular-nums`}>{usd(p.productValue)}</td>
                  <td className={`${cell} text-right tabular-nums`}>{usd(p.cash)}</td>
                  <td className={`${cell} text-right font-semibold tabular-nums`}>{usd(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-2 font-semibold">Detalle ({rows.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-xs">
              <thead>
                <tr className="text-left uppercase text-muted print-plain">
                  <th scope="col" className={cell}>Fecha</th>
                  <th scope="col" className={cell}>Producto</th>
                  <th scope="col" className={cell}>Marca</th>
                  <th scope="col" className={cell}>Plataforma</th>
                  <th scope="col" className={`${cell} text-right`}>Producto</th>
                  <th scope="col" className={`${cell} text-right`}>Efectivo</th>
                  <th scope="col" className={cell}>Factura</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className={cell}>{r.received_on}</td>
                    <td className={cell}>{r.product}</td>
                    <td className={cell}>{r.brand ?? '—'}</td>
                    <td className={cell}>{PLATFORM_LABEL[r.platform]}</td>
                    <td className={`${cell} text-right tabular-nums`}>{r.product_value == null ? 'Pendiente' : usd(r.product_value)}</td>
                    <td className={`${cell} text-right tabular-nums`}>{usd(r.cash_payment)}</td>
                    <td className={cell}>{r.invoice_path ? 'Sí' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <FinanceDisclaimer />
      </article>
    </div>
  )
}
