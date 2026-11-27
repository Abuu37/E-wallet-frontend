import { KeyRound, LayoutGrid, List, ScrollText, Store, Tag, Users, UserCog, Vault } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { useSession } from '../../shared/auth/context'
import { maskEmail } from '../../shared/lib/phone'
import { LogoutConfirm } from '../../shared/ui/LogoutConfirm'
import { SideNav, type SideNavItem } from './SideNav'
import { TopBar } from './TopBar'

interface NavItem extends SideNavItem { permission: string }

/** Only screens with a working backend are listed. Order follows the design. */
const NAV: NavItem[] = [
  { to: '/console', label: 'Overview', permission: 'DASHBOARD_VIEW', icon: LayoutGrid, end: true },
  { to: '/console/treasury', label: 'Treasury', permission: 'FLOAT_VIEW', icon: Vault },
  { to: '/console/customers', label: 'Customers', permission: 'USER_VIEW', icon: Users },
  { to: '/console/agents', label: 'Agents', permission: 'USER_VIEW', icon: Store },
  { to: '/console/transactions', label: 'Transactions', permission: 'TRANSACTION_VIEW_ALL', icon: List },
  { to: '/console/tariffs', label: 'Tariffs', permission: 'CHARGE_VIEW', icon: Tag },
  { to: '/console/roles', label: 'Roles & access', permission: 'ROLE_VIEW', icon: KeyRound },
  { to: '/console/staff', label: 'Staff', permission: 'USER_VIEW', icon: UserCog },
  { to: '/console/audit', label: 'Audit log', permission: 'AUDIT_VIEW', icon: ScrollText },
]

export default function ConsoleLayout() {
  const { session, has } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  // Pending float and mint requests, shown as a badge on Treasury (refreshed every 30 s).
  const canSeeTreasury = has('FLOAT_VIEW')
  const pending = useApi<{ summary: { pending: { count: number } } } | null>(
    (signal) => canSeeTreasury ? api('/treasury/requests', { query: { status: 'PENDING', size: 1 }, signal }) : Promise.resolve(null), [canSeeTreasury], 30_000)
  const pendingCount = pending.data?.summary.pending.count ?? 0
  const items = NAV.filter((i) => has(i.permission)).map((i) => i.to === '/console/treasury' && pendingCount > 0 ? { ...i, badge: String(pendingCount) } : i)
  const me = useApi<{ fullName: string; firstName: string; jobTitle: string | null }>((signal) => api('/staff/profile', { signal }), [])
  const name = me.data?.fullName ?? 'Staff'
  const initials = me.data ? name.split(/s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() : (session?.email ?? 'S').slice(0, 2).toUpperCase()

  const nav = (
    <SideNav surface="Staff console" items={items} onNavigate={() => setMenuOpen(false)}
      who={{ initials, name, role: me.data?.jobTitle ?? maskEmail(session?.email) }} />
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
        <TopBar roleLine="Staff" name={name} initials={initials} email={maskEmail(session?.email)}
          menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((v) => !v)}
          onSignOut={() => setLogoutOpen(true)} />
        <main id="main" className="flex-1 p-4 lg:p-8"><Outlet /></main>
      </div>
      <LogoutConfirm open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </div>
  )
}
