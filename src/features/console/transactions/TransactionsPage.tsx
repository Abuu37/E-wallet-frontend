import { useMemo, useState } from 'react'
import { api } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { downloadCsv } from '../../../shared/lib/csv'
import { formatDate, formatDateTime, formatTime } from '../../../shared/lib/dates'
import { amountOf, formatTzs, sumAmounts } from '../../../shared/lib/money'
import { Button, EmptyState, ErrorState, LoadingState } from '../../../shared/ui/controls'
import { DateField, ExportButton, FilterBar, PageHeader, SearchField, SelectField, TableCard } from '../../../shared/ui/console'
import { rowProps } from '../../../shared/ui/rowProps'
import { DetailRow, SidePanel, StatusBadge } from '../../../shared/ui/SidePanel'

interface TxItem {
  reference: string
  type: string
  amount: number | string
  fee: number | string | null
  commission: number | string | null
  status: string
  createdAt: string
  fromAccountNumber: string | null
  fromAccountName: string | null
  toAccountNumber: string | null
  toAccountName: string | null
}
interface TxList { transactions: TxItem[]; page: number; size: number; totalElements: number }
interface TxDetail extends TxItem { externalReference: string | null }

const TYPE_LABEL: Record<string, string> = { CASH_IN: 'Cash-in', CASH_OUT: 'Cash-out', SERVICE_FEE: 'Service fee', SERVICE_COMMISSION: 'Agent commission' }
const label = (t: string) => TYPE_LABEL[t] ?? t.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
const FETCH = 200
const PAGE = 15

