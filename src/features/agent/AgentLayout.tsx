import { ArrowDownToLine, LayoutGrid, LogOut } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useSession } from '../../shared/auth/context'
import { useT } from '../../shared/i18n'

const NAV = [
  { to: '/agent', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/agent/cash-in', label: 'Cash-in', icon: ArrowDownToLine },
]

export default function AgentLayout() {
  const { signOut } = useSession()
  const { t } = useT()
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-white px-4 py-3">
        <span className="flex items-center gap-2 text-base font-extrabold"><span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand text-white">W</span> Agent portal</span>
        <nav aria-label="Agent" className="flex gap-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${isActive ? 'bg-brand text-white' : 'hover:bg-slate-100'}`}>
              <Icon aria-hidden="true" size={16} /> {label}
            </NavLink>
          ))}
        </nav>
        <button type="button" onClick={() => { void signOut().then(() => navigate('/login', { replace: true })) }}
          className="flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
          <LogOut aria-hidden="true" size={16} /> {t('common.signOut')}
        </button>
      </header>
      <main id="main" className="mx-auto w-full max-w-4xl p-4"><Outlet /></main>
    </div>
  )
}
