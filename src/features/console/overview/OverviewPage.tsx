import { AlertTriangle, Coins, Landmark, Store, Users } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { formatDate, formatTime, todayInDar } from '../../../shared/lib/dates'
import { amountOf, formatCompact, formatTzs } from '../../../shared/lib/money'
import { EmptyState, ErrorState, LoadingState } from '../../../shared/ui/controls'
import type { OverviewResponse } from './types'

type Period = 'today' | 'week' | 'month' | 'custom'
const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' }, { key: 'week', label: 'Week' }, { key: 'month', label: 'Month' }, { key: 'custom', label: 'Custom' },
]

function monthStart(): string { return `${todayInDar().slice(0, 8)}01` }

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: 'bg-teal-50 text-teal-800', SUCCESS: 'bg-teal-50 text-teal-800',
  PENDING: 'bg-amber-50 text-amber-800', FAILED: 'bg-rose-50 text-rose-800',
}

function Card({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section aria-label={title} className="rounded-2xl border border-line bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-base font-extrabold">{title}</h2>{aside}</div>
      {children}
    </section>
  )
}

export default function OverviewPage() {
  const [period, setPeriod] = useState<Period>('today')
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(todayInDar())

  const query = period === 'month'
    ? { range: 'custom', from: monthStart(), to: todayInDar() }
    : period === 'custom' ? { range: 'custom', from, to } : { range: period }
  const state = useApi<OverviewResponse>((signal) => api('/admin/dashboard/overview', { query, signal }), [period, from, to], 30_000)

  if (state.loading && !state.data) return <LoadingState label="Loading overview…" />
  if (state.error && !state.data) return <ErrorState error={state.error} onRetry={state.reload} />
  const d = state.data!

  const kpis = [
    { k: 'Customer wallets', v: formatTzs(d.liquidityCards.totalCustomerWalletBalance), sub: `${d.networkStats.totalActiveCustomers} active customers`, icon: Users },
    { k: 'Agent float', v: formatTzs(d.liquidityCards.totalAgentFloatBalance), sub: `${d.networkStats.totalActiveAgents} active agents`, icon: Store },
    { k: 'Company master', v: formatTzs(d.liquidityCards.companyMasterBalance), sub: d.liquidityCards.isLedgerBalanced ? 'Ledger balanced' : 'Ledger NOT balanced', icon: Landmark },
    { k: 'Revenue', v: formatTzs(d.liquidityCards.companyRevenueBalance), sub: `Agent commission ${formatTzs(d.liquidityCards.totalAgentCommissionBalance)}`, icon: Coins },
  ]

  const trend = d.transactionMetrics.trend.map((p) => ({ label: p.period, volume: Number(amountOf(p.volume)), count: p.count }))
  const b = d.transactionMetrics.breakdown
  const mix = [
    { name: 'Cash-in', value: Number(amountOf(b.cashIn.volume)), color: '#16A34A' },
    { name: 'Cash-out', value: Number(amountOf(b.cashOut.volume)), color: '#DC2626' },
  ]
  const mixTotal = mix.reduce((s, m) => s + m.value, 0)
  const pending = d.actionAlerts.pendingFloatRequests
  const low = d.actionAlerts.lowFloatAgents

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Overview</h1>
        <span className="text-xs text-muted">Updates every 30 s</span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ k, v, sub, icon: Icon }) => (
          <div key={k} className="flex items-start justify-between rounded-2xl border border-line bg-white p-5">
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[13px] font-semibold text-muted">{k}</span>
              <span className="truncate text-xl font-extrabold tabular-nums">{v}</span>
              <span className={`text-xs ${k === 'Company master' && !d.liquidityCards.isLedgerBalanced ? 'font-bold text-[#E11D48]' : 'text-muted'}`}>{sub}</span>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand"><Icon aria-hidden="true" size={21} /></span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Card title="Transaction volume" aside={
            <div role="group" aria-label="Period" className="flex rounded-full bg-slate-100 p-1">
              {PERIODS.map((p) => (
                <button key={p.key} type="button" aria-pressed={period === p.key} onClick={() => setPeriod(p.key)}
                  className={`rounded-full px-3 py-1 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${period === p.key ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}>{p.label}</button>
              ))}
            </div>}>
            {period === 'custom' && (
              <div className="mb-3 flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1 text-xs font-semibold">From<input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-2" /></label>
                <label className="flex flex-col gap-1 text-xs font-semibold">To<input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-2" /></label>
              </div>
            )}
            <p className="text-2xl font-extrabold tabular-nums">{formatTzs(d.transactionMetrics.totalVolume)}</p>
            <p className="mb-3 text-xs text-muted">{d.transactionMetrics.totalCount} transactions · {formatDate(d.transactionMetrics.periodStart)} to {formatDate(d.transactionMetrics.periodEnd)}</p>
            {trend.length === 0 ? <EmptyState title="No transactions in this period" /> : (
              <div role="img" aria-label={`Bar chart of transaction volume, ${trend.length} periods`} className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend}>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={44} />
                    <Tooltip formatter={(v) => [formatTzs(String(v)), 'Volume']} />
                    <Bar dataKey="volume" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card title={`Float requests · ${pending.count} pending`} aside={<Link to="/console/treasury" className="text-sm font-bold text-brand-dark">Open treasury</Link>}>
            {pending.recentRequests.length === 0 ? <EmptyState title="No pending float requests" /> : (
              <ul className="divide-y divide-line">
                {pending.recentRequests.map((r) => (
                  <li key={r.requestId} className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-extrabold text-brand-dark">{r.businessName.slice(0, 2).toUpperCase()}</span>
                    <span className="flex min-w-0 flex-1 flex-col"><b className="truncate text-sm">{r.businessName}</b><span className="text-xs text-muted">{r.agentCode} · {r.requestType}</span></span>
                    <span className="flex flex-col text-right"><b className="text-sm tabular-nums">{formatTzs(r.amount)}</b><span className="text-xs text-muted">{formatDate(r.requestedAt)} {formatTime(r.requestedAt)}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card title="Mix by type">
            {mixTotal === 0 ? <EmptyState title="No volume to chart" /> : (
              <>
                <div role="img" aria-label={`Cash-in ${formatTzs(b.cashIn.volume)}, cash-out ${formatTzs(b.cashOut.volume)}`} className="mx-auto h-44 w-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={mix} dataKey="value" innerRadius={50} outerRadius={80} stroke="none">{mix.map((m) => <Cell key={m.name} fill={m.color} />)}</Pie></PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 flex flex-col gap-2 text-sm">
                  {mix.map((m) => (
                    <li key={m.name} className="flex items-center gap-2"><span aria-hidden="true" className="h-3 w-3 rounded-full" style={{ background: m.color }} />
                      <span className="flex-1">{m.name}</span><b className="tabular-nums">{formatTzs(m.value)}</b><span className="w-10 text-right text-muted">{Math.round((m.value / mixTotal) * 100)}%</span></li>
                  ))}
                  <li className="flex items-center gap-2 text-muted"><span aria-hidden="true" className="h-3 w-3 rounded-full bg-brand" /><span className="flex-1">Transfers</span><span>Coming soon</span></li>
                </ul>
              </>
            )}
          </Card>

          <Card title={`Low float · below ${formatTzs(low.threshold, { symbol: false })}`} aside={<AlertTriangle aria-hidden="true" size={17} className="text-amber-600" />}>
            {low.agents.length === 0 ? <EmptyState title="No agents below the threshold" /> : (
              <ul className="divide-y divide-line">
                {low.agents.map((a) => (
                  <li key={a.agentId} className="flex items-center justify-between gap-3 py-3">
                    <span className="flex min-w-0 flex-col"><b className="truncate text-sm">{a.businessName}</b><span className="text-xs text-muted">{a.agentCode}</span></span>
                    <b className="text-sm tabular-nums text-[#E11D48]">{formatTzs(a.currentBalance)}</b>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card title="Recent transactions" aside={<span className="text-xs text-muted">Latest {d.recentTransactions.length}</span>}>
        {d.recentTransactions.length === 0 ? <EmptyState title="No transactions yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead><tr className="text-xs text-muted"><th className="py-2 pr-3 font-semibold">Reference</th><th className="pr-3 font-semibold">Type</th><th className="pr-3 font-semibold">From</th><th className="pr-3 font-semibold">To</th><th className="pr-3 text-right font-semibold">Amount (TZS)</th><th className="pr-3 font-semibold">Status</th><th className="font-semibold">Date</th></tr></thead>
              <tbody>
                {d.recentTransactions.map((t) => (
                  <tr key={t.referenceNo} className="border-t border-line hover:bg-surface">
                    <td className="py-3 pr-3 font-mono text-xs">{t.referenceNo}</td>
                    <td className="pr-3">{t.transactionType}</td>
                    <td className="pr-3"><b className="block">{t.fromAccountName}</b><span className="text-xs text-muted">{t.fromAccountNumber}</span></td>
                    <td className="pr-3"><b className="block">{t.toAccountName}</b><span className="text-xs text-muted">{t.toAccountNumber}</span></td>
                    <td className="pr-3 text-right font-bold tabular-nums">{formatTzs(t.amount, { symbol: false })}</td>
                    <td className="pr-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLE[t.status] ?? 'bg-slate-100 text-slate-700'}`}>{t.status}</span></td>
                    <td className="text-xs">{formatDate(t.createdAt)}<br /><span className="text-muted">{formatTime(t.createdAt)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
