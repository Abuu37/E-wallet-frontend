import { ArrowDownToLine, LayoutGrid, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useSession } from '../../shared/auth/context'
import { useT } from '../../shared/i18n'
import { maskEmail } from '../../shared/lib/phone'
import { SideNav, type SideNavItem } from './SideNav'

/** Only screens with a working backend are listed; Withdrawals, Float and Commission arrive with their endpoints. */
const ITEMS: SideNavItem[] = [
  { to: '/agent', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/agent/cash-in', label: 'Cash-in', icon: ArrowDownToLine },
]

export default function AgentLayout() {
  const { session, signOut } = useSession()
  const { t } = useT()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const nav = <SideNav surface="Agent portal" items={ITEMS} onNavigate={() => setMenuOpen(false)}
    who={{ initials: (session?.email ?? 'A').slice(0, 2).toUpperCase(), name: 'Agent', role: maskEmail(session?.email) }} />

  return (
    <div className="flex min-h-screen bg-surface text-ink">
      <div className="hidden lg:block">{nav}</div>
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="relative h-full w-64">{nav}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-white px-4 py-2 lg:px-8">
          <button type="button" className="rounded-xl p-2 hover:bg-slate-100 lg:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
          </button>
          <span className="hidden items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 sm:flex">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber-500" /> Sandbox · demo money
          </span>
          <button type="button" onClick={() => { void signOut().then(() => navigate('/login', { replace: true })) }}
            className="ml-auto flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
            <LogOut aria-hidden="true" size={16} /> {t('common.signOut')}
          </button>
        </header>
        <main id="main" className="flex-1 px-4 py-7 lg:px-8"><Outlet /></main>
      </div>
    </div>
  )
}
