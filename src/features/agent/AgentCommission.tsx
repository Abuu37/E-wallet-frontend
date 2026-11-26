import { Coins, Hash, TrendingUp, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { downloadCsv } from '../../shared/lib/csv'
import { dayInDar, formatDate, formatDateTime, formatTime, lastDays, todayInDar } from '../../shared/lib/dates'
import { amountOf, formatCompact, formatTzs, sumAmounts } from '../../shared/lib/money'
import { Button, EmptyState, ErrorState, LoadingState } from '../../shared/ui/controls'
import { DateField, ExportButton, FilterBar, KpiRow, PageHeader, SearchField, SelectField, TableCard } from '../../shared/ui/console'
import { rowProps } from '../../shared/ui/rowProps'
import { counterparty, typeLabel, useAgentTransactions, type AgentTx } from './agentTx'
import { TransactionPanel } from './AgentTransactions'
import type { AgentOverview } from './AgentHome'

const PAGE = 10
const RANGES = [7, 14, 30]

export default function AgentCommission() {
  const txs = useAgentTransactions()
  const overview = useApi<AgentOverview>((signal) => api('/agent/dashboard/overview', { signal }), [], 30_000)
  const [days, setDays] = useState(14)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(0)
  const [openRef, setOpenRef] = useState<string | null>(null)
  const reset = (set: (v: string) => void) => (v: string) => { set(v); setPage(0) }

  const own = useMemo(() => overview.data ? [overview.data.wallets.floatAccount.accountNumber, overview.data.wallets.commissionAccount.accountNumber] : [], [overview.data])
  // Rows that earned commission, completed only. The server returns the agent's own transactions.
  const earning = useMemo(() => (txs.data?.transactions ?? []).filter((t) => t.status === 'COMPLETED' && Number(amountOf(t.commission)) > 0), [txs.data])

  const chart = useMemo(() => {
    const byDay = new Map<string, string[]>()
    earning.forEach((t) => { const k = dayInDar(t.createdAt); byDay.set(k, [...(byDay.get(k) ?? []), amountOf(t.commission)]) })
    return lastDays(days).map((d) => ({ day: d, label: d.slice(8), commission: Number(sumAmounts(byDay.get(d) ?? [])) }))
  }, [earning, days])

  const month = todayInDar().slice(0, 7)
  const thisMonth = earning.filter((t) => dayInDar(t.createdAt).startsWith(month))
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return earning.filter((t) => {
      const c = counterparty(t, own)
      return (!type || t.type === type) && (!date || dayInDar(t.createdAt) === date) && (!q || [t.reference, c.name, c.account].some((v) => v.toLowerCase().includes(q)))
    })
  }, [earning, own, search, type, date])
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE)

  if ((txs.loading && !txs.data) || (overview.loading && !overview.data)) return <LoadingState />
  if (overview.error && !overview.data) return <ErrorState error={overview.error} onRetry={overview.reload} />
  if (txs.error && !txs.data) return <ErrorState error={txs.error} onRetry={txs.reload} />
  const o = overview.data!
  const chartTotal = sumAmounts(chart.map((c) => c.commission))

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 tabular-nums">
      <PageHeader title="Commission" subtitle="What you earn for every cash-in and withdrawal you serve." />

      <KpiRow items={[
        { label: 'Commission wallet', value: formatTzs(o.wallets.commissionAccount.balance, { symbol: false }), unit: 'TZS', sub: 'Available balance', icon: Wallet },
        { label: 'Earned today', value: formatTzs(o.todaySummary.commissionEarnedToday, { symbol: false }), unit: 'TZS', sub: `${o.todaySummary.totalTransactionsCount} transactions today`, icon: Coins },
        { label: 'Earned this month', value: formatTzs(sumAmounts(thisMonth.map((t) => t.commission)), { symbol: false }), unit: 'TZS', sub: 'From your latest transactions', icon: TrendingUp },
        { label: 'Transactions that paid', value: String(earning.length), sub: 'In your latest transactions', icon: Hash },
      ]} />

      <section aria-label="Commission per day" className="rounded-[20px] border border-line bg-white p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-base font-extrabold">Commission per day</h2><span className="text-xs text-muted">Last {days} days · {formatTzs(chartTotal)}</span></div>
          <div role="group" aria-label="Range" className="flex rounded-full bg-slate-100 p-1">
            {RANGES.map((r) => (
              <button key={r} type="button" aria-pressed={days === r} onClick={() => setDays(r)}
                className={`rounded-full px-3 py-1 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${days === r ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}>{r} days</button>
            ))}
          </div>
        </div>
        {chart.every((c) => c.commission === 0) ? <EmptyState title="No commission in this period" description="Commission appears here as you serve customers." /> : (
          <div role="img" aria-label={`Bar chart of commission per day for the last ${days} days`} className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={40} />
                <Tooltip labelFormatter={(_, p) => p?.[0]?.payload?.day ?? ''} formatter={(v) => [formatTzs(String(v)), 'Commission']} />
                <Bar dataKey="commission" fill="#14B8A6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <FilterBar label="Filter commission" active={Boolean(search || type || date)} onClear={() => { setPage(0); setSearch(''); setType(''); setDate('') }}>
        <SearchField id="f-q" value={search} onChange={reset(setSearch)} placeholder="Search by reference or customer" />
        <SelectField id="f-type" label="Type" value={type} onChange={reset(setType)} options={[['', 'All types'], ['CASH_IN', 'Cash-in'], ['CASH_OUT', 'Withdrawal']]} />
        <DateField id="f-date" label="Date" value={date} onChange={reset(setDate)} />
      </FilterBar>

      <TableCard title="Commission history" countText={`${rows.length} shown`} action={<ExportButton disabled={rows.length === 0} onClick={() => exportCsv(rows, own)} />}>
        {rows.length === 0 ? <EmptyState title="No commission matches these filters." /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead><tr className="text-xs text-muted"><th className="px-5 py-2 font-semibold">#</th><th className="font-semibold">Reference</th><th className="font-semibold">Type</th><th className="font-semibold">Customer</th><th className="text-right font-semibold">Amount (TZS)</th><th className="text-right font-semibold">You earned</th><th className="px-5 font-semibold">Date</th></tr></thead>
                <tbody>
                  {shown.map((t, i) => (
                    <tr key={t.reference} {...rowProps(() => setOpenRef(t.reference), `Open transaction ${t.reference}`)}>
                      <td className="px-5 py-3 text-muted">{page * PAGE + i + 1}</td>
                      <td className="font-mono text-xs">{t.reference}</td>
                      <td><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${t.type === 'CASH_IN' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100'}`}>{typeLabel(t.type)}</span></td>
                      <td>{counterparty(t, own).name}</td>
                      <td className="text-right">{formatTzs(t.amount, { symbol: false })}</td>
                      <td className="text-right font-bold text-teal-700">+{formatTzs(t.commission, { symbol: false })}</td>
                      <td className="px-5 text-xs">{formatDate(t.createdAt)}<br /><span className="text-muted">{formatTime(t.createdAt)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
              <span className="text-muted">Page {page + 1} of {pages}</span>
              <div className="flex gap-2">
                <Button variant="secondary" className="h-9 px-4 text-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="secondary" className="h-9 px-4 text-sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </TableCard>

      {openRef && <TransactionPanel reference={openRef} onClose={() => setOpenRef(null)} />}
    </div>
  )
}

function exportCsv(rows: AgentTx[], own: string[]) {
  downloadCsv('my-commission.csv', ['Reference', 'Type', 'Customer', 'Amount (TZS)', 'You earned (TZS)', 'Date'],
    rows.map((t) => [t.reference, typeLabel(t.type), counterparty(t, own).name, amountOf(t.amount), amountOf(t.commission), formatDateTime(t.createdAt)]))
}
