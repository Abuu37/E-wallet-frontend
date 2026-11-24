import { Link } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { formatDateTime } from '../../shared/lib/dates'
import { formatTzs } from '../../shared/lib/money'
import { ComingSoon, EmptyState, ErrorState, LoadingState } from '../../shared/ui/controls'
import { StatusBadge } from '../../shared/ui/SidePanel'

type Amount = number | string
export interface AgentOverview {
  agentProfile: { agentCode: string; businessName: string; status: string }
  summary: { totalFloatBalance: Amount; totalCommissionBalance: Amount; totalTransactions: number; floatHealth: string }
  wallets: { floatAccount: { accountNumber: string; balance: Amount; floatHealth: string }; commissionAccount: { accountNumber: string; balance: Amount } }
  todaySummary: { commissionEarnedToday: Amount; totalTransactionsCount: number; cashInVolume: Amount; cashInCount: number; cashOutVolume: Amount; cashOutCount: number }
  recentTransactions: { internalReference: string; type: string; customerName: string; customerAccount: string; amount: Amount; commissionEarned: Amount | null; status: string; createdAt: string }[]
}

const HEALTH_TONE: Record<string, string> = { HEALTHY: 'bg-teal-50 text-teal-800', LOW: 'bg-amber-50 text-amber-800', CRITICAL: 'bg-rose-50 text-rose-800' }

export default function AgentHome() {
  const state = useApi<AgentOverview>((signal) => api('/agent/dashboard/overview', { signal }), [], 30_000)
  if (state.loading && !state.data) return <LoadingState label="Loading your dashboard…" />
  if (state.error && !state.data) return <ErrorState error={state.error} onRetry={state.reload} />
  const d = state.data!

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold tracking-tight">{d.agentProfile.businessName}</h1><p className="text-sm text-muted">{d.agentProfile.agentCode}</p></div>
        <div className="flex items-center gap-2"><StatusBadge status={d.agentProfile.status} />
          <Link to="/agent/cash-in" className="inline-flex h-12 items-center rounded-full bg-brand px-6 font-bold text-white hover:bg-brand-dark">New cash-in</Link></div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <section aria-label="Float" className="rounded-2xl bg-ink p-5 text-white">
          <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-300">Float balance</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${HEALTH_TONE[d.wallets.floatAccount.floatHealth] ?? 'bg-slate-100 text-slate-700'}`}>{d.wallets.floatAccount.floatHealth}</span></div>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{formatTzs(d.wallets.floatAccount.balance)}</p>
          <p className="mt-2 text-xs text-slate-300">Account •••• {d.wallets.floatAccount.accountNumber.slice(-4)}</p>
        </section>
        <section aria-label="Commission" className="rounded-2xl border border-line bg-white p-5">
          <span className="text-sm font-semibold text-muted">Commission balance</span>
          <p className="mt-1 text-3xl font-extrabold tabular-nums">{formatTzs(d.wallets.commissionAccount.balance)}</p>
          <p className="mt-2 text-xs text-muted">Earned today {formatTzs(d.todaySummary.commissionEarnedToday)}</p>
        </section>
      </div>

      <section aria-label="Today" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[['Cash-in today', formatTzs(d.todaySummary.cashInVolume), `${d.todaySummary.cashInCount} transactions`],
          ['Cash-out today', formatTzs(d.todaySummary.cashOutVolume), `${d.todaySummary.cashOutCount} transactions`],
          ['All time', String(d.summary.totalTransactions), 'transactions']].map(([k, v, sub]) => (
          <div key={k} className="rounded-2xl border border-line bg-white p-4"><span className="text-[13px] font-semibold text-muted">{k}</span><p className="truncate text-lg font-extrabold tabular-nums">{v}</p><span className="text-xs text-muted">{sub}</span></div>
        ))}
      </section>

      <section aria-label="Recent transactions" className="rounded-2xl border border-line bg-white p-5">
        <h2 className="mb-2 text-base font-extrabold">Recent transactions</h2>
        {d.recentTransactions.length === 0 ? <EmptyState title="No transactions yet" description="Your cash-ins appear here." /> : (
          <ul className="divide-y divide-line">
            {d.recentTransactions.map((t) => (
              <li key={t.internalReference} className="flex items-center justify-between gap-3 py-3">
                <span className="flex min-w-0 flex-col"><b className="truncate text-sm">{t.type} · {t.customerName}</b><span className="text-xs text-muted">{formatDateTime(t.createdAt)} · {t.status}</span></span>
                <span className="flex flex-col text-right"><b className="text-sm tabular-nums">{formatTzs(t.amount, { symbol: false })}</b>{t.commissionEarned ? <span className="text-xs text-[#16A34A]">+{formatTzs(t.commissionEarned, { symbol: false })} commission</span> : null}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ComingSoon title="Live withdrawals" description="Customer-initiated withdrawals and the live feed arrive in the next release." />
    </div>
  )
}
