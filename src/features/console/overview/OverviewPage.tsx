import { AlertTriangle, Building2, Landmark, MoreVertical, Receipt, ScrollText, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { formatDate, formatTime, todayInDar } from '../../../shared/lib/dates'
import { amountOf, formatCompact, formatTzs } from '../../../shared/lib/money'
import { Button, EmptyState, ErrorState, LoadingState } from '../../../shared/ui/controls'
import { Modal } from '../../../shared/ui/Modal'
import { DetailRow } from '../../../shared/ui/SidePanel'
import { toast } from '../../../shared/ui/toast'
import type { OverviewResponse } from './types'

type Period = 'today' | 'week' | 'month' | 'custom'
const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: 'Today' }, { key: 'week', label: 'Week' }, { key: 'month', label: 'Month' }, { key: 'custom', label: 'Custom range' },
]

type Recent = OverviewResponse['recentTransactions'][number]

function monthStart(): string { return `${todayInDar().slice(0, 8)}01` }

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: 'bg-green-50 text-green-700', SUCCESS: 'bg-green-50 text-green-700',
  PENDING: 'bg-amber-50 text-amber-700', FAILED: 'bg-red-50 text-red-700',
}

const titleCase = (v: string) => v.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

/** "16 min", "3 h", "2 days" since the request was made. */
function waited(iso: string): { text: string; late: boolean } {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (Number.isNaN(mins)) return { text: '', late: false }
  const text = mins < 60 ? `${mins} min` : mins < 1440 ? `${Math.round(mins / 60)} h` : `${Math.round(mins / 1440)} d`
  return { text, late: mins > 15 }
}

