// i18n mínimo sin dependencias: los perfiles y las páginas legales son bilingües,
// el panel está en español.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Lang } from './types'

const dict = {
  en: {
    nav_login: 'Sign in', nav_signup: 'Create your profile', nav_panel: 'My panel',
    hero_title: 'Your UGC portfolio and link in bio, in one place',
    hero_sub: 'Show brands who you are, your socials, campaigns and videos in under a minute. Keep your products, payments and invoices private in your own panel.',
    hero_cta: 'Create your free profile', hero_example: 'See an example profile',
    feat_public: 'Public profile at /@you', feat_public_d: 'A professional link-in-bio page with your niches, services, campaigns and videos.',
    feat_private: 'Private panel', feat_private_d: 'Log every product, its value, cash payments and the purchase invoice. Only you can see it.',
    feat_tax: 'Ready for tax season', feat_tax_d: 'Yearly totals by platform, CSV export and a clean summary for your accountant.',
    feat_secure: 'Security first', feat_secure_d: 'Database-level isolation, private invoice storage with temporary links and optional 2FA.',
    niches: 'Niches', services: 'Services', campaigns: 'Campaigns & videos', contact: 'Contact', email_me: 'Email me',
    status_completed: 'Completed', status_published: 'Published', status_in_progress: 'In progress',
    via: 'via', watch_on: 'Watch on', no_campaigns: 'No public campaigns yet.',
    profile_not_found: 'Profile not found', profile_not_found_d: 'This creator does not exist or their profile is private.',
    back_home: 'Back to home',
    footer_terms: 'Terms', footer_privacy: 'Privacy', footer_cookies: 'Cookies', footer_content: 'Content & DMCA', footer_cookie_prefs: 'Cookie preferences',
    footer_note: 'Built in alignment with ISO/IEC 27001, ISO/IEC 27701 and WCAG 2.1 AA practices. Not certified.',
    cookie_title: 'Cookies', cookie_text: 'We only use what is needed for the site to work (your session and preferences). With your permission we would also use privacy-friendly analytics. You can change this at any time.',
    cookie_accept: 'Accept all', cookie_reject: 'Essential only', cookie_save: 'Save choice', cookie_analytics: 'Analytics (optional)', cookie_essential: 'Essential (always on)', cookie_more: 'Cookie policy',
    lang_switch: 'Español', made_with: 'Made with',
    svc_ugc_videos: 'UGC videos', svc_unboxings: 'Unboxings', svc_reviews_demos: 'Reviews & demos', svc_spark_ads: 'Spark Ads', svc_whitelisting: 'Whitelisting',
    svc_photos: 'Product photos', svc_voiceover: 'Voice-over',
    featured_videos: 'Videos', prev_video: 'Previous video', next_video: 'Next video', go_to_video: 'Go to video', play_here: 'Play here', embed_notice: 'Tapping play loads the {net} player, which may use its own cookies.',
  },
  es: {
    nav_login: 'Entrar', nav_signup: 'Crea tu perfil', nav_panel: 'Mi panel',
    hero_title: 'Tu portafolio UGC y tu link en bio, en un solo lugar',
    hero_sub: 'Muestra a las marcas quién eres, tus redes, campañas y videos en menos de un minuto. Lleva tus productos, pagos y facturas en privado en tu propio panel.',
    hero_cta: 'Crea tu perfil gratis', hero_example: 'Ver un perfil de ejemplo',
    feat_public: 'Perfil público en /@tú', feat_public_d: 'Una página profesional de link en bio con tus nichos, servicios, campañas y videos.',
    feat_private: 'Panel privado', feat_private_d: 'Registra cada producto, su valor, los pagos en efectivo y la factura de compra. Solo tú lo ves.',
    feat_tax: 'Listo para impuestos', feat_tax_d: 'Totales del año por plataforma, exportación CSV y un resumen limpio para tu contador.',
    feat_secure: 'Seguridad primero', feat_secure_d: 'Aislamiento a nivel de base de datos, facturas privadas con enlaces temporales y 2FA opcional.',
    niches: 'Nichos', services: 'Servicios', campaigns: 'Campañas y videos', contact: 'Contacto', email_me: 'Escríbeme',
    status_completed: 'Completada', status_published: 'Publicada', status_in_progress: 'En curso',
    via: 'vía', watch_on: 'Ver en', no_campaigns: 'Aún no hay campañas públicas.',
    profile_not_found: 'Perfil no encontrado', profile_not_found_d: 'Este creador no existe o su perfil es privado.',
    back_home: 'Volver al inicio',
    footer_terms: 'Términos', footer_privacy: 'Privacidad', footer_cookies: 'Cookies', footer_content: 'Contenido y DMCA', footer_cookie_prefs: 'Preferencias de cookies',
    footer_note: 'Construida alineada con buenas prácticas de ISO/IEC 27001, ISO/IEC 27701 y WCAG 2.1 AA. No está certificada.',
    cookie_title: 'Cookies', cookie_text: 'Solo usamos lo necesario para que el sitio funcione (tu sesión y tus preferencias). Con tu permiso usaríamos también analítica respetuosa con la privacidad. Puedes cambiarlo cuando quieras.',
    cookie_accept: 'Aceptar todo', cookie_reject: 'Solo esenciales', cookie_save: 'Guardar elección', cookie_analytics: 'Analítica (opcional)', cookie_essential: 'Esenciales (siempre activas)', cookie_more: 'Política de cookies',
    lang_switch: 'English', made_with: 'Hecho con',
    svc_ugc_videos: 'Videos UGC', svc_unboxings: 'Unboxings', svc_reviews_demos: 'Reseñas y demos', svc_spark_ads: 'Spark Ads', svc_whitelisting: 'Whitelisting',
    svc_photos: 'Fotos de producto', svc_voiceover: 'Voz en off',
    featured_videos: 'Videos', prev_video: 'Video anterior', next_video: 'Video siguiente', go_to_video: 'Ir al video', play_here: 'Reproducir aquí', embed_notice: 'Al reproducir se carga el reproductor de {net}, que puede usar sus propias cookies.',
  },
} as const

export type DictKey = keyof (typeof dict)['en']
export const SERVICE_KEYS = ['ugc_videos', 'unboxings', 'reviews_demos', 'spark_ads', 'whitelisting', 'photos', 'voiceover'] as const

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string }
const LangContext = createContext<Ctx | null>(null)

function initialLang(): Lang {
  const saved = localStorage.getItem('lang')
  if (saved === 'en' || saved === 'es') return saved
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en'
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang)
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  const setLang = (l: Lang) => {
    localStorage.setItem('lang', l) // preferencia esencial (ver política de cookies)
    setLangState(l)
  }
  const t = (k: DictKey) => dict[lang][k] ?? k
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() {
  const c = useContext(LangContext)
  if (!c) throw new Error('useLang fuera de LangProvider')
  return c
}

/** Etiqueta traducida de un servicio; si es un servicio libre, se muestra tal cual. */
export function serviceLabel(t: Ctx['t'], key: string) {
  return (SERVICE_KEYS as readonly string[]).includes(key) ? t(`svc_${key}` as DictKey) : key
}
