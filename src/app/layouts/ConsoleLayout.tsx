import { KeyRound, LayoutGrid, List, ScrollText, Store, Tag, Users, UserCog, Vault } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { useSession } from '../../shared/auth/context'
import { maskEmail } from '../../shared/lib/phone'
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
  const { session, has, signOut } = useSession()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  // Pending float and mint requests, shown as a badge on Treasury (refreshed every 30 s).
  const canSeeTreasury = has('FLOAT_VIEW')
  const pending = useApi<{ summary: { pending: { count: number } } } | null>(
    (signal) => canSeeTreasury ? api('/treasury/requests', { query: { status: 'PENDING', size: 1 }, signal }) : Promise.resolve(null), [canSeeTreasury], 30_000)
  const pendingCount = pending.data?.summary.pending.count ?? 0
  const items = NAV.filter((i) => has(i.permission)).map((i) => i.to === '/console/treasury' && pendingCount > 0 ? { ...i, badge: String(pendingCount) } : i)
  const initials = (session?.email ?? 'S').slice(0, 2).toUpperCase()

  const nav = (
    <SideNav surface="Staff console" items={items} onNavigate={() => setMenuOpen(false)}
      who={{ initials, name: 'Staff', role: maskEmail(session?.email) }} />
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
        <TopBar roleLine="Staff" name="Staff" initials={initials} email={maskEmail(session?.email)}
          menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((v) => !v)}
          onSignOut={() => { void signOut().then(() => navigate('/login', { replace: true })) }} />
        <main id="main" className="flex-1 p-4 lg:p-8"><Outlet /></main>
      </div>
    </div>
  )
}
