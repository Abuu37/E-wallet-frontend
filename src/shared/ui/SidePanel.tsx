import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

interface SidePanelProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** Detail panel that slides in from the right. Esc closes it; focus moves in and returns on close. */
export function SidePanel({ open, title, subtitle, onClose, children, footer }: SidePanelProps) {
  const panelRef = useRef<HTMLElement>(null)
  const returnTo = useRef<Element | null>(null)

  useEffect(() => {
    if (!open) return
    returnTo.current = document.activeElement
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (returnTo.current instanceof HTMLElement) returnTo.current.focus()
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" aria-label="Close panel" tabIndex={-1} className="absolute inset-0 bg-black/40" onClick={onClose} />
      <section ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title}
        className="relative flex h-full w-full max-w-md flex-col bg-white shadow-2xl outline-none animate-[slide-in_.18s_ease-out] motion-reduce:animate-none">
        <header className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div className="min-w-0">
            {subtitle && <p className="truncate text-xs font-semibold text-muted">{subtitle}</p>}
            <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-xl p-2 transition-colors hover:bg-blue-50 hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
            <X aria-hidden="true" size={20} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <footer className="border-t border-line p-5">{footer}</footer>}
      </section>
    </div>
  )
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 text-sm last:border-0">
      <span className="text-muted">{label}</span>
      <b className="text-right">{children}</b>
    </div>
  )
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const tone: Record<string, string> = {
    PENDING: 'bg-amber-50 text-amber-800', APPROVED: 'bg-teal-50 text-teal-800', ACTIVE: 'bg-teal-50 text-teal-800',
    COMPLETED: 'bg-teal-50 text-teal-800', REJECTED: 'bg-rose-50 text-rose-800', FAILED: 'bg-rose-50 text-rose-800',
    SUSPENDED: 'bg-rose-50 text-rose-800', LOCKED: 'bg-rose-50 text-rose-800', DEACTIVATED: 'bg-slate-100 text-slate-700', INACTIVE: 'bg-slate-100 text-slate-700',
  }
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tone[status] ?? 'bg-slate-100 text-slate-700'}`}>{label ?? status}</span>
}
