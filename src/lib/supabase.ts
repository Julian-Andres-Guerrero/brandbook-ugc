import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLIC_URL, SUPABASE_PUBLISHABLE_KEY } from '../config'

const url = import.meta.env.VITE_SUPABASE_URL || SUPABASE_PUBLIC_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_PUBLISHABLE_KEY

/** true si faltan las variables de entorno (se muestra una guía en pantalla). */
export const supabaseMissing = !url || !anonKey

// La anon key es pública por diseño: la seguridad la impone RLS en la base de datos.
// La service_role key NUNCA se usa en el frontend.
export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'missing', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