export default function TransactionsPage() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(0)
  /** Changing a filter returns to the first page. */
  const reset = (set: (v: string) => void) => (v: string) => { set(v); setPage(0) }
  const [openRef, setOpenRef] = useState<string | null>(null)
  const state = useApi<TxList>((signal) => api('/transactions', { query: { size: FETCH }, signal }), [], 30_000)

  const all = useMemo(() => state.data?.transactions ?? [], [state.data])
  const types = useMemo(() => [...new Set(all.map((t) => t.type))].sort(), [all])
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return all.filter((t) =>
      (!type || t.type === type) && (!status || t.status === status) && (!date || t.createdAt.slice(0, 10) === date)
      && (!q || [t.reference, t.fromAccountName, t.toAccountName, t.fromAccountNumber, t.toAccountNumber].some((v) => v?.toLowerCase().includes(q))))
  }, [all, search, type, status, date])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE)
  const completed = rows.filter((t) => t.status === 'COMPLETED')
  const truncated = (state.data?.totalElements ?? 0) > all.length

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Transactions" subtitle="Every cash-in, cash-out, fee and commission on the platform. Click a row for its details." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Summary of the rows shown">
        {[['Transactions', String(rows.length)],
          ['Volume (completed)', formatTzs(sumAmounts(completed.map((t) => t.amount)))],
          ['Fees collected', formatTzs(sumAmounts(completed.map((t) => t.fee)))],
          ['Agent commission', formatTzs(sumAmounts(completed.map((t) => t.commission)))]].map(([k, v]) => (
          <div key={k} className="flex flex-col rounded-2xl border border-line bg-white px-4 py-3"><span className="text-xs font-semibold text-muted">{k}</span><b className="truncate text-lg tabular-nums">{v}</b></div>
        ))}
      </div>

      <FilterBar label="Filter transactions" active={Boolean(search || type || status || date)} onClear={() => { setPage(0); setSearch(''); setType(''); setStatus(''); setDate('') }}>
        <SearchField id="m-q" value={search} onChange={reset(setSearch)} placeholder="Search by ID, name or account number" />
        <SelectField id="m-type" label="Type" value={type} onChange={reset(setType)} options={[['', 'All types'], ...types.map((t): [string, string] => [t, label(t)])]} />
        <SelectField id="m-status" label="Status" value={status} onChange={reset(setStatus)} options={[['', 'All statuses'], ['COMPLETED', 'Completed'], ['PENDING', 'Pending'], ['FAILED', 'Failed']]} />
        <DateField id="m-date" label="Date" value={date} onChange={reset(setDate)} />
      </FilterBar>

      <TableCard title="Transactions" countText={state.data ? `${rows.length} shown${truncated ? ` · latest ${all.length} of ${state.data.totalElements}` : ''}` : undefined}
        action={<ExportButton disabled={rows.length === 0} onClick={() => exportCsv(rows)} />}>
        {state.loading && !state.data ? <LoadingState /> : state.error && !state.data ? <ErrorState error={state.error} onRetry={state.reload} /> : rows.length === 0 ? (
          <EmptyState title="No transactions match these filters." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead><tr className="text-xs text-muted"><th className="px-5 py-2 font-semibold">#</th><th className="font-semibold">Transaction ID</th><th className="font-semibold">Type</th><th className="font-semibold">From</th><th className="font-semibold">To</th>
                  <th className="text-right font-semibold">Amount (TZS)</th><th className="text-right font-semibold">Fee</th><th className="pl-4 font-semibold">Status</th><th className="px-5 font-semibold">Date</th></tr></thead>
                <tbody>
                  {shown.map((t, i) => (
                    <tr key={t.reference} {...rowProps(() => setOpenRef(t.reference), `Open transaction ${t.reference}`)}>
                      <td className="px-5 py-3 text-muted">{page * PAGE + i + 1}</td>
                      <td className="font-mono text-xs">{t.reference}</td>
                      <td>{label(t.type)}</td>
                      <td><b className="block">{t.fromAccountName ?? '—'}</b><span className="text-xs text-muted">{t.fromAccountNumber}</span></td>
                      <td><b className="block">{t.toAccountName ?? '—'}</b><span className="text-xs text-muted">{t.toAccountNumber}</span></td>
                      <td className="text-right font-bold tabular-nums">{formatTzs(t.amount, { symbol: false })}</td>
                      <td className="text-right tabular-nums">{formatTzs(t.fee, { symbol: false })}</td>
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

      {openRef && <DetailPanel reference={openRef} onClose={() => setOpenRef(null)} />}
    </div>
  )
}

function DetailPanel({ reference, onClose }: { reference: string; onClose: () => void }) {
  const detail = useApi<TxDetail>((signal) => api(`/transactions/${encodeURIComponent(reference)}`, { signal }), [reference])
  const t = detail.data
  return (
    <SidePanel open title={t ? `${formatTzs(t.amount)}` : 'Transaction'} subtitle={`${reference}${t ? ` · ${label(t.type)}` : ''}`} onClose={onClose}>
      {detail.loading ? <LoadingState /> : detail.error ? <ErrorState error={detail.error} onRetry={detail.reload} /> : t && (
        <>
          <div className="mb-4"><StatusBadge status={t.status} /></div>
          <DetailRow label="Type">{label(t.type)}</DetailRow>
          <DetailRow label="From">{t.fromAccountName ?? '—'}<br /><span className="text-xs font-normal text-muted">{t.fromAccountNumber}</span></DetailRow>
          <DetailRow label="To">{t.toAccountName ?? '—'}<br /><span className="text-xs font-normal text-muted">{t.toAccountNumber}</span></DetailRow>
          <DetailRow label="Amount">{formatTzs(t.amount)}</DetailRow>
          <DetailRow label="Customer fee">{formatTzs(t.fee)}</DetailRow>
          <DetailRow label="Agent commission">{formatTzs(t.commission)}</DetailRow>
          <DetailRow label="Date">{formatDateTime(t.createdAt)}</DetailRow>
          {t.externalReference && <DetailRow label="External reference">{t.externalReference}</DetailRow>}
          <p className="mt-4 text-xs text-muted">A transaction is a record of a balanced ledger entry. It cannot be edited or reversed here.</p>
        </>
      )}
    </SidePanel>
  )
}

function exportCsv(rows: TxItem[]) {
  downloadCsv('transactions.csv',
    ['Transaction ID', 'Type', 'From', 'From account', 'To', 'To account', 'Amount (TZS)', 'Fee (TZS)', 'Commission (TZS)', 'Status', 'Date'],
    rows.map((t) => [t.reference, label(t.type), t.fromAccountName, t.fromAccountNumber, t.toAccountName, t.toAccountNumber,
      amountOf(t.amount), amountOf(t.fee), amountOf(t.commission), t.status, formatDateTime(t.createdAt)]))
}
