import { Lock } from 'lucide-react'
import { useId, useState, type InputHTMLAttributes } from 'react'

const BOX = 'flex h-[52px] items-center gap-2.5 rounded-xl border bg-white px-3.5 focus-within:ring-4 focus-within:ring-blue-200'
const border = (bad: boolean) => (bad ? 'border-[#DC2626]' : 'border-slate-300 focus-within:border-brand')

export function FieldError({ id, children }: { id: string; children?: string | null }) {
  return <span id={id} role="alert" className="min-h-[16px] text-xs font-semibold text-[#DC2626]">{children}</span>
}

interface PhoneFieldProps { value: string; onChange: (v: string) => void; error?: string | null; hint?: string; id?: string }

/** +255 prefix, free-typed national number. */
export function PhoneField({ value, onChange, error, hint, id }: PhoneFieldProps) {
  const auto = useId()
  const inputId = id ?? auto
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold">Phone number</label>
      <div className={`${BOX} ${border(Boolean(error))}`}>
        <span className="border-r border-line pr-2.5 text-[15px] font-semibold text-slate-700">🇹🇿 +255</span>
        <input id={inputId} type="tel" inputMode="tel" autoComplete="tel-national" value={value} onChange={(e) => onChange(e.target.value)} placeholder="712 345 678"
          aria-invalid={error ? true : undefined} aria-describedby={`${inputId}-hint ${inputId}-err`}
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-base font-medium text-ink outline-none" />
      </div>
      {hint && !error && <span id={`${inputId}-hint`} className="text-[13px] text-slate-600">{hint}</span>}
      <FieldError id={`${inputId}-err`}>{error}</FieldError>
    </div>
  )
}

interface PinFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string | null
  autoComplete: 'current-password' | 'new-password'
  /** Controlled outside so one toggle can reveal several PIN fields. */
  visible?: boolean
  onToggleVisible?: () => void
  /** Shown on the right of the label row, e.g. "Forgot PIN?". */
  aside?: React.ReactNode
  withLock?: boolean
}

/** A typed 4-digit PIN field. Digits only; masked unless the person chooses to show it. */
export function PinField({ label, value, onChange, error, autoComplete, visible, onToggleVisible, aside, withLock }: PinFieldProps) {
  const id = useId()
  const [localVisible, setLocalVisible] = useState(false)
  const shown = visible ?? localVisible
  const toggle = onToggleVisible ?? (() => setLocalVisible((v) => !v))
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between"><label htmlFor={id} className="text-sm font-semibold">{label}</label>{aside}</div>
      <div className={`${BOX} ${border(Boolean(error))}`}>
        {withLock && <Lock aria-hidden="true" size={18} className="text-muted" />}
        <input id={id} type={shown ? 'text' : 'password'} inputMode="numeric" maxLength={4} autoComplete={autoComplete} value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="4 digits"
          aria-invalid={error ? true : undefined} aria-describedby={`${id}-err`}
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-lg font-semibold tracking-[0.4em] text-ink outline-none placeholder:tracking-normal placeholder:text-base placeholder:font-normal" />
        <button type="button" onClick={toggle} aria-pressed={shown} className="rounded px-1 text-[13px] font-semibold text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">{shown ? 'Hide' : 'Show'}</button>
      </div>
      <FieldError id={`${id}-err`}>{error}</FieldError>
    </div>
  )
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string | null
  hint?: string
  optional?: boolean
}

export function TextField({ label, value, onChange, error, hint, optional, id, ...rest }: TextFieldProps) {
  const auto = useId()
  const inputId = id ?? auto
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold">{label}{optional ? <span className="font-normal text-slate-500"> (optional)</span> : <span aria-hidden="true" className="text-[#DC2626]"> *</span>}</label>
      <input id={inputId} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={error ? true : undefined} aria-describedby={`${inputId}-hint ${inputId}-err`}
        className={`h-[50px] w-full min-w-0 rounded-xl border bg-white px-3.5 text-base font-medium text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${error ? 'border-[#DC2626]' : 'border-slate-300 focus-visible:border-brand'}`} {...rest} />
      {hint && !error && <span id={`${inputId}-hint`} className="text-xs text-slate-600">{hint}</span>}
      <FieldError id={`${inputId}-err`}>{error}</FieldError>
    </div>
  )
}