function Card({ title, subtitle, children, aside, tone = 'plain' }: { title: string; subtitle?: string; children: React.ReactNode; aside?: React.ReactNode; tone?: 'plain' | 'warn' }) {
  return (
    <section aria-label={title} className={`rounded-2xl border bg-white p-5 ${tone === 'warn' ? 'border-orange-200' : 'border-line'}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col"><h2 className="text-[17px] font-bold">{title}</h2>{subtitle && <span className="text-[13px] text-muted">{subtitle}</span>}</div>
        {aside}
      </div>
      {children}
    </section>
  )
}

interface KpiProps { label: string; value: string; unit?: string; sub: string; icon: React.ComponentType<{ size?: number; 'aria-hidden'?: boolean }>; dark?: boolean; valueClass?: string; iconClass?: string; subClass?: string }

function Kpi({ label, value, unit, sub, icon: Icon, dark, valueClass, iconClass, subClass }: KpiProps) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-[18px] shadow-[0_1px_2px_rgba(11,18,32,0.04)] ${dark ? 'border-ink bg-ink text-white' : 'border-line bg-white'}`}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={`text-[13px] font-medium ${dark ? 'text-slate-400' : 'text-muted'}`}>{label}</span>
        <span className={`truncate text-2xl font-extrabold tracking-tight tabular-nums ${valueClass ?? ''}`}>{value}{unit && <span className={`ml-1 text-xs font-semibold tracking-normal ${dark ? 'text-slate-400' : 'text-muted'}`}>{unit}</span>}</span>
        <span className={`text-xs font-medium ${subClass ?? (dark ? 'text-slate-400' : 'text-muted')}`}>{sub}</span>
      </div>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass ?? 'bg-blue-50 text-brand'}`}><Icon aria-hidden size={21} /></span>
    </div>
  )
}

export default function OverviewPage() {
  const [period, setPeriod] = useState<Period>('today')
  const [from, setFrom] = useState(monthStart())
  const [to, setTo] = useState(todayInDar())
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [detail, setDetail] = useState<Recent | null>(null)

  const query = period === 'month'
    ? { range: 'custom', from: monthStart(), to: todayInDar() }
    : period === 'custom' ? { range: 'custom', from, to } : { range: period }
  const state = useApi<OverviewResponse>((signal) => api('/admin/dashboard/overview', { query, signal }), [period, from, to], 30_000)

  // A row menu closes on Escape or a click anywhere else.
  useEffect(() => {
    if (!menuFor) return
    const close = () => setMenuFor(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('click', close)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', onKey) }
  }, [menuFor])

  if (state.loading && !state.data) return <LoadingState label="Loading overview…" />
  if (state.error && !state.data) return <ErrorState error={state.error} onRetry={state.reload} />
  const d = state.data!
  const refreshed = formatTime(d.timestamp)

  const trend = d.transactionMetrics.trend.map((p) => ({ label: p.period, volume: Number(amountOf(p.volume)), count: p.count }))
  const peak = Math.max(0, ...trend.map((t) => t.volume))
  const b = d.transactionMetrics.breakdown
  const mix = [
    { name: 'Cash-in', value: Number(amountOf(b.cashIn.volume)), color: '#16A34A' },
    { name: 'Withdrawal', value: Number(amountOf(b.cashOut.volume)), color: '#DC2626' },
  ]
  const mixTotal = mix.reduce((s, m) => s + m.value, 0)
  const pending = d.actionAlerts.pendingFloatRequests
  const low = d.actionAlerts.lowFloatAgents
  const balanced = d.liquidityCards.isLedgerBalanced
  const rangeLabel = period === 'today' ? 'today' : period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'in range'

  async function copyRef(ref: string) {
    setMenuFor(null)
    try { await navigator.clipboard.writeText(ref); toast.success('Reference copied', { description: ref }) } catch { toast.error('Could not copy', { description: 'Select the reference and copy it by hand.' }) }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-baseline gap-2.5">
        <h1 className="mr-auto text-[26px] font-extrabold tracking-tight">Overview</h1>
        <span className="text-[13px] text-muted">Refreshed {refreshed} · every 30 s</span>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi dark label="Escrow bank" value={formatCompact(d.liquidityCards.escrowBankBalance)} unit="TZS" sub="Ledger escrow wallet · backs all e-money" icon={Landmark} iconClass="bg-white/10 text-white" />
        <Kpi label="Commission pool" value={formatCompact(d.liquidityCards.commissionPoolBalance)} unit="TZS" sub={Number(amountOf(d.liquidityCards.commissionPoolBalance)) < 100_000 ? 'Pool is low: refill it from revenue' : 'Pays agents their commission'} icon={Building2} iconClass={Number(amountOf(d.liquidityCards.commissionPoolBalance)) < 100_000 ? 'bg-orange-50 text-orange-700' : 'bg-slate-100 text-slate-600'} subClass={Number(amountOf(d.liquidityCards.commissionPoolBalance)) < 100_000 ? 'font-bold text-orange-700' : undefined} />
        <Kpi label="Transactions" value={d.transactionMetrics.totalCount.toLocaleString('en-US')} sub={`Completed ${rangeLabel}`} icon={Receipt} subClass="text-green-600" />
        <Kpi label="Revenue" value={formatCompact(d.liquidityCards.companyRevenueBalance)} unit="TZS" sub="Fees collected to date" icon={TrendingUp} iconClass="bg-green-50 text-green-600" subClass="text-green-600" />
        <Kpi label="Ledger status" value={balanced ? 'Balanced' : 'Not balanced'} sub={`Checked ${refreshed}`} icon={ScrollText}
          valueClass={balanced ? 'text-green-700' : 'text-red-700'} iconClass={balanced ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} subClass={balanced ? undefined : 'font-bold text-red-700'} />
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Card title="Transaction volume" subtitle={`${formatDate(d.transactionMetrics.periodStart)} to ${formatDate(d.transactionMetrics.periodEnd)}`} aside={
            <div role="group" aria-label="Period" className="flex max-w-full gap-0.5 overflow-x-auto rounded-full bg-slate-100 p-[3px]">
              {PERIODS.map((p) => (
                <button key={p.key} type="button" aria-pressed={period === p.key} onClick={() => setPeriod(p.key)}
                  className={`h-[34px] shrink-0 rounded-full px-3.5 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${period === p.key ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}>{p.label}</button>
              ))}
            </div>}>
            {period === 'custom' && (
              <div className="mb-3 flex flex-wrap items-end gap-2.5 rounded-xl border border-line bg-surface p-3">
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">From<input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-[38px] rounded-[10px] border border-line px-2.5 text-[13px] font-medium text-ink" /></label>
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">To<input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} className="h-[38px] rounded-[10px] border border-line px-2.5 text-[13px] font-medium text-ink" /></label>
              </div>
            )}
            <div className="mb-3 flex items-baseline gap-3.5">
              <span className="text-[26px] font-extrabold tracking-tight tabular-nums">{formatTzs(d.transactionMetrics.totalVolume, { symbol: false })} <span className="text-[13px] font-semibold tracking-normal text-muted">TZS</span></span>
              <span className="text-[13px] text-muted">{d.transactionMetrics.totalCount.toLocaleString('en-US')} transactions</span>
            </div>
            {trend.length === 0 ? <EmptyState title="No transactions in this period" /> : (
              <div role="img" aria-label={`Bar chart of transaction volume, ${trend.length} periods`} className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trend}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={{ stroke: '#E2E8F0' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={44} />
                    <Tooltip formatter={(v) => [formatTzs(String(v)), 'Volume']} cursor={{ fill: '#F1F5F9' }} />
                    <Bar dataKey="volume" radius={[5, 5, 0, 0]}>{trend.map((t, i) => <Cell key={i} fill={t.volume === peak && peak > 0 ? '#2563EB' : '#BFDBFE'} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card title={`Float requests · ${pending.count} pending`} aside={<Link to="/console/treasury" className="text-[13px] font-semibold text-brand-dark no-underline hover:underline">Open treasury</Link>}>
            {pending.recentRequests.length === 0 ? <EmptyState title="No pending float requests" /> : (
              <ul>
                {pending.recentRequests.map((r) => {
                  const w = waited(r.requestedAt)
                  return (
                    <li key={r.requestId} className="flex items-center gap-3 border-t border-slate-100 py-3">
                      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-blue-50 text-xs font-bold text-brand">{r.businessName.slice(0, 2).toUpperCase()}</span>
                      <span className="flex min-w-0 flex-1 flex-col"><b className="truncate text-sm">{r.businessName} · {r.agentCode}</b>
                        <span className="truncate text-xs text-muted">{titleCase(r.requestType)}{r.externalReference ? ` · ${r.externalReference}` : ''}</span></span>
                      <span className="flex flex-col items-end"><b className="text-sm tabular-nums">{formatTzs(r.amount, { symbol: false })}</b>
                        <span className={`text-xs font-semibold ${w.late ? 'text-orange-700' : 'text-muted'}`}>{w.text}</span></span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <Card title="Mix by type" subtitle={`${formatDate(d.transactionMetrics.periodStart)} to ${formatDate(d.transactionMetrics.periodEnd)}`}>
            {mixTotal === 0 ? <EmptyState title="No volume to chart" /> : (
              <>
                <div role="img" aria-label={`Cash-in ${formatTzs(b.cashIn.volume)}, withdrawal ${formatTzs(b.cashOut.volume)}`} className="relative mx-auto my-2 h-[190px] w-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={mix} dataKey="value" innerRadius={57} outerRadius={83} stroke="none">{mix.map((m) => <Cell key={m.name} fill={m.color} />)}</Pie></PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-[11px] text-muted">Total</span><b className="text-lg tracking-tight">{formatCompact(mixTotal)}</b></div>
                </div>
                <ul className="mt-2 flex flex-col text-[13px]">
                  {mix.map((m) => (
                    <li key={m.name} className="flex items-center gap-2.5 border-t border-slate-100 py-2.5"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px]" style={{ background: m.color }} />
                      <span className="flex-1">{m.name}</span><b className="tabular-nums">{formatCompact(m.value)}</b><span className="w-10 text-right text-muted">{Math.round((m.value / mixTotal) * 100)}%</span></li>
                  ))}
                  <li className="flex items-center gap-2.5 border-t border-slate-100 py-2.5 text-muted"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-[3px] bg-brand" /><span className="flex-1">Transfers</span><span>Coming soon</span></li>
                </ul>
              </>
            )}
          </Card>

          <Card tone="warn" title={`Low float · below ${formatTzs(low.threshold, { symbol: false })}`} aside={
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-orange-50 text-orange-700"><AlertTriangle aria-hidden="true" size={17} /></span>}>
            {low.agents.length === 0 ? <EmptyState title="No agents below the threshold" /> : (
              <ul>
                {low.agents.map((a) => (
                  <li key={a.agentId} className="flex items-center justify-between gap-3 border-t border-slate-100 py-[11px]">
                    <span className="flex min-w-0 flex-col"><b className="truncate text-sm">{a.businessName} · {a.agentCode}</b><span className="text-xs text-muted">{a.phoneNumber}</span></span>
                    <b className="text-sm tabular-nums text-orange-700">{formatTzs(a.currentBalance, { symbol: false })}</b>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card title="Recent transactions" aside={<span className="text-[13px] text-muted">Latest {d.recentTransactions.length}</span>}>
        {d.recentTransactions.length === 0 ? <EmptyState title="No transactions yet" /> : (
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-[13px]">
              <thead>
                <tr className="border-y border-line bg-surface text-xs text-muted">
                  <th className="px-5 py-2.5 font-semibold">#</th><th className="font-semibold">Reference</th><th className="font-semibold">From</th><th className="font-semibold">Account number</th>
                  <th className="font-semibold">To</th><th className="font-semibold">Account number</th><th className="text-right font-semibold">Amount (TZS)</th>
                  <th className="pl-4 font-semibold">Status</th><th className="font-semibold">Date</th><th className="px-5 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {d.recentTransactions.map((t, i) => (
                  <tr key={t.referenceNo} className="border-b border-slate-100 hover:bg-surface">
                    <td className="px-5 py-2.5 text-muted">{i + 1}</td>
                    <td><span className="block font-mono text-xs">{t.referenceNo}</span><span className="text-[11px] text-muted">{titleCase(t.transactionType)}</span></td>
                    <td className="max-w-[160px] truncate font-bold">{t.fromAccountName}</td>
                    <td className="font-mono text-xs text-slate-600">{t.fromAccountNumber}</td>
                    <td className="max-w-[160px] truncate font-bold">{t.toAccountName}</td>
                    <td className="font-mono text-xs text-slate-600">{t.toAccountNumber}</td>
                    <td className="text-right font-bold tabular-nums">{formatTzs(t.amount, { symbol: false })}</td>
                    <td className="pl-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLE[t.status] ?? 'bg-slate-100 text-slate-700'}`}>{titleCase(t.status)}</span></td>
                    <td><span className="block">{formatDate(t.createdAt)}</span><span className="text-[11px] text-muted">{formatTime(t.createdAt)}</span></td>
                    <td className="relative px-5 text-center">
                      <button type="button" aria-label={`Actions for ${t.referenceNo}`} aria-expanded={menuFor === t.referenceNo} aria-haspopup="menu"
                        onClick={(e) => { e.stopPropagation(); setMenuFor(menuFor === t.referenceNo ? null : t.referenceNo) }}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${menuFor === t.referenceNo ? 'bg-slate-100' : 'bg-white'}`}>
                        <MoreVertical aria-hidden="true" size={16} />
                      </button>
                      {menuFor === t.referenceNo && (
                        <div role="menu" className="absolute right-6 top-11 z-20 w-48 rounded-xl border border-line bg-white p-1.5 text-left shadow-xl">
                          <button type="button" role="menuitem" onClick={() => { setMenuFor(null); setDetail(t) }} className="h-9 w-full rounded-lg px-2.5 text-left text-[13px] font-medium hover:bg-slate-50">View details</button>
                          <button type="button" role="menuitem" onClick={() => void copyRef(t.referenceNo)} className="h-9 w-full rounded-lg px-2.5 text-left text-[13px] font-medium hover:bg-slate-50">Copy reference</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={Boolean(detail)} title={detail ? `${formatTzs(detail.amount, { symbol: false })} TZS` : ''} subtitle={detail?.referenceNo} width={480} onClose={() => setDetail(null)}
        footer={<Button block onClick={() => setDetail(null)}>Done</Button>}>
        {detail && (
          <div>
            <DetailRow label="Type">{titleCase(detail.transactionType)}</DetailRow>
            <DetailRow label="From">{detail.fromAccountName} · {detail.fromAccountNumber}</DetailRow>
            <DetailRow label="To">{detail.toAccountName} · {detail.toAccountNumber}</DetailRow>
            <DetailRow label="Status">{titleCase(detail.status)}</DetailRow>
            <DetailRow label="Date">{formatDate(detail.createdAt)}, {formatTime(detail.createdAt)}</DetailRow>
          </div>
        )}
      </Modal>
    </div>
  )
}
