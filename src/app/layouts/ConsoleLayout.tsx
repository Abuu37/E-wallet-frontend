import { Bell, ChevronDown, LayoutGrid, LogOut, Menu, Store, Users, UserCog, Vault, X } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useSession } from '../../shared/auth/context'
import { SideNav, type SideNavItem } from './SideNav'
import { maskEmail } from '../../shared/lib/phone'

interface NavItem extends SideNavItem { permission: string }

/** Only screens with a working backend are listed. */
const NAV: NavItem[] = [
  { to: '/console', label: 'Overview', permission: 'DASHBOARD_VIEW', icon: LayoutGrid, end: true },
  { to: '/console/treasury', label: 'Treasury', permission: 'FLOAT_VIEW', icon: Vault },
  { to: '/console/customers', label: 'Customers', permission: 'USER_VIEW', icon: Users },
  { to: '/console/agents', label: 'Agents', permission: 'USER_VIEW', icon: Store },
  { to: '/console/staff', label: 'Staff', permission: 'USER_VIEW', icon: UserCog },
]

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Dar_es_Salaam', hour: '2-digit', hour12: false }).format(new Date()))
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

export default function ConsoleLayout() {
  const { session, has, signOut } = useSession()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const items = NAV.filter((i) => has(i.permission))
  const today = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Dar_es_Salaam', weekday: 'short', day: '2-digit', month: 'short' }).format(new Date())

  const nav = (
    <SideNav surface="Staff console" items={items} onNavigate={() => setMenuOpen(false)}
      who={{ initials: (session?.email ?? "S").slice(0, 2).toUpperCase(), name: "Staff", role: maskEmail(session?.email) }} />
  )

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
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white px-4 py-3 lg:px-8">
          <button type="button" className="rounded-xl p-2 hover:bg-slate-100 lg:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((v) => !v)}>
            {menuOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
          </button>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-base font-extrabold">{greeting()}</span>
            <span className="truncate text-xs text-muted">Staff · {today}</span>
          </div>
          <span title="Plaid runs in Sandbox: test identities and test banks, no real money"
            className="hidden items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 sm:flex">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber-500" /> Sandbox · demo money
          </span>

          <div className="relative">
            <button type="button" aria-label="Notifications" aria-expanded={bellOpen} onClick={() => { setBellOpen((v) => !v); setProfileOpen(false) }}
              className="rounded-xl p-2 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
              <Bell aria-hidden="true" size={19} />
            </button>
            {bellOpen && (
              <section aria-label="Notifications" className="absolute right-0 top-12 w-72 rounded-2xl border border-line bg-white p-4 shadow-lg">
                <b className="text-sm">Notifications</b>
                <p className="mt-2 text-sm text-muted">Staff notifications are coming soon.</p>
              </section>
            )}
          </div>

          <div className="relative">
            <button type="button" aria-label="Account menu" aria-expanded={profileOpen} onClick={() => { setProfileOpen((v) => !v); setBellOpen(false) }}
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-brand-dark">
                {(session?.email ?? 'S').slice(0, 2).toUpperCase()}
              </span>
              <ChevronDown aria-hidden="true" size={14} className="text-muted" />
            </button>
            {profileOpen && (
              <section aria-label="Account" className="absolute right-0 top-12 w-64 rounded-2xl border border-line bg-white p-2 shadow-lg">
                <p className="px-3 py-2 text-sm"><b>Signed in</b><br /><span className="text-muted">{maskEmail(session?.email)}</span></p>
                <button type="button" onClick={() => { void signOut().then(() => navigate('/login', { replace: true })) }}
                  className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 text-sm font-semibold hover:bg-slate-50">
                  <LogOut aria-hidden="true" size={16} /> Log out
                </button>
              </section>
            )}
          </div>
        </header>
        <main id="main" className="flex-1 p-4 lg:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
