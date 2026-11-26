import { ArrowDownLeft, ArrowUpRight, Copy, Download, Search, Share2 } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { formatDate, formatDateTime, formatTime } from '../../shared/lib/dates'
import { formatTzs } from '../../shared/lib/money'
import { Button, EmptyState, ErrorState, LoadingState } from '../../shared/ui/controls'
import { Modal } from '../../shared/ui/Modal'
import { DetailRow, StatusBadge } from '../../shared/ui/SidePanel'
import { toast } from '../../shared/ui/toast'
import { typeLabel, type MyTransactionList, type Receipt } from './types'

const SIZE = 15
const TYPES: [string, string][] = [['', 'All types'], ['TRANSFER', 'Money sent and received'], ['CASH_IN', 'Cash-in at agent'], ['CASH_OUT', 'Withdrawals']]

/** Transactions (W23) with filters, search and paging, and the receipt (W24). */
export default function TransactionsPage() {
  const [params, setParams] = useSearchParams()
  const [type, setType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const open = params.get('ref')

  const list = useApi<MyTransactionList>((signal) => api('/transactions/me', { query: { type, from, to, q: q.trim(), page, size: SIZE }, signal }), [type, from, to, q, page])
  const receipt = useApi<Receipt | null>((signal) => (open ? api(`/transactions/${open}`, { signal }) : Promise.resolve(null)), [open])

  const filtering = Boolean(type || from || to || q)
  const total = list.data?.totalElements ?? 0
  const pages = Math.max(1, Math.ceil(total / SIZE))
  const setFilter = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(0) }
  const r = receipt.data
  const incoming = r?.direction === 'IN'

  async function copy(text: string) {
    try { await navigator.clipboard.writeText(text); toast.success('Reference copied', { description: text }) } catch { toast.error('Could not copy', { description: 'Select it and copy by hand.' }) }
  }

  function receiptLines(rc: Receipt): string[] {
    return [
      'WalletPesa receipt', '', `Reference: ${rc.reference}`, `Date: ${formatDateTime(rc.createdAt)}`, `Type: ${typeLabel({ type: rc.type, direction: rc.direction ?? 'OUT' })}`,
      `${rc.direction === 'IN' ? 'From' : 'To'}: ${rc.counterpartyName ?? ''} ${rc.counterpartyPhone ?? ''}`.trim(),
      `Amount: TZS ${formatTzs(rc.amount, { symbol: false })}`, `Fee: TZS ${formatTzs(rc.fee, { symbol: false })}`, `Status: ${rc.status}`,
      ...(rc.matchCode ? [`Withdrawal code: ${rc.matchCode}`] : []),
    ]
  }

  /** The phone's share sheet when there is one, otherwise the receipt text is copied. */
  async function share(rc: Receipt) {
    const text = receiptLines(rc).join('\n')
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title: 'WalletPesa receipt', text }) } catch { /* the person closed the share sheet */ }
      return
    }
    try { await navigator.clipboard.writeText(text); toast.success('Receipt copied', { description: 'Paste it into a message to share it.' }) } catch { toast.error('Could not share', { description: 'Use Download instead.' }) }
  }

  function download(rc: Receipt) {
    const lines = receiptLines(rc)
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url; a.download = `${rc.reference}.txt`; a.click(); URL.revokeObjectURL(url)
    toast.success('Receipt saved', { description: `${rc.reference}.txt` })
  }

  return (
    <div className="flex flex-col gap-5 tabular-nums">
      <div><h1 className="text-[26px] font-extrabold tracking-tight">Transactions</h1><p className="text-sm text-muted">{total} {total === 1 ? 'transaction' : 'transactions'}</p></div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1.4fr_1fr_1fr_auto]">
        <label className="relative"><span className="sr-only">Search</span><Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setFilter(setQ)(e.target.value)} placeholder="Search reference or name" className="h-11 w-full rounded-xl border border-slate-300 pl-9 pr-3 text-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" /></label>
        <label><span className="sr-only">Type</span><select value={type} onChange={(e) => setFilter(setType)(e.target.value)} className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold">{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label><span className="sr-only">From date</span><input type="date" value={from} max={to || undefined} onChange={(e) => setFilter(setFrom)(e.target.value)} className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" /></label>
        <label><span className="sr-only">To date</span><input type="date" value={to} min={from || undefined} onChange={(e) => setFilter(setTo)(e.target.value)} className="h-11 w-full rounded-xl border border-slate-300 px-3 text-sm" /></label>
        <Button variant="ghost" disabled={!filtering} onClick={() => { setType(''); setFrom(''); setTo(''); setQ(''); setPage(0) }}>Clear</Button>
      </div>

      <section className="rounded-[22px] border border-line bg-white p-2 sm:p-4">
        {list.loading && !list.data ? <LoadingState /> : list.error && !list.data ? <ErrorState error={list.error} onRetry={list.reload} />
          : (list.data?.items.length ?? 0) === 0 ? <EmptyState title={filtering ? 'Nothing matches these filters' : 'No transactions yet'} description={filtering ? 'Try other dates or clear the filters.' : 'Cash in at an agent or send money to get started.'} />
            : (
              <ul>
                {list.data!.items.map((t) => (
                  <li key={t.referenceNo} className="border-t border-slate-100 first:border-0">
                    <button type="button" onClick={() => setParams({ ref: t.referenceNo })} className="flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left hover:bg-surface focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.direction === 'IN' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-ink'}`}>
                        {t.direction === 'IN' ? <ArrowDownLeft aria-hidden="true" size={18} /> : <ArrowUpRight aria-hidden="true" size={18} />}</span>
                      <span className="flex min-w-0 flex-1 flex-col"><b className="truncate text-[15px]">{typeLabel(t)}{t.counterpartyName ? ` · ${t.counterpartyName}` : ''}</b>
                        <span className="text-[13px] text-slate-600">{formatDate(t.createdAt)} {formatTime(t.createdAt)} · <span className="font-mono text-xs">{t.referenceNo}</span></span></span>
                      <span className="flex flex-col items-end"><b className={`text-base ${t.direction === 'IN' ? 'text-teal-700' : 'text-ink'}`}>{t.direction === 'IN' ? '+' : '−'}{formatTzs(t.amount, { symbol: false })}</b><StatusBadge status={t.status} label={t.status.charAt(0) + t.status.slice(1).toLowerCase()} /></span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
        {total > SIZE && (
          <div className="flex items-center justify-between border-t border-slate-100 px-3 pt-3 text-sm">
            <span className="text-muted">Page {page + 1} of {pages}</span>
            <div className="flex gap-2"><Button variant="secondary" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button variant="secondary" disabled={page + 1 >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button></div>
          </div>
        )}
      </section>

      <Modal open={Boolean(open)} radius="small" width={480} title={r ? `${incoming ? '+' : '−'}${formatTzs(r.amount, { symbol: false })} TZS` : 'Receipt'} subtitle={r?.reference} onClose={() => setParams({})}
        footer={r ? <>
          <Button variant="secondary" onClick={() => void copy(r.reference)}><Copy aria-hidden="true" size={16} /> Copy reference</Button>
          <Button variant="secondary" onClick={() => void share(r)}><Share2 aria-hidden="true" size={16} /> Share</Button>
          <Button onClick={() => download(r)}><Download aria-hidden="true" size={16} /> Download</Button>
        </> : undefined}>
        {receipt.loading && !r ? <LoadingState /> : receipt.error && !r ? <ErrorState error={receipt.error} onRetry={receipt.reload} /> : r && (
          <div className="pb-2">
            <DetailRow label="Type">{typeLabel({ type: r.type, direction: r.direction ?? 'OUT' })}</DetailRow>
            <DetailRow label={incoming ? 'From' : 'To'}>{r.counterpartyName}{r.counterpartyPhone ? ` · ${r.counterpartyPhone}` : ''}</DetailRow>
            <DetailRow label="Amount">{formatTzs(r.amount, { symbol: false })} TZS</DetailRow>
            <DetailRow label="Fee">{formatTzs(r.fee, { symbol: false })} TZS</DetailRow>
            <DetailRow label="Status"><StatusBadge status={r.status} label={r.status.charAt(0) + r.status.slice(1).toLowerCase()} /></DetailRow>
            <DetailRow label="Date">{formatDateTime(r.createdAt)}</DetailRow>
            {r.matchCode && <DetailRow label="Withdrawal code">{r.matchCode}</DetailRow>}
          </div>
        )}
      </Modal>
    </div>
  )
}
