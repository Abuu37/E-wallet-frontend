import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { formatTime } from '../../shared/lib/dates'
import { formatTzs } from '../../shared/lib/money'
import type { LiveWithdrawal } from './agentApi'

const WINDOWS: [string, number][] = [['15 min', 15], ['Hour', 60], ['Today', 1440]]
const NEW_MS = 2 * 60_000

/** Customer withdrawals paid at the till, refreshed every 5 seconds. Read only: the customer already approved with their PIN. */
export function LiveWithdrawals() {
  const [minutes, setMinutes] = useState(15)
  const feed = useApi<LiveWithdrawal[]>((signal) => api('/agent/withdrawals/live', { query: { minutes }, signal }), [minutes], 5_000)
  const [now, setNow] = useState(() => Date.now())
  const [updatedAt, setUpdatedAt] = useState(() => Date.now())

  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t) }, [])
  // Stamped from a timer callback, not during the effect, so each fresh answer restarts the counter.
  useEffect(() => { if (!feed.data) return; const t = window.setTimeout(() => setUpdatedAt(Date.now()), 0); return () => window.clearTimeout(t) }, [feed.data])

  const items = feed.data ?? []
  const secondsAgo = Math.max(0, Math.round((now - updatedAt) / 1000))

  return (
    <section aria-label="Live withdrawals" className="flex flex-col gap-3 rounded-3xl bg-ink px-6 py-5 text-white">
      <div className="flex flex-wrap items-center gap-3">
        <span aria-hidden="true" className="h-2.5 w-2.5 animate-pulse rounded-full bg-accent motion-reduce:animate-none" />
        <h2 className="mr-auto text-base font-extrabold">Customer withdrawals · live</h2>
        <span className="text-xs text-slate-400" aria-live="off">Updated {secondsAgo}s ago</span>
        <label className="sr-only" htmlFor="lw-window">Show withdrawals from</label>
        <select id="lw-window" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className="h-9 rounded-lg border border-slate-600 bg-ink px-2.5 text-sm font-semibold text-white">
          {WINDOWS.map(([label, m]) => <option key={m} value={m}>{label}</option>)}
        </select>
      </div>

      {items.length === 0 ? (
        <p className="py-3 text-sm text-slate-400">No withdrawals in this time. When a customer withdraws at your till, it shows here with the code they will show you.</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((w) => {
            const isNew = now - new Date(w.createdAt).getTime() < NEW_MS
            return (
              <li key={w.reference} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-700 py-3 first:border-0">
                <span className="flex min-w-[140px] flex-col"><b className="text-[15px]">{w.customerName}</b><span className="text-xs text-slate-400">{w.customerPhone} · {formatTime(w.createdAt)}</span></span>
                {isNew && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-extrabold text-ink">NEW</span>}
                <span className="ml-auto flex items-center gap-4">
                  <span className="flex flex-col items-end"><span className="text-[11px] uppercase tracking-widest text-slate-400">Code</span><b aria-label={`Code ${(w.matchCode ?? '').split('').join(' ')}`} className="text-xl tracking-[0.2em]">{w.matchCode ?? '—'}</b></span>
                  <span className="flex flex-col items-end"><b className="text-[17px]">{formatTzs(w.amount, { symbol: false })}</b><span className="text-xs font-bold text-accent">+{formatTzs(w.commission, { symbol: false })} commission</span></span>
                  <Link to={`/agent/transactions?ref=${w.reference}`} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-bold text-white no-underline hover:bg-white/10">Details</Link>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
