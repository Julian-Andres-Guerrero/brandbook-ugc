import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom'
import { SITE_NAME } from '../../config'
import { Footer, Logo } from '../../components/Layout'
import { Spinner } from '../../components/ui'
import { useMeta } from '../../components/useMeta'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

const links = [
  { to: '/panel', label: 'Resumen', end: true },
  { to: '/panel/registros', label: 'Registros' },
  { to: '/panel/resumen-fiscal', label: 'Resumen fiscal' },
  { to: '/panel/campanas', label: 'Campañas públicas' },
  { to: '/panel/perfil', label: 'Mi perfil' },
  { to: '/panel/cuenta', label: 'Cuenta y seguridad' },
]

/** Todo lo que está bajo /panel exige sesión (y 2FA si el usuario lo activó). */
export default function PanelLayout() {
  const { loading, session, needsMfa, profile } = useAuth()
  const location = useLocation()
  useMeta('Panel', { noindex: true })

  if (loading) return <Spinner />
  if (!session || needsMfa) return <Navigate to="/entrar" replace state={{ from: location.pathname }} />

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only-focusable fixed left-2 top-2 z-50 rounded bg-accent px-3 py-2 text-accent-ink">Ir al contenido</a>
      <header className="no-print border-b border-line/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Logo />
          <div className="flex items-center gap-2 text-sm">
            {profile && (
              <a href={`/@${profile.username}`} target="_blank" rel="noopener" className="hidden rounded-lg border border-line px-3 py-1.5 text-muted hover:text-ink sm:inline">
                Ver mi perfil público ↗
              </a>
            )}
            <button onClick={() => supabase.auth.signOut()} className="rounded-lg px-3 py-1.5 text-muted hover:text-ink">Salir</button>
          </div>
        </div>
        <nav aria-label="Panel" className="mx-auto max-w-6xl overflow-x-auto px-2">
          <ul className="flex gap-1 whitespace-nowrap pb-2">
            {links.map((l) => (
              <li key={l.to}>
                <NavLink
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-surface-2 font-semibold text-ink' : 'text-muted hover:text-ink'}`
                  }
                >
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export function FinanceDisclaimer() {
  return (
    <p className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-xs text-muted">
      Los totales e informes son una herramienta de registro personal. {SITE_NAME} no es un servicio de contabilidad ni de asesoría fiscal:
      confirma con tu contador cómo declarar los productos recibidos y los pagos.
    </p>
  )
}
