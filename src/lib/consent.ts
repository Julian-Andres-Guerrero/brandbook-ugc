// Consentimiento de cookies. Las cookies/scripts NO esenciales (analítica) no se
// cargan hasta que el visitante las acepta, y puede retirar el permiso cuando quiera.
export type Consent = { analytics: boolean; decidedAt: string; version: 1 }
const KEY = 'cookie-consent'
const listeners = new Set<() => void>()

export function getConsent(): Consent | null {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Consent | null
    return c?.version === 1 ? c : null
  } catch {
    return null
  }
}

export function setConsent(analytics: boolean) {
  const c: Consent = { analytics, decidedAt: new Date().toISOString(), version: 1 }
  localStorage.setItem(KEY, JSON.stringify(c))
  applyConsent()
  listeners.forEach((l) => l())
  // Si se retira el permiso, recargar descarga los scripts ya cargados.
  if (!analytics && document.getElementById('cf-analytics')) window.location.reload()
}

export function onConsentChange(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const openCookieSettings = () => window.dispatchEvent(new Event('open-cookie-settings'))

/** Carga la analítica (Cloudflare Web Analytics, sin cookies de rastreo) solo con permiso. */
export function applyConsent() {
  const token = import.meta.env.VITE_CF_ANALYTICS_TOKEN
  if (!token || !getConsent()?.analytics || document.getElementById('cf-analytics')) return
  const s = document.createElement('script')
  s.id = 'cf-analytics'
  s.defer = true
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js'
  s.dataset.cfBeacon = JSON.stringify({ token })
  document.head.appendChild(s)
}
