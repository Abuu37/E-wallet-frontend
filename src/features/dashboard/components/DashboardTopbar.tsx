import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Menu, Search, ChevronDown, Settings, LogOut } from 'lucide-react'

interface DashboardTopbarProps {
  onMenuClick: () => void
  title: string
}

export default function DashboardTopbar({ onMenuClick, title }: DashboardTopbarProps) {
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)

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
        <h1 className="text-lg font-bold text-ink">{title}</h1>
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

      <div className="relative">
        <button
          type="button"
          onClick={() => setProfileOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-sm font-medium text-ink hover:bg-surface"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
            AJ
          </span>
          <span className="hidden sm:block">Asha Juma</span>
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
    </header>
  )
}
