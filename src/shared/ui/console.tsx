import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from './controls'

/** Building blocks for the staff console list screens (design: S02, S03, S09, S12). */

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export interface Kpi { label: string; value: string; unit?: string; sub?: string; icon: LucideIcon; tone?: 'warn' }

export function KpiRow({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ label, value, unit, sub, icon: Icon, tone }) => (
        <div key={label} className="flex items-start justify-between rounded-2xl border border-line bg-white p-5">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[13px] font-semibold text-muted">{label}</span>
            <span className="truncate text-xl font-extrabold tabular-nums">{value}{unit && <span className="ml-1 text-xs font-semibold text-muted">{unit}</span>}</span>
            {sub && <span className={`text-xs ${tone === 'warn' ? 'font-bold text-[#E11D48]' : 'text-muted'}`}>{sub}</span>}
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand"><Icon aria-hidden="true" size={21} /></span>
        </div>
      ))}
    </div>
  )
}

/** Filter bar above a table. `active` shows the Clear button. */
export function FilterBar({ label, active, onClear, children }: { label: string; active: boolean; onClear: () => void; children: ReactNode }) {
  return (
    <div role="search" aria-label={label} className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4">
      {children}
      {active && <Button variant="ghost" onClick={onClear}>Clear</Button>}
    </div>
  )
}

const CONTROL = 'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200'

export function SearchField({ id, value, onChange, placeholder }: { id: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex min-w-56 flex-1 flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold">Search</label>
      <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={CONTROL} />
    </div>
  )
}

export function SelectField({ id, label, value, onChange, options }: { id: string; label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={CONTROL}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}

export function TableCard({ title, countText, action, children }: { title: string; countText?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section aria-label={title} className="rounded-2xl border border-line bg-white">
      <div className="flex items-baseline justify-between p-5 pb-2">
        <h2 className="text-base font-extrabold">{title}</h2>
        <div className="flex items-center gap-3">{countText && <span className="text-xs text-muted">{countText}</span>}{action}</div>
      </div>
      {children}
    </section>
  )
}

export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?'
  return (
    <span aria-hidden="true" style={{ width: size, height: size }} className="flex shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-brand-dark">{initials}</span>
  )
}

/** A person cell: avatar, name and a muted sub line. */
export function PersonCell({ name, sub }: { name: string; sub?: string | null }) {
  return (
    <span className="flex items-center gap-3">
      <Avatar name={name} />
      <span className="flex min-w-0 flex-col"><b className="truncate">{name}</b>{sub && <span className="truncate text-xs text-muted">{sub}</span>}</span>
    </span>
  )
}


/** The big balance block at the top of a record panel. */
export function BalanceBlock({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3 rounded-2xl bg-ink p-4 text-white">
      <div className="flex flex-col"><span className="text-xs font-semibold text-slate-400">{label}</span><b className="text-2xl tabular-nums">{value}</b></div>
      {note && <span className="text-right text-xs text-slate-400">{note}</span>}
    </div>
  )
}

export function DateField({ id, label = 'Joined', value, onChange }: { id: string; label?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs font-semibold">{label}</label>
      <input id={id} type="date" value={value} onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" />
    </div>
  )
}

/** Exports the rows currently shown (after filters). Disabled when there is nothing to export. */
export function ExportButton({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  return (
    <Button variant="secondary" className="h-9 px-4 text-sm" disabled={disabled} onClick={onClick}>Export CSV</Button>
  )
}
