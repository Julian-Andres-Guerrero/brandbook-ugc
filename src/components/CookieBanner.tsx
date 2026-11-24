import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getConsent, setConsent } from '../lib/consent'
import { useLang } from '../lib/i18n'

/** Aviso de cookies: nada opcional se activa sin un "sí" explícito. */
export function CookieBanner() {
  const { t } = useLang()
  const [open, setOpen] = useState(() => getConsent() === null)
  const [custom, setCustom] = useState(false)
  const [analytics, setAnalytics] = useState(() => getConsent()?.analytics ?? false)

  useEffect(() => {
    const show = () => {
      setAnalytics(getConsent()?.analytics ?? false)
      setCustom(true)
      setOpen(true)
    }
    window.addEventListener('open-cookie-settings', show)
    return () => window.removeEventListener('open-cookie-settings', show)
  }, [])

  if (!open) return null
  const decide = (a: boolean) => {
    setConsent(a)
    setOpen(false)
  }

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="cookie-title" className="no-print fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border border-line bg-surface-2 p-5 shadow-2xl shadow-black/50 sm:inset-x-6">
      <h2 id="cookie-title" className="font-semibold">{t('cookie_title')}</h2>
      <p className="mt-1 text-sm text-muted">
        {t('cookie_text')}{' '}
        <Link to="/legal/cookies" className="text-accent underline">{t('cookie_more')}</Link>
      </p>
      {custom && (
        <fieldset className="mt-3 space-y-2 text-sm">
          <legend className="sr-only">{t('cookie_title')}</legend>
          <label className="flex items-center gap-2 text-muted">
            <input type="checkbox" checked disabled className="size-4" /> {t('cookie_essential')}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="size-4 accent-[var(--color-accent)]" />
            {t('cookie_analytics')}
          </label>
        </fieldset>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button className="rounded-xl border border-line px-4 py-2 text-sm font-medium hover:border-muted" onClick={() => decide(false)}>
          {t('cookie_reject')}
        </button>
        {custom ? (
          <button className="rounded-xl border border-line px-4 py-2 text-sm font-medium hover:border-muted" onClick={() => decide(analytics)}>
            {t('cookie_save')}
          </button>
        ) : (
          <button className="rounded-xl border border-line px-4 py-2 text-sm font-medium hover:border-muted" onClick={() => setCustom(true)}>
            {t('footer_cookie_prefs')}
          </button>
        )}
        <button className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-ink" onClick={() => decide(true)}>
          {t('cookie_accept')}
        </button>
      </div>
    </div>
  )
}
