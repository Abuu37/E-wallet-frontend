import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, Search, ChevronDown, Settings, LogOut, Bell, AlertTriangle, Info, Clock } from 'lucide-react'

interface DashboardTopbarProps {
  onMenuClick: () => void
  title: string
}

interface Notification {
  id: number
  title: string
  time: string
  type: 'alert' | 'warning' | 'info'
}

const initialNotifications: Notification[] = [
  { id: 1, title: 'Large withdrawal flagged for review', time: '5m ago', type: 'alert' },
  { id: 2, title: 'New cashier float request from Mbeya branch', time: '32m ago', type: 'info' },
  { id: 3, title: 'Loan repayment overdue for 3 customers', time: '1h ago', type: 'warning' },
  { id: 4, title: 'New wallet application approved', time: '3h ago', type: 'info' },
]

const notificationIcon = {
  alert: { icon: AlertTriangle, className: 'bg-red-50 text-red-700' },
  warning: { icon: Clock, className: 'bg-amber-50 text-amber-700' },
  info: { icon: Info, className: 'bg-brand/10 text-brand' },
} as const

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

const currentUser = {
  name: 'Code Abuu',
  initials: 'CA',
}

export default function DashboardTopbar({ onMenuClick, title }: DashboardTopbarProps) {
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [unreadIds, setUnreadIds] = useState(initialNotifications.map((n) => n.id))

  const markRead = (id: number) => setUnreadIds((prev) => prev.filter((n) => n !== id))
  const markAllRead = () => setUnreadIds([])

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-line bg-white/80 px-6 py-4 backdrop-blur">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="text-ink lg:hidden"
        >
          <Menu size={24} />
        </button>
        <div>
          <p className="text-xs font-medium text-muted">
            {getGreeting()}, {currentUser.name.split(' ')[0]} 👋
          </p>
          <h1 className="text-lg font-bold text-ink">{title}</h1>
        </div>
      </div>

      <div className="hidden flex-1 justify-center sm:flex">
        <div className="relative w-full max-w-sm">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            placeholder="Search..."
            className="w-full rounded-full border border-transparent bg-surface py-2 pl-10 pr-4 text-sm outline-none transition-colors focus:border-brand focus:bg-white"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((prev) => !prev)
              setProfileOpen(false)
            }}
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-surface"
          >
            <Bell size={20} />
            {unreadIds.length > 0 && (
              <span className="absolute right-2 top-2 flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-white shadow-xl shadow-ink/10"
              >
                <div className="flex items-center justify-between border-b border-line px-4 py-3">
                  <p className="text-sm font-bold text-ink">Notifications</p>
                  {unreadIds.length > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="text-xs font-semibold text-brand hover:text-brand-dark"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-80 divide-y divide-line overflow-y-auto">
                  {initialNotifications.map((item) => {
                    const { icon: Icon, className } = notificationIcon[item.type]
                    const isUnread = unreadIds.includes(item.id)
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => markRead(item.id)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface ${
                          isUnread ? 'bg-brand/5' : ''
                        }`}
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${className}`}>
                          <Icon size={16} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">
                            {item.title}
                          </span>
                          <span className="text-xs text-muted">{item.time}</span>
                        </span>
                        {isUnread && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((prev) => !prev)
              setNotifOpen(false)
            }}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm font-medium text-ink hover:bg-surface"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
              {currentUser.initials}
            </span>
            <span className="hidden sm:block">{currentUser.name}</span>
            <ChevronDown
              size={16}
              className={`text-muted transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-white p-2 shadow-xl shadow-ink/10"
              >
                <button
                  type="button"
                  onClick={() => setProfileOpen(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink/80 hover:bg-surface hover:text-brand"
                >
                  <Settings size={16} />
                  Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false)
                    navigate('/')
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink/80 hover:bg-surface hover:text-brand"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
