import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useId } from 'react'

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 font-semibold text-accent-ink hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-2.5 font-medium text-ink hover:border-muted disabled:opacity-50',
  ghost: 'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-muted hover:text-ink hover:bg-surface-2',
  danger:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-bad/60 px-4 py-2.5 font-medium text-bad hover:bg-bad/10 disabled:opacity-50',
}

export function Button({ variant = 'primary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof btn }) {
  return <button {...p} className={`${btn[variant]} ${className}`} />
}

const inputCls =
  'w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none'

type FieldProps = { label: string; hint?: ReactNode; error?: string | null; required?: boolean }

export function Field({ label, hint, error, required, children, id }: FieldProps & { children: (id: string, describedBy?: string) => ReactNode; id?: string }) {
  const auto = useId()
  const fid = id ?? auto
  const hid = hint || error ? `${fid}-hint` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fid} className="text-sm font-medium">
        {label}
        {required && <span className="text-accent" aria-hidden> *</span>}
      </label>
      {children(fid, hid)}
      {(hint || error) && (
        <p id={hid} className={`text-xs ${error ? 'text-bad' : 'text-muted'}`} role={error ? 'alert' : undefined}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

export function Input({ label, hint, error, required, ...p }: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(id, d) => <input id={id} aria-describedby={d} aria-invalid={!!error} required={required} {...p} className={inputCls} />}
    </Field>
  )
}

export function Textarea({ label, hint, error, required, ...p }: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(id, d) => <textarea id={id} aria-describedby={d} required={required} rows={4} {...p} className={inputCls} />}
    </Field>
  )
}

export function Select({ label, hint, error, required, children, ...p }: FieldProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} hint={hint} error={error} required={required}>
      {(id, d) => (
        <select id={id} aria-describedby={d} required={required} {...p} className={inputCls}>
          {children}
        </select>
      )}
    </Field>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-line bg-surface p-5 ${className}`}>{children}</div>
}

export function Alert({ kind = 'info', children }: { kind?: 'info' | 'error' | 'ok' | 'warn'; children: ReactNode }) {
  const c = {
    info: 'border-line bg-surface-2 text-ink',
    error: 'border-bad/50 bg-bad/10 text-ink',
    ok: 'border-ok/50 bg-ok/10 text-ink',
    warn: 'border-warn/50 bg-warn/10 text-ink',
  }[kind]
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${c}`}>
      {children}
    </div>
  )
}

export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted" role="status">
      <span className="size-5 animate-spin rounded-full border-2 border-line border-t-accent" aria-hidden />
      {label}
    </div>
  )
}
