import { describe, expect, it } from 'vitest'
import { breakdownByPlatform, computeTotals, filterRecords, pendingVideos, toCsv } from './records'
import type { ProductRecord } from './types'

const base: ProductRecord = {
  id: '1', user_id: 'u', product: 'P', brand: null, campaign: null, platform: 'stackinfluence',
  received_on: '2026-11-15', deadline_on: null, product_url: null, order_url: null, video_url: null,
  product_value: null, cash_payment: 0, paid_on: null, status: 'received', notes: null,
  invoice_path: null, invoice_name: null, invoice_mime: null, invoice_size: null, created_at: '', updated_at: '',
}
const r = (o: Partial<ProductRecord>): ProductRecord => ({ ...base, ...o })

// Los 3 registros reales de Julian
const julian = [
  r({ id: 'a', product: 'Game Night Kit (palomera)', brand: 'Topline', cash_payment: 20.5, status: 'paid' }),
  r({ id: 'b', product: 'Kit de blanqueamiento dental con luz LED', received_on: '2026-11-18', deadline_on: '2026-12-28', product_value: 36.25 }),
  r({ id: 'c', product: 'Mushroom Coffee', brand: 'Paleovalley', received_on: '2026-11-19', deadline_on: '2026-12-26', status: 'video_pending' }),
]

describe('totales', () => {
  it('suma productos y efectivo sin errores de coma flotante', () => {
    expect(computeTotals(julian)).toEqual({ productValue: 36.25, cash: 20.5, total: 56.75, count: 3, pendingValues: 2 })
    expect(computeTotals([r({ cash_payment: 0.1 }), r({ cash_payment: 0.2 })]).cash).toBe(0.3)
  })
  it('desglosa por plataforma', () => {
    const b = breakdownByPlatform([...julian, r({ platform: 'sideshift', cash_payment: 100 })])
    expect(b.map((x) => x.label)).toEqual(['SideShift', 'StackInfluence'])
    expect(b[1].total).toBe(56.75)
  })
})

describe('filtros', () => {
  it('filtra por año, plataforma y texto', () => {
    const all = [...julian, r({ id: 'd', received_on: '2025-03-01', platform: 'collabstr', product: 'Otro' })]
    expect(filterRecords(all, { year: 2026, platform: 'all', q: '' })).toHaveLength(3)
    expect(filterRecords(all, { year: 'all', platform: 'collabstr', q: '' })).toHaveLength(1)
    expect(filterRecords(all, { year: 'all', platform: 'all', q: 'paleo' }).map((x) => x.id)).toEqual(['c'])
  })
})

describe('pendientes', () => {
  it('ordena por fecha límite, la más urgente primero', () => {
    const p = pendingVideos(julian, new Date(2026, 11, 20))
    expect(p.map((x) => x.record.id)).toEqual(['c', 'b'])
    expect(p[0]).toMatchObject({ days: 6, urgency: 'soon' })
    expect(pendingVideos(julian, new Date(2026, 11, 27))[0].urgency).toBe('overdue')
  })
})

describe('CSV', () => {
  it('escapa comillas, comas y fórmulas', () => {
    const csv = toCsv([r({ product: 'Kit "pro", 2', notes: '=HYPERLINK("x")' })])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv).toContain('"Kit ""pro"", 2"')
    expect(csv).toContain(`"'=HYPERLINK(""x"")"`)
  })
})
