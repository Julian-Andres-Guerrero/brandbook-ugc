import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { SITE_NAME } from '../config'
import { useAuth } from '../lib/auth'
import { openCookieSettings } from '../lib/consent'
import { useLang } from '../lib/i18n'

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
      <img src="/favicon.svg" alt="" className="size-7" />
      <span>{SITE_NAME}</span>
    </Link>
  )
}

export function LangToggle() {
  const { lang, setLang, t } = useLang()
  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
      className="rounded-lg border border-line px-2.5 py-1 text-sm text-muted hover:text-ink"
      aria-label={lang === 'en' ? 'Cambiar a español' : 'Switch to English'}
    >
      {t('lang_switch')}
    </button>
  )
}

export function Footer() {
  const { t } = useLang()
  const link = 'text-muted hover:text-ink underline-offset-4 hover:underline'
  return (
    <footer className="no-print mt-16 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
          <NavLink to="/legal/terminos" className={link}>{t('footer_terms')}</NavLink>
          <NavLink to="/legal/privacidad" className={link}>{t('footer_privacy')}</NavLink>
          <NavLink to="/legal/cookies" className={link}>{t('footer_cookies')}</NavLink>
          <NavLink to="/legal/contenido" className={link}>{t('footer_content')}</NavLink>
          <button onClick={openCookieSettings} className={link}>{t('footer_cookie_prefs')}</button>
        </nav>
        <p className="text-xs text-muted">© {new Date().getFullYear()} {SITE_NAME}</p>
      </div>
      <p className="mx-auto max-w-5xl px-4 pb-8 text-xs text-muted">{t('footer_note')}</p>
    </footer>
  )
}

export function PublicLayout({ children, bare = false }: { children: ReactNode; bare?: boolean }) {
  const { t } = useLang()
  const { session } = useAuth()
  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only-focusable fixed left-2 top-2 z-50 rounded bg-accent px-3 py-2 text-accent-ink">
        Skip to content / Ir al contenido
      </a>
      <header className="no-print border-b border-line/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <LangToggle />
            {!bare &&
              (session ? (
                <Link to="/panel" className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink">{t('nav_panel')}</Link>
              ) : (
                <Link to="/entrar" className="rounded-lg px-3 py-1.5 text-sm text-muted hover:text-ink">{t('nav_login')}</Link>
              ))}
          </div>
        </div>
      </header>
      <main id="main" className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
