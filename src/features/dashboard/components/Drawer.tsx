import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { X } from 'lucide-react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}

export default function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="drawer-backdrop"
            className="fixed inset-0 z-40 bg-ink/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.aside
            key="drawer-panel"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl shadow-ink/20"
            initial={{ x: '100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="text-base font-bold text-ink">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="text-muted hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="flex gap-3 border-t border-line px-6 py-4">{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
