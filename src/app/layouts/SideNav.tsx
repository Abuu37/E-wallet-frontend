import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'

export interface SideNavItem { to: string; label: string; icon: LucideIcon; end?: boolean; badge?: string }

interface SideNavProps {
  /** "Staff console" or "Agent portal". */
  surface: string
  items: SideNavItem[]
  /** Signed-in identity shown at the bottom (already masked). */
  who: { initials: string; name: string; role: string }
  onNavigate?: () => void
}

/** The dark 264px side menu shared by the staff console and the agent portal (design: ConsoleNav). */
export function SideNav({ surface, items, who, onNavigate }: SideNavProps) {
  return (
    <nav aria-label={surface} className="flex min-h-full w-64 flex-col gap-6 bg-ink px-4 py-6 text-white">
      <div className="flex items-center gap-3 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-brand font-extrabold">W</span>
        <span className="flex flex-col"><span className="text-base font-extrabold">WalletPesa</span><span className="text-xs font-semibold text-slate-400">{surface}</span></span>
      </div>
      <div className="flex flex-1 flex-col gap-1">
        {items.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink key={to} to={to} end={end} onClick={onNavigate}
            className={({ isActive }) => `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400 ${isActive ? 'bg-[#1E3A8A] text-white' : 'text-slate-300 hover:bg-[#111A2E]'}`}>
            <Icon aria-hidden="true" size={18} />
            <span className="flex-1">{label}</span>
            {badge && <span className="rounded-full bg-[#C2410C] px-2 py-0.5 text-xs font-extrabold">{badge}</span>}
          </NavLink>
        ))}
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-[#111A2E] p-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E3A8A] text-[13px] font-extrabold text-blue-100">{who.initials}</span>
        <span className="flex min-w-0 flex-col"><span className="truncate text-sm font-bold">{who.name}</span><span className="text-xs text-slate-400">{who.role}</span></span>
      </div>
    </nav>
  )
}
