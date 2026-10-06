import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  CreditCard,
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  WalletCards,
  Settings,
  X,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/dashboard/customers', label: 'Customers', icon: Users },
  { to: '/dashboard/cards', label: 'Cards', icon: WalletCards },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
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

      <nav className="mt-8 flex flex-col gap-1">
        {navItems.map((item) => (
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
