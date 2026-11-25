import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** Max width in px. */
  width?: number
  /** Square corners instead of rounded ones. */
  sharp?: boolean
}

/** Centred dialog with a sticky header and footer. Esc closes it; focus moves in and returns on close. */
export function Modal({ open, title, subtitle, onClose, children, footer, width = 720, sharp = false }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)
  const returnTo = useRef<Element | null>(null)

  useEffect(() => {
    if (!open) return
    returnTo.current = document.activeElement
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (returnTo.current instanceof HTMLElement) returnTo.current.focus()
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <button type="button" aria-label="Close dialog" tabIndex={-1} className="absolute inset-0 cursor-default bg-ink/50" onClick={onClose} />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}
        className={`relative flex max-h-[calc(100vh-48px)] w-full flex-col overflow-y-auto ${sharp ? 'rounded-none' : 'rounded-[20px]'} bg-white shadow-[0_40px_80px_-24px_rgba(11,18,32,0.45)] outline-none animate-[slide-in_.18s_ease-out] motion-reduce:animate-none`}>
        <header className={`sticky top-0 z-10 flex items-start gap-3 ${sharp ? '' : 'rounded-t-[20px]'} border-b border-line bg-white px-6 py-5`}>
          <div className="flex flex-1 flex-col gap-1">
            <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
            {subtitle && <p className="text-[13px] text-muted">{subtitle}</p>}
          </div>
          <button type="button" aria-label="Close" onClick={onClose}
            className={`flex h-9 w-9 shrink-0 items-center justify-center ${sharp ? 'rounded-none' : 'rounded-full'} border border-line text-slate-600 transition-colors hover:border-brand hover:bg-blue-50 hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200`}>
            <X aria-hidden="true" size={16} />
          </button>
        </header>
        <div className="px-6 pb-2 pt-4">{children}</div>
        {footer && <footer className={`sticky bottom-0 flex justify-end gap-2.5 ${sharp ? '' : 'rounded-b-[20px]'} border-t border-line bg-white px-6 py-4`}>{footer}</footer>}
      </div>
    </div>
  )
}
