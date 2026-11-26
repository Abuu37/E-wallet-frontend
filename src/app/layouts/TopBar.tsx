import { Bell, ChevronDown, LogOut, Menu, Settings, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export interface NotificationItem { id: string; title: string; body: string; when: string; href?: string; tone?: 'in' | 'out' | 'info' }

interface TopBarProps {
  /** e.g. "Agent · Mrema Shop · 378418" */
  roleLine: string
  /** Shown in the profile button on wide screens. */
  name: string
  initials: string
  /** Already masked. */
  email?: string | null
  settingsTo?: string
  /** What the bell lists. Without it the bell says there is nothing to show. */
  notifications?: NotificationItem[]
  /** Ids already read. Kept by the caller so it can remember them. */
  readIds?: string[]
  onMarkRead?: (ids: string[]) => void
  menuOpen: boolean
  onToggleMenu: () => void
  onSignOut: () => void
}

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Dar_es_Salaam', hour: '2-digit', hour12: false }).format(new Date()))
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

/** The sticky header shared by the staff console and the agent portal (design: greeting, Sandbox badge, bell, profile). */
export function TopBar({ roleLine, name, initials, email, settingsTo, notifications = [], readIds = [], onMarkRead, menuOpen, onToggleMenu, onSignOut }: TopBarProps) {
  const [bellOpen, setBellOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const unread = notifications.filter((n) => !readIds.includes(n.id))
  const today = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Dar_es_Salaam', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
      <button type="button" className="rounded-xl p-2 transition-colors hover:bg-blue-50 hover:text-brand lg:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={onToggleMenu}>
        {menuOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
      </button>
      <div className="mr-auto flex min-w-0 flex-col">
        <span className="truncate text-[17px] font-bold">{greeting()}, {name.split(' ')[0]}</span>
        <span className="truncate text-[13px] text-muted">{roleLine} · {today}</span>
      </div>
      <span title="Plaid runs in Sandbox: test identities and test banks, no real money"
        className="hidden h-[30px] items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 text-xs font-bold text-orange-800 sm:inline-flex">
        <span aria-hidden="true" className="h-[7px] w-[7px] rounded-full bg-orange-600" /> Sandbox · demo money
      </span>

      <div className="relative">
        <button type="button" aria-label={unread.length ? `Notifications, ${unread.length} unread` : 'Notifications'} aria-expanded={bellOpen} onClick={() => { setBellOpen((v) => !v); setProfileOpen(false) }}
          className="relative flex h-[42px] w-[42px] items-center justify-center rounded-full border border-line bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
          <Bell aria-hidden="true" size={19} />
          {unread.length > 0 && <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#DC2626] px-1 text-[10px] font-bold text-white">{unread.length > 9 ? '9+' : unread.length}</span>}
        </button>
        {bellOpen && (
          <section aria-label="Notifications" className="absolute right-0 top-[50px] z-40 w-[340px] max-w-[calc(100vw-32px)] rounded-2xl border border-line bg-white py-1.5 shadow-xl">
            <div className="flex items-center justify-between px-4 py-2"><b className="text-sm">Notifications</b>
              {unread.length > 0 && <button type="button" onClick={() => onMarkRead?.(notifications.map((n) => n.id))} className="text-xs font-semibold text-brand-dark hover:underline">Mark all read</button>}</div>
            {notifications.length === 0 ? <p className="px-4 pb-3 pt-1 text-sm text-muted">You are all caught up. New activity shows here.</p> : (
              <ul className="max-h-[360px] overflow-y-auto">
                {notifications.map((n) => {
                  const isNew = !readIds.includes(n.id)
                  const inner = (
                    <>
                      <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${isNew ? 'bg-brand' : 'bg-transparent'}`} />
                      <span className="flex min-w-0 flex-col gap-0.5"><b className="text-[13px]">{n.title}</b><span className="text-xs leading-snug text-slate-600">{n.body}</span><span className="text-[11px] text-slate-400">{n.when}</span></span>
                    </>
                  )
                  const cls = `flex w-full gap-2.5 border-t border-slate-100 px-4 py-2.5 text-left no-underline text-ink hover:bg-surface ${isNew ? 'bg-blue-50/40' : ''}`
                  return <li key={n.id}>{n.href
                    ? <Link to={n.href} onClick={() => { onMarkRead?.([n.id]); setBellOpen(false) }} className={cls}>{inner}</Link>
                    : <button type="button" onClick={() => onMarkRead?.([n.id])} className={cls}>{inner}</button>}</li>
                })}
              </ul>
            )}
          </section>
        )}
      </div>

      <div className="relative">
        <button type="button" aria-label="Account menu" aria-expanded={profileOpen} onClick={() => { setProfileOpen((v) => !v); setBellOpen(false) }}
          className="flex h-11 items-center gap-2.5 rounded-full border border-line bg-white py-0 pl-1 pr-2.5 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-blue-100 text-[13px] font-bold text-brand">{initials}</span>
          <b className="hidden text-[13px] sm:block">{name}</b>
          <ChevronDown aria-hidden="true" size={14} className="text-muted" />
        </button>
        {profileOpen && (
          <section aria-label="Account" className="absolute right-0 top-[52px] z-40 w-56 rounded-[14px] border border-line bg-white p-1.5 shadow-xl">
            <div className="mb-1 border-b border-slate-100 px-3 py-2.5"><b className="text-sm">{name}</b>{email && <><br /><span className="text-xs text-muted">{email}</span></>}</div>
            {settingsTo && (
              <Link to={settingsTo} onClick={() => setProfileOpen(false)} className="flex h-10 items-center gap-2.5 rounded-[10px] px-3 text-sm font-medium text-slate-700 no-underline hover:bg-slate-50">
                <Settings aria-hidden="true" size={16} /> Settings
              </Link>
            )}
            <button type="button" onClick={() => { setProfileOpen(false); onSignOut() }} className="flex h-10 w-full items-center gap-2.5 rounded-[10px] px-3 text-left text-sm font-medium text-red-700 hover:bg-red-50">
              <LogOut aria-hidden="true" size={16} /> Log out
            </button>
          </section>
        )}
      </div>
    </header>
  )
}
