// Configuración central de la plataforma. Cambia el nombre o el correo aquí.
export const SITE_NAME = 'Brandbook UGC'
export const LEGAL_EMAIL = 'julianguerrerov@icloud.com'
export const LEGAL_LAST_UPDATED = '2026-11-24'
export const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') || window.location.origin

// Límites de archivos (deben coincidir con los buckets en la migración SQL).
export const INVOICE_MAX_BYTES = 10 * 1024 * 1024 // 10 MB
export const INVOICE_MIME = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'] as const
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024 // 2 MB
export const AVATAR_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const

// Regla de inactividad (debe coincidir con supabase/migrations/*_inactivity.sql).
export const INACTIVITY_WARN_DAYS = 60
export const INACTIVITY_DELETE_DAYS = 10
