import { Link } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { formatDate, formatTime } from '../../shared/lib/dates'
import { formatTzs } from '../../shared/lib/money'
import { EmptyState, ErrorState, LoadingState } from '../../shared/ui/controls'

type Amount = number | string
export interface AgentOverview {
  agentProfile: { agentCode: string; businessName: string; status: string }
  summary: { totalFloatBalance: Amount; totalCommissionBalance: Amount; totalTransactions: number; floatHealth: string }
  wallets: { floatAccount: { accountNumber: string; balance: Amount; floatHealth: string }; commissionAccount: { accountNumber: string; balance: Amount } }
  todaySummary: { commissionEarnedToday: Amount; totalTransactionsCount: number; cashInVolume: Amount; cashInCount: number; cashOutVolume: Amount; cashOutCount: number }
  recentTransactions: { internalReference: string; type: string; customerName: string; customerAccount: string; amount: Amount; commissionEarned: Amount | null; status: string; createdAt: string }[]
}

const HEALTH_TONE: Record<string, string> = { HEALTHY: 'bg-teal-50 text-teal-800', LOW: 'bg-amber-50 text-amber-800', CRITICAL: 'bg-rose-50 text-rose-800' }

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Dar_es_Salaam', hour: '2-digit', hour12: false }).format(new Date()))
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

export default function AgentHome() {
  const state = useApi<AgentOverview>((signal) => api('/agent/dashboard/overview', { signal }), [], 30_000)
  if (state.loading && !state.data) return <LoadingState label="Loading your dashboard…" />
  if (state.error && !state.data) return <ErrorState error={state.error} onRetry={state.reload} />
  const d = state.data!
  const today = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Dar_es_Salaam', weekday: 'short', day: '2-digit', month: 'short' }).format(new Date())

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 tabular-nums">
      <div className="flex flex-wrap items-center gap-4">
        <div className="mr-auto flex flex-col gap-0.5">
          <h1 className="text-[28px] font-extrabold tracking-tight">{greeting()}</h1>
          <span className="text-sm text-slate-600">{d.agentProfile.businessName} · {d.agentProfile.agentCode} · {today}</span>
        </div>
        <Link to="/agent/cash-in" className="inline-flex h-12 items-center rounded-xl bg-brand px-5 font-bold text-white hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300">New cash-in</Link>
      </div>

      <section aria-label="Live withdrawals" className="flex flex-col gap-3 rounded-3xl bg-ink p-6 text-white">
        <div className="flex items-center gap-2.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-slate-500" /><h2 className="text-base font-extrabold">Customer withdrawals · live</h2></div>
        <p className="text-sm text-slate-400">Customer-initiated withdrawals and the live feed are coming soon. You will see each approved withdrawal here with its match code.</p>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <section aria-label="Float" className="flex flex-col gap-2 rounded-[20px] border border-line bg-white p-5">
          <div className="flex items-center justify-between"><span className="text-sm font-bold text-slate-600">Float</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${HEALTH_TONE[d.wallets.floatAccount.floatHealth] ?? 'bg-slate-100 text-slate-700'}`}>{d.wallets.floatAccount.floatHealth}</span></div>
          <span className="text-[34px] font-extrabold leading-none tracking-tight">{formatTzs(d.wallets.floatAccount.balance, { symbol: false })}</span>
          <span className="text-[13px] text-slate-600">Alert below 100,000 · Account •••• {d.wallets.floatAccount.accountNumber.slice(-4)}</span>
        </section>
        <section aria-label="Commission earned" className="flex flex-col gap-2 rounded-[20px] border border-line bg-white p-5">
          <span className="text-sm font-bold text-slate-600">Commission earned</span>
          <span className="text-[34px] font-extrabold leading-none tracking-tight text-teal-700">{formatTzs(d.wallets.commissionAccount.balance, { symbol: false })}</span>
          <span className="text-[13px] text-slate-600">Today {formatTzs(d.todaySummary.commissionEarnedToday)}</span>
        </section>
        <section aria-label="Today" className="flex flex-col gap-2 rounded-[20px] border border-line bg-white p-5">
          <span className="text-sm font-bold text-slate-600">Today</span>
          <div className="flex justify-between text-[15px]"><span>Cash-in · {d.todaySummary.cashInCount}</span><b>{formatTzs(d.todaySummary.cashInVolume, { symbol: false })}</b></div>
          <div className="flex justify-between text-[15px]"><span>Cash-out · {d.todaySummary.cashOutCount}</span><b>{formatTzs(d.todaySummary.cashOutVolume, { symbol: false })}</b></div>
          <div className="flex justify-between text-[15px]"><span>Commission</span><b className="text-teal-700">{formatTzs(d.todaySummary.commissionEarnedToday, { symbol: false })}</b></div>
        </section>
      </div>

      <section aria-label="Recent transactions" className="flex flex-col gap-2 rounded-[20px] border border-line bg-white p-5">
        <h2 className="text-lg font-extrabold">Recent</h2>
        {d.recentTransactions.length === 0 ? <EmptyState title="No transactions yet" description="Your cash-ins appear here." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-sm">
              <thead><tr className="text-left text-slate-600"><th className="px-2 py-2.5 font-bold">Time</th><th className="px-2 font-bold">Type</th><th className="px-2 font-bold">Customer</th><th className="px-2 text-right font-bold">Amount</th><th className="px-2 text-right font-bold">Commission</th><th className="px-2 font-bold">Reference</th></tr></thead>
              <tbody>
                {d.recentTransactions.map((t) => (
                  <tr key={t.internalReference} className="border-t border-slate-100">
                    <td className="px-2 py-3">{formatTime(t.createdAt)}<span className="block text-xs text-slate-500">{formatDate(t.createdAt)}</span></td>
                    <td className="px-2"><span className={`rounded-full px-2 py-1 text-xs font-bold ${t.type.includes('IN') ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-ink'}`}>{t.type}</span></td>
                    <td className="px-2">{t.customerName}</td>
                    <td className="px-2 text-right font-bold">{formatTzs(t.amount, { symbol: false })}</td>
                    <td className="px-2 text-right font-bold text-teal-700">{t.commissionEarned ? `+${formatTzs(t.commissionEarned, { symbol: false })}` : '—'}</td>
                    <td className="px-2 font-mono text-xs text-slate-600">{t.internalReference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
