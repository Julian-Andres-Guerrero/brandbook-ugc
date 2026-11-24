import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { CookieBanner } from './components/CookieBanner'
import { Spinner } from './components/ui'
import { AuthProvider } from './lib/auth'
import { applyConsent } from './lib/consent'
import { LangProvider } from './lib/i18n'
import { supabaseMissing } from './lib/supabase'
import Home from './pages/public/Home'
import NotFound from './pages/public/NotFound'
import Profile from './pages/public/Profile'
import { LegalPage } from './pages/legal/LegalPage'
import { content, cookies, privacy, terms } from './pages/legal/docs'

// El panel se carga aparte: los visitantes de un perfil público no descargan su código.
const Login = lazy(() => import('./pages/auth/Login'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'))
const PanelLayout = lazy(() => import('./pages/panel/PanelLayout'))
const Dashboard = lazy(() => import('./pages/panel/Dashboard'))
const Records = lazy(() => import('./pages/panel/Records'))
const RecordForm = lazy(() => import('./pages/panel/RecordForm'))
const FiscalSummary = lazy(() => import('./pages/panel/FiscalSummary'))
const ProfileEdit = lazy(() => import('./pages/panel/ProfileEdit'))
const Campaigns = lazy(() => import('./pages/panel/Campaigns'))
const Account = lazy(() => import('./pages/panel/Account'))

/** /@usuario es un perfil; cualquier otra ruta desconocida es 404. */
function HandleRoute() {
  const { handle = '' } = useParams()
  return handle.startsWith('@') ? <Profile /> : <NotFound />
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <h1 className="text-2xl font-bold">Falta configurar Supabase</h1>
      <p className="mt-3 text-muted">
        Copia <code>.env.example</code> como <code>.env.local</code> y llena <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.
        Los pasos completos están en el README.
      </p>
    </div>
  )
}

export default function App() {
  useEffect(() => {
    applyConsent()
  }, [])
  if (supabaseMissing) return <SetupNotice />
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/entrar" element={<Login />} />
              <Route path="/registro" element={<Signup />} />
              <Route path="/recuperar" element={<ForgotPassword />} />
              <Route path="/nueva-clave" element={<ResetPassword />} />
              <Route path="/legal/terminos" element={<LegalPage doc={terms} />} />
              <Route path="/legal/privacidad" element={<LegalPage doc={privacy} />} />
              <Route path="/legal/cookies" element={<LegalPage doc={cookies} />} />
              <Route path="/legal/contenido" element={<LegalPage doc={content} />} />
              <Route path="/panel" element={<PanelLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="registros" element={<Records />} />
                <Route path="registros/nuevo" element={<RecordForm />} />
                <Route path="registros/:id" element={<RecordForm key="edit" />} />
                <Route path="resumen-fiscal" element={<FiscalSummary />} />
                <Route path="perfil" element={<ProfileEdit />} />
                <Route path="campanas" element={<Campaigns />} />
                <Route path="cuenta" element={<Account />} />
              </Route>
              <Route path="/:handle" element={<HandleRoute />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <CookieBanner />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  )
}
