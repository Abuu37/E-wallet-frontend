import { Copy, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { formatDate, formatDateTime, formatTime } from '../../shared/lib/dates'
import { formatTzs } from '../../shared/lib/money'
import { Button, EmptyState, ErrorState, LoadingState } from '../../shared/ui/controls'
import { DateField, FilterBar, PageHeader, SearchField, SelectField, TableCard } from '../../shared/ui/console'
import { rowProps } from '../../shared/ui/rowProps'
import { DetailRow, SidePanel, StatusBadge } from '../../shared/ui/SidePanel'
import { toast } from '../../shared/ui/toast'
import { TILL_TYPE_LABEL, type TillTx, type TillTxPage } from './agentApi'

const PAGE = 10
const CHIP = (type: string) => (type === 'CASH_IN' ? 'bg-teal-100 text-teal-800' : 'bg-slate-100')

/** Transactions (A06): every cash-in the agent made and every withdrawal paid at their till. */
export default function AgentTransactions() {
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [q, setQ] = useState('')
  const [type, setType] = useState('')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(0)
  const openRef = params.get('ref')

  // Wait a moment after typing before asking the server.
  useEffect(() => { const t = window.setTimeout(() => { setQ(search.trim()); setPage(0) }, 300); return () => window.clearTimeout(t) }, [search])

  const list = useApi<TillTxPage>((signal) => api('/agent/transactions', { query: { type, from: date, to: date, q, page, size: PAGE }, signal }), [type, date, q, page], 30_000)
  const reset = (set: (v: string) => void) => (v: string) => { set(v); setPage(0) }

  if (list.loading && !list.data) return <LoadingState />
  if (list.error && !list.data) return <ErrorState error={list.error} onRetry={list.reload} />
  const data = list.data!
  const total = data.totalElements
  const pages = Math.max(1, Math.ceil(total / PAGE))
  const k = data.kpis

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 tabular-nums">
      <PageHeader title="Transactions" subtitle="Every cash-in you made and every withdrawal paid at your till."
        action={<Link to="/agent/cash-in" className="inline-flex h-12 items-center rounded-xl bg-brand px-[18px] font-bold text-white no-underline hover:bg-brand-dark">New cash-in</Link>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Today at a glance">
        {[['Today', String(k.todayCount), 'transactions'], ['Cash-in today', String(k.cashInToday), 'customers served'],
          ['Withdrawals today', String(k.withdrawalsToday), 'paid at your till'], ['Pending transactions', String(k.pendingToday), k.pendingToday ? 'waiting' : 'none waiting']].map(([label, value, sub]) => (
          <div key={label} className="flex flex-col rounded-2xl border border-line bg-white px-4 py-3"><span className="text-xs font-semibold text-muted">{label}</span><b className="text-2xl">{value}</b><span className="text-xs text-muted">{sub}</span></div>
        ))}
      </div>

      <FilterBar label="Filter transactions" active={Boolean(search || type || date)} onClear={() => { setPage(0); setSearch(''); setQ(''); setType(''); setDate('') }}>
        <SearchField id="f-q" value={search} onChange={setSearch} placeholder="Search by reference, customer or account" />
        <SelectField id="f-type" label="Type" value={type} onChange={reset(setType)} options={[['', 'All types'], ['CASH_IN', 'Cash-in'], ['CASH_OUT', 'Withdrawal']]} />
        <DateField id="f-date" label="Date" value={date} onChange={reset(setDate)} />
      </FilterBar>

      <TableCard title="Your transactions" countText={`${total} ${total === 1 ? 'transaction' : 'transactions'}`}>
        {data.items.length === 0 ? <EmptyState title={search || type || date ? 'No transactions match these filters.' : 'No transactions yet'} description={search || type || date ? undefined : 'Cash-ins and withdrawals at your till show here.'} /> : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead><tr className="text-xs text-muted"><th className="px-5 py-2 font-semibold">Reference</th><th className="font-semibold">Type</th><th className="font-semibold">Customer</th><th className="font-semibold">Account</th>
                  <th className="text-right font-semibold">Amount (TZS)</th><th className="text-right font-semibold">You earned</th><th className="pl-4 font-semibold">Status</th><th className="px-5 font-semibold">Date</th></tr></thead>
                <tbody>
                  {data.items.map((t) => (
                    <tr key={t.reference} {...rowProps(() => setParams({ ref: t.reference }), `Open transaction ${t.reference}`)}>
                      <td className="px-5 py-3 font-mono text-xs font-bold">{t.reference}</td>
                      <td><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${CHIP(t.type)}`}>{TILL_TYPE_LABEL[t.type] ?? t.type}</span></td>
                      <td><b className="block">{t.customerName}</b><span className="text-xs text-muted">{t.customerPhone}</span></td>
                      <td className="font-mono text-xs">{t.customerAccount}</td>
                      <td className="text-right font-bold">{formatTzs(t.amount, { symbol: false })}</td>
                      <td className="text-right font-bold text-teal-700">{Number(t.commission) > 0 ? `+${formatTzs(t.commission, { symbol: false })}` : '—'}</td>
                      <td className="pl-4"><StatusBadge status={t.status} /></td>
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

      {openRef && <TransactionPanel reference={openRef} onClose={() => setParams({})} />}
    </div>
  )
}

function receiptText(t: TillTx): string {
  return ['WalletPesa agent receipt', '', `Reference: ${t.reference}`, `Date: ${formatDateTime(t.createdAt)}`, `Type: ${TILL_TYPE_LABEL[t.type] ?? t.type}`,
    `Customer: ${t.customerName} ${t.customerPhone}`, `Account: ${t.customerAccount}`, `Amount: TZS ${formatTzs(t.amount, { symbol: false })}`,
    `Customer fee: TZS ${formatTzs(t.customerFee, { symbol: false })}`, `Your commission: TZS ${formatTzs(t.commission, { symbol: false })}`, `Status: ${t.status}`].join('\n')
}

/** The full detail for one transaction: the full phone and account number. Withdrawals have no timeline or notes. */
export function TransactionPanel({ reference, onClose }: { reference: string; onClose: () => void }) {
  const detail = useApi<TillTx>((signal) => api(`/agent/transactions/${encodeURIComponent(reference)}`, { signal }), [reference])
  const t = detail.data

  async function copy() {
    try { await navigator.clipboard.writeText(reference); toast.success('Reference copied', { description: reference }) } catch { toast.error('Could not copy', { description: 'Select it and copy by hand.' }) }
  }
  function download(tx: TillTx) {
    const url = URL.createObjectURL(new Blob([receiptText(tx)], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url; a.download = `${tx.reference}.txt`; a.click(); URL.revokeObjectURL(url)
    toast.success('Receipt saved', { description: `${tx.reference}.txt` })
  }

  return (
    <SidePanel open title={t ? formatTzs(t.amount) : 'Transaction'} subtitle={`${reference}${t ? ` · ${TILL_TYPE_LABEL[t.type] ?? t.type}` : ''}`} onClose={onClose}
      footer={t ? <div className="flex gap-2"><Button variant="secondary" onClick={() => void copy()}><Copy aria-hidden="true" size={16} /> Copy reference</Button><Button onClick={() => download(t)}><Download aria-hidden="true" size={16} /> Download receipt</Button></div> : undefined}>
      {detail.loading && !t ? <LoadingState /> : detail.error && !t ? <ErrorState error={detail.error} onRetry={detail.reload} /> : t && (
        <>
          <div className="mb-4"><StatusBadge status={t.status} /></div>
          <DetailRow label="Type">{TILL_TYPE_LABEL[t.type] ?? t.type}</DetailRow>
          <DetailRow label="Customer">{t.customerName}</DetailRow>
          <DetailRow label="Phone">{t.customerPhone}</DetailRow>
          <DetailRow label="Account number">{t.customerAccount}</DetailRow>
          <DetailRow label="Amount">{formatTzs(t.amount)}</DetailRow>
          <DetailRow label="Customer fee">{formatTzs(t.customerFee)}</DetailRow>
          <DetailRow label="You earned">{formatTzs(t.commission)}</DetailRow>
          <DetailRow label="Date">{formatDateTime(t.createdAt)}</DetailRow>
          <p className="mt-4 text-xs text-muted">Keep this reference if a customer asks about this transaction.</p>
        </>
      )}
    </SidePanel>
  )
}
