import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { downloadCsv } from '../../shared/lib/csv'
import { formatDate, formatDateTime, formatTime } from '../../shared/lib/dates'
import { amountOf, formatTzs, sumAmounts } from '../../shared/lib/money'
import { Button, EmptyState, ErrorState, LoadingState } from '../../shared/ui/controls'
import { DateField, ExportButton, FilterBar, PageHeader, SearchField, SelectField, TableCard } from '../../shared/ui/console'
import { rowProps } from '../../shared/ui/rowProps'
import { DetailRow, SidePanel, StatusBadge } from '../../shared/ui/SidePanel'
import { counterparty, SERVED_TYPES, typeLabel, useAgentTransactions, type AgentTx } from './agentTx'
import type { AgentOverview } from './AgentHome'

const PAGE = 10

export default function AgentTransactions() {
  const txs = useAgentTransactions()
  const overview = useApi<AgentOverview>((signal) => api('/agent/dashboard/overview', { signal }), [])
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(0)
  const [openRef, setOpenRef] = useState<string | null>(null)
  const reset = (set: (v: string) => void) => (v: string) => { set(v); setPage(0) }

  const own = useMemo(() => overview.data ? [overview.data.wallets.floatAccount.accountNumber, overview.data.wallets.commissionAccount.accountNumber] : [], [overview.data])
  const served = useMemo(() => (txs.data?.transactions ?? []).filter((t) => SERVED_TYPES.includes(t.type)), [txs.data])
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return served.filter((t) => {
      const c = counterparty(t, own)
      return (!type || t.type === type) && (!date || t.createdAt.slice(0, 10) === date)
        && (!q || [t.reference, c.name, c.account].some((v) => v.toLowerCase().includes(q)))
    })
  }, [served, own, search, type, date])

  const completed = rows.filter((t) => t.status === 'COMPLETED')
  const sum = (kind: string) => sumAmounts(completed.filter((t) => t.type === kind).map((t) => t.amount))
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE)

  if ((txs.loading && !txs.data) || (overview.loading && !overview.data)) return <LoadingState />
  if (txs.error && !txs.data) return <ErrorState error={txs.error} onRetry={txs.reload} />

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 tabular-nums">
      <PageHeader title="Transactions" subtitle="Every cash-in you made and every withdrawal paid at your till."
        action={<Link to="/agent/cash-in" className="inline-flex h-12 items-center rounded-xl bg-brand px-[18px] font-bold text-white no-underline hover:bg-brand-dark">New cash-in</Link>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Summary of the rows shown">
        {[['Transactions', String(rows.length), ''], ['Cash-in volume', formatTzs(sum('CASH_IN')), 'completed'],
          ['Withdrawals volume', formatTzs(sum('CASH_OUT')), 'completed'], ['Commission earned', formatTzs(sumAmounts(completed.map((t) => t.commission))), 'completed']].map(([k, v, sub]) => (
          <div key={k} className="flex flex-col rounded-2xl border border-line bg-white px-4 py-3"><span className="text-xs font-semibold text-muted">{k}</span><b className="truncate text-lg">{v}</b>{sub && <span className="text-xs text-muted">{sub}</span>}</div>
        ))}
      </div>

      <FilterBar label="Filter transactions" active={Boolean(search || type || date)} onClear={() => { setPage(0); setSearch(''); setType(''); setDate('') }}>
        <SearchField id="f-q" value={search} onChange={reset(setSearch)} placeholder="Search by reference, customer or account" />
        <SelectField id="f-type" label="Type" value={type} onChange={reset(setType)} options={[['', 'All types'], ['CASH_IN', 'Cash-in'], ['CASH_OUT', 'Withdrawal']]} />
        <DateField id="f-date" label="Date" value={date} onChange={reset(setDate)} />
      </FilterBar>

      <TableCard title="Your transactions" countText={`${rows.length} shown`} action={<ExportButton disabled={rows.length === 0} onClick={() => exportCsv(rows, own)} />}>
        {rows.length === 0 ? <EmptyState title="No transactions match these filters." /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead><tr className="text-xs text-muted"><th className="px-5 py-2 font-semibold">#</th><th className="font-semibold">Reference</th><th className="font-semibold">Type</th><th className="font-semibold">Customer</th>
                  <th className="text-right font-semibold">Amount (TZS)</th><th className="text-right font-semibold">Fee</th><th className="text-right font-semibold">You earned</th><th className="pl-4 font-semibold">Status</th><th className="px-5 font-semibold">Date</th></tr></thead>
                <tbody>
                  {shown.map((t, i) => {
                    const c = counterparty(t, own)
                    return (
                      <tr key={t.reference} {...rowProps(() => setOpenRef(t.reference), `Open transaction ${t.reference}`)}>
                        <td className="px-5 py-3 text-muted">{page * PAGE + i + 1}</td>
                        <td className="font-mono text-xs font-bold">{t.reference}</td>
                        <td><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${t.type === 'CASH_IN' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100'}`}>{typeLabel(t.type)}</span></td>
                        <td><b className="block">{c.name}</b><span className="text-xs text-muted">{c.account}</span></td>
                        <td className="text-right font-bold">{formatTzs(t.amount, { symbol: false })}</td>
                        <td className="text-right">{formatTzs(t.fee, { symbol: false })}</td>
                        <td className="text-right font-bold text-teal-700">{Number(amountOf(t.commission)) > 0 ? `+${formatTzs(t.commission, { symbol: false })}` : '—'}</td>
                        <td className="pl-4"><StatusBadge status={t.status} /></td>
                        <td className="px-5 text-xs">{formatDate(t.createdAt)}<br /><span className="text-muted">{formatTime(t.createdAt)}</span></td>
                      </tr>
                    )
                  })}
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

      {openRef && <TransactionPanel reference={openRef} own={own} onClose={() => setOpenRef(null)} />}
    </div>
  )
}

export function TransactionPanel({ reference, own, onClose }: { reference: string; own: string[]; onClose: () => void }) {
  const detail = useApi<AgentTx & { externalReference: string | null }>((signal) => api(`/transactions/${encodeURIComponent(reference)}`, { signal }), [reference])
  const t = detail.data
  const c = t ? counterparty(t, own) : null
  return (
    <SidePanel open title={t ? formatTzs(t.amount) : 'Transaction'} subtitle={`${reference}${t ? ` · ${typeLabel(t.type)}` : ''}`} onClose={onClose}>
      {detail.loading ? <LoadingState /> : detail.error ? <ErrorState error={detail.error} onRetry={detail.reload} /> : t && c && (
        <>
          <div className="mb-4"><StatusBadge status={t.status} /></div>
          <DetailRow label="Type">{typeLabel(t.type)}</DetailRow>
          <DetailRow label="Customer">{c.name}<br /><span className="text-xs font-normal text-muted">{c.account}</span></DetailRow>
          <DetailRow label="Amount">{formatTzs(t.amount)}</DetailRow>
          <DetailRow label="Customer fee">{formatTzs(t.fee)}</DetailRow>
          <DetailRow label="You earned">{formatTzs(t.commission)}</DetailRow>
          <DetailRow label="Date">{formatDateTime(t.createdAt)}</DetailRow>
          <p className="mt-4 text-xs text-muted">Keep this reference if a customer asks about this transaction.</p>
        </>
      )}
    </SidePanel>
  )
}

function exportCsv(rows: AgentTx[], own: string[]) {
  downloadCsv('my-transactions.csv', ['Reference', 'Type', 'Customer', 'Account', 'Amount (TZS)', 'Fee (TZS)', 'You earned (TZS)', 'Status', 'Date'],
    rows.map((t) => { const c = counterparty(t, own); return [t.reference, typeLabel(t.type), c.name, c.account, amountOf(t.amount), amountOf(t.fee), amountOf(t.commission), t.status, formatDateTime(t.createdAt)] }))
}
