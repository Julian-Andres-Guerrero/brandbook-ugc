import type { ReactNode } from 'react'
import { PublicLayout } from '../../components/Layout'
import { useMeta } from '../../components/useMeta'

export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  useMeta(title, { noindex: true })
  return (
    <PublicLayout bare>
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="mt-6 rounded-2xl border border-line bg-surface p-6">{children}</div>
      </div>
    </PublicLayout>
  )
}

/** Traduce los errores de Supabase Auth a mensajes claros en español. */
export function authError(message: string) {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'Correo o contraseña incorrectos.'
  if (m.includes('email not confirmed')) return 'Confirma tu correo antes de entrar (revisa tu bandeja de entrada).'
  if (m.includes('rate limit') || m.includes('too many')) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
  if (m.includes('already registered')) return 'Ya existe una cuenta con ese correo.'
  if (m.includes('password')) return 'La contraseña no cumple los requisitos: mínimo 10 caracteres con mayúsculas, minúsculas y números.'
  if (m.includes('username_reserved')) return 'Ese nombre de usuario está reservado.'
  if (m.includes('duplicate') || m.includes('unique')) return 'Ese nombre de usuario ya está en uso.'
  if (m.includes('invalid totp') || m.includes('invalid code')) return 'Código incorrecto o vencido.'
  return message
}
