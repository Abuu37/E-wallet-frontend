import { AlertTriangle, Inbox, Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { ApiError } from '../api/client'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-dark disabled:bg-slate-200 disabled:text-slate-500',
  secondary: 'bg-white text-ink border border-line hover:bg-slate-50 disabled:text-slate-400',
  danger: 'bg-[#E11D48] text-white hover:bg-[#BE123C] disabled:bg-slate-200 disabled:text-slate-500',
  ghost: 'bg-transparent text-brand hover:bg-blue-50 disabled:text-slate-400',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
  block?: boolean
}

/** Pill button. `loading` disables it, so a double tap cannot submit twice. */
export function Button({ variant = 'primary', loading, block, className = '', children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-base font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${VARIANTS[variant]} ${block ? 'w-full' : ''} ${className}`}
    >
      {loading && <Loader2 aria-hidden="true" className="animate-spin" size={18} />}
      {children}
    </button>
  )
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function Field({ label, error, hint, id, className = '', ...rest }: FieldProps) {
  const inputId = id ?? `f-${label.replace(/\W+/g, '-').toLowerCase()}`
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">{label}</label>
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`h-12 min-w-0 rounded-xl border bg-white px-3.5 text-base font-semibold text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${error ? 'border-[#E11D48]' : 'border-slate-300 focus-visible:border-brand'} ${className}`}
        {...rest}
      />
      {error ? <span id={`${inputId}-err`} role="alert" className="text-xs font-medium text-[#BE123C]">{error}</span>
        : hint ? <span id={`${inputId}-hint`} className="text-xs text-slate-600">{hint}</span> : null}
    </div>
  )
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center gap-2 p-10 text-muted">
      <Loader2 aria-hidden="true" className="animate-spin" size={18} /> {label}
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 p-10 text-center">
      <Inbox aria-hidden="true" className="text-slate-400" size={28} />
      <p className="font-bold text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted">{description}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.'
  const ref = error instanceof ApiError ? error.correlationId : null
  return (
    <div role="alert" className="flex flex-col items-center gap-2 p-10 text-center">
      <AlertTriangle aria-hidden="true" className="text-[#E11D48]" size={28} />
      <p className="font-bold text-ink">We could not load this</p>
      <p className="max-w-sm text-sm text-muted">{message}</p>
      {ref && <p className="text-xs text-muted">Reference: {ref}</p>}
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </div>
  )
}

/** Shown where a screen needs an endpoint that does not exist yet. Never shows made-up data. */
export function ComingSoon({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-white p-8 text-center">
      <p className="font-bold text-ink">{title}</p>
      <p className="mt-1 text-sm text-muted">{description ?? 'Coming soon.'}</p>
    </div>
  )
}
