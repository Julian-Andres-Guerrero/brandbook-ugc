import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import type { ProductRecord } from '../../lib/types'

const normalize = (r: ProductRecord): ProductRecord => ({
  ...r,
  product_value: r.product_value == null ? null : Number(r.product_value),
  cash_payment: Number(r.cash_payment ?? 0),
})

/** Carga los registros del usuario. RLS garantiza que solo llegan los suyos. */
export function useRecords() {
  const [records, setRecords] = useState<ProductRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const reload = useCallback(async () => {
    const { data, error } = await supabase.from('product_records').select('*').order('received_on', { ascending: false })
    if (error) setError(error.message)
    else setRecords((data as ProductRecord[]).map(normalize))
  }, [])
  useEffect(() => {
    reload()
  }, [reload])
  return { records, error, reload }
}

export async function openInvoice(path: string, downloadName?: string) {
  // Enlace firmado de 60 segundos: la factura nunca tiene URL pública permanente.
  const { data, error } = await supabase.storage
    .from('invoices')
    .createSignedUrl(path, 60, downloadName ? { download: downloadName } : undefined)
  if (error || !data) throw new Error(error?.message ?? 'No se pudo abrir la factura')
  if (downloadName) window.location.assign(data.signedUrl)
  else window.open(data.signedUrl, '_blank', 'noopener')
}
