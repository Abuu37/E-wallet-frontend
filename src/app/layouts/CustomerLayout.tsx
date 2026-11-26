import { ArrowDownToLine, Landmark, LayoutGrid, List, MapPin, Send, Settings, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { useSession } from '../../shared/auth/context'
import { maskEmail } from '../../shared/lib/phone'
import { LogoutConfirm } from '../../shared/ui/LogoutConfirm'
import { formatDate, formatTime } from '../../shared/lib/dates'
import { formatTzs } from '../../shared/lib/money'
import { typeLabel, type MyTransactionList, type Profile } from '../../features/customer/types'
import { SideNav, type SideNavItem } from './SideNav'
import { TopBar, type NotificationItem } from './TopBar'

/** Order follows the design. Add money is tagged Soon until the Plaid bank link is built. */
const ITEMS: SideNavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/app/transactions', label: 'Transactions', icon: List },
  { to: '/app/send', label: 'Send money', icon: Send },
  { to: '/app/withdraw', label: 'Withdraw', icon: ArrowDownToLine },
  { to: '/app/agents', label: 'Find an agent', icon: MapPin },
  { to: '/app/add-money', label: 'Add money', icon: Landmark, badge: 'Soon' },
  { to: '/app/verify', label: 'Verify identity', icon: ShieldCheck },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

export default function CustomerLayout() {
  const { session } = useSession()
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutOpen, setLogoutOpen] = useState(false)
  const recent = useApi<MyTransactionList>((signal) => api('/transactions/me', { query: { size: 8 }, signal }), [], 30_000)
  const [readIds, setReadIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('wp.read.' + (session?.userId ?? '')) ?? '[]') as string[] } catch { return [] }
  })
  const markRead = (ids: string[]) => {
    const next = [...new Set([...readIds, ...ids])].slice(-60)
    setReadIds(next)
    try { localStorage.setItem('wp.read.' + (session?.userId ?? ''), JSON.stringify(next)) } catch { /* private window: unread just comes back */ }
  }
  const notifications: NotificationItem[] = (recent.data?.items ?? []).map((t) => ({
    id: t.referenceNo,
    title: t.type === 'TRANSFER' ? (t.direction === 'IN' ? `You received ${formatTzs(t.amount, { symbol: false })} TZS` : `You sent ${formatTzs(t.amount, { symbol: false })} TZS`) : `${typeLabel(t)} · ${formatTzs(t.amount, { symbol: false })} TZS`,
    body: t.counterpartyName ? `${t.direction === 'IN' ? 'From' : 'To'} ${t.counterpartyName}${t.matchCode ? ` · code ${t.matchCode}` : ''}` : t.status,
    when: `${formatDate(t.createdAt)} ${formatTime(t.createdAt)}`,
    href: `/app/transactions?ref=${t.referenceNo}`,
    tone: t.direction === 'IN' ? 'in' : 'out',
  }))
  const profile = useApi<Profile>((signal) => api('/customers/profile', { signal }), [])

  const name = profile.data?.fullName ?? 'You'
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || 'W'

  const nav = <SideNav surface="Customer" items={ITEMS} onNavigate={() => setMenuOpen(false)}
    who={{ initials, name, role: maskEmail(session?.email) }} />

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
        <TopBar roleLine="Customer" name={name} initials={initials} email={maskEmail(session?.email)} settingsTo="/app/settings" notifications={notifications} readIds={readIds} onMarkRead={markRead}
          menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((v) => !v)} onSignOut={() => setLogoutOpen(true)} />
        <main id="main" className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-6 lg:px-8"><Outlet /></main>
      </div>
      <LogoutConfirm open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </div>
  )
}
