import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import type { LucideIcon } from 'lucide-react'
import {
  CreditCard,
  LayoutDashboard,
  ArrowLeftRight,
  WalletCards,
  Users,
  Settings,
  X,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const navGroups: Array<{ label: string | null; items: NavItem[] }> = [
  {
    label: null,
    items: [{ to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Operations',
    items: [
      { to: '/dashboard/transactions', label: 'Transactions', icon: ArrowLeftRight },
      { to: '/dashboard/wallets', label: 'Wallets', icon: WalletCards },
    ],
  },
  {
    label: 'People',
    items: [{ to: '/dashboard/customers', label: 'Customers', icon: Users }],
  },
]

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive ? 'bg-brand text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`

  return (
    <>
      <NavLink
        to="/dashboard"
        end
        className="flex items-center gap-2 px-2 text-lg font-extrabold tracking-tight text-white"
        onClick={onNavigate}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
          <CreditCard size={18} />
        </span>
        WalletPesa
      </NavLink>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {navGroups.map((group) => (
          <div key={group.label ?? 'root'}>
            {group.label && (
              <p className="mb-1 mt-4 px-3 text-[11px] font-bold uppercase tracking-wide text-white/35">
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={linkClass}
                  onClick={onNavigate}
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-auto border-t border-white/10 pt-3">
          <NavLink to="/dashboard/settings" className={linkClass} onClick={onNavigate}>
            <Settings size={18} />
            Settings
          </NavLink>
        </div>
      </nav>
    </>
  )
}

interface DashboardSidebarProps {
  open: boolean
  onClose: () => void
}

export default function DashboardSidebar({ open, onClose }: DashboardSidebarProps) {
  return (
    <>
      <aside className="hidden w-64 flex-col bg-ink px-4 py-6 lg:flex">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            key="sidebar-backdrop"
            className="fixed inset-0 z-40 bg-ink/60 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            key="sidebar-panel"
            className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink px-4 py-6 lg:hidden"
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="absolute right-4 top-6 text-white/70 hover:text-white"
            >
              <X size={22} />
            </button>
            <SidebarContent onNavigate={onClose} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
