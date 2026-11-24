import { ArrowDownToLine, Coins, Droplet, LayoutGrid, List, Settings } from 'lucide-react'
import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { useSession } from '../../shared/auth/context'
import { maskEmail } from '../../shared/lib/phone'
import { SideNav, type SideNavItem } from './SideNav'
import { TopBar } from './TopBar'

/** Order and labels follow the design. Withdrawals appear in Transactions once customer withdrawals exist. */
const ITEMS: SideNavItem[] = [
  { to: '/agent', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/agent/cash-in', label: 'Cash-in', icon: ArrowDownToLine },
  { to: '/agent/transactions', label: 'Transactions', icon: List },
  { to: '/agent/float', label: 'Float', icon: Droplet },
  { to: '/agent/commission', label: 'Commission', icon: Coins },
  { to: '/agent/settings', label: 'Settings', icon: Settings },
]

interface Identity { agentProfile: { agentCode: string; businessName: string } }

export default function AgentLayout() {
  const { session, signOut } = useSession()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const identity = useApi<Identity>((signal) => api('/agent/dashboard/overview', { signal }), [])

  const business = identity.data?.agentProfile.businessName ?? 'Agent'
  const code = identity.data?.agentProfile.agentCode
  const initials = business.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'A'

  const nav = <SideNav surface="Agent portal" items={ITEMS} onNavigate={() => setMenuOpen(false)}
    who={{ initials, name: business, role: code ?? maskEmail(session?.email) }} />

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
        <TopBar roleLine={`Agent · ${business}${code ? ` · ${code}` : ''}`} name={business} initials={initials} email={maskEmail(session?.email)}
          settingsTo="/agent/settings" menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((v) => !v)}
          onSignOut={() => { void signOut().then(() => navigate('/login', { replace: true })) }} />
        <main id="main" className="flex-1 px-4 py-6 lg:px-8"><Outlet /></main>
      </div>
    </div>
  )
}
