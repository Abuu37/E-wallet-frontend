import { useMemo, useState } from 'react'
import { ApiError, api, newIdempotencyKey } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { useSession } from '../../../shared/auth/context'
import { formatDate, formatDateTime } from '../../../shared/lib/dates'
import { formatTzs, normalizeAmount } from '../../../shared/lib/money'
import { toast } from '../../../shared/ui/toast'
import { Button, EmptyState, ErrorState, Field, LoadingState } from '../../../shared/ui/controls'
import { DetailRow, SidePanel, StatusBadge } from '../../../shared/ui/SidePanel'
import { needsSecondStaff, TYPE_LABEL, type TreasuryList, type TreasuryRequest } from './types'

type Panel = { kind: 'review'; request: TreasuryRequest } | { kind: 'mint' } | { kind: 'commission' } | null

const FILTER_TYPES = [['', 'All types'], ['MINT', 'Mint'], ['TOPUP', 'Float top-up'], ['WITHDRAWAL', 'Float withdrawal'], ['COMMISSION_TOPUP', 'Commission top-up']]

export default function TreasuryPage() {
  const { has } = useSession()
  const canManage = has('FLOAT_MANAGE')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [search, setSearch] = useState('')
  const [date, setDate] = useState('')
  const [panel, setPanel] = useState<Panel>(null)

  const state = useApi<TreasuryList>((signal) => api('/treasury/requests', { query: { status: status || undefined, size: 100 }, signal }), [status], 30_000)

  // The server filters by status; search, type and date narrow the loaded page in the browser.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (state.data?.requests ?? []).filter((r) =>
      (!type || r.requestType === type)
      && (!date || r.createdAt.slice(0, 10) === date)
      && (!q || [r.agentName, r.agentNumber, r.requestRef, r.accountNumber, r.requestedByUserName].some((v) => v?.toLowerCase().includes(q))))
  }, [state.data, type, date, search])

  const summary = state.data?.summary
  const filtering = Boolean(search || status || type || date)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-extrabold tracking-tight">Treasury</h1>
          <p className="text-sm text-muted">Mint and commission top-ups need two people: you cannot approve your own. Agent float requests are decided by one staff member.</p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPanel({ kind: 'commission' })}>Request commission top-up</Button>
            <Button onClick={() => setPanel({ kind: 'mint' })}>Request mint</Button>
          </div>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([['Pending', summary.pending, 'text-amber-700'], ['Approved', summary.approved, 'text-teal-700'], ['Rejected', summary.rejected, 'text-rose-700']] as const).map(([label, s, tone]) => (
            <div key={label} className="rounded-2xl border border-line bg-white p-5">
              <span className="text-[13px] font-semibold text-muted">{label}</span>
              <p className={`text-xl font-extrabold tabular-nums ${tone}`}>{formatTzs(s.balance)}</p>
              <span className="text-xs text-muted">{s.count} requests</span>
            </div>
          ))}
        </div>
      )}

      <div role="search" aria-label="Filter requests" className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4">
        <label className="flex min-w-56 flex-1 flex-col gap-1 text-xs font-semibold">Search
          <input id="f-q" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by reference, agent or account" className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-normal" /></label>
        <label className="flex flex-col gap-1 text-xs font-semibold">Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-2 text-sm font-normal">
            <option value="">All statuses</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select></label>
        <label className="flex flex-col gap-1 text-xs font-semibold">Type
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-2 text-sm font-normal">
            {FILTER_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="flex flex-col gap-1 text-xs font-semibold">Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-2 text-sm font-normal" /></label>
        {filtering && <Button variant="ghost" onClick={() => { setSearch(''); setStatus(''); setType(''); setDate('') }}>Clear</Button>}
      </div>

      <section aria-label="Treasury requests" className="rounded-2xl border border-line bg-white">
        <div className="flex items-baseline justify-between p-5 pb-2">
          <h2 className="text-base font-extrabold">Treasury requests</h2>
          <span className="text-xs text-muted">{rows.length} shown</span>
        </div>
        {state.loading && !state.data ? <LoadingState /> : state.error && !state.data ? <ErrorState error={state.error} onRetry={state.reload} /> : rows.length === 0 ? (
          <EmptyState title="No requests match these filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead><tr className="text-xs text-muted">
                <th className="px-5 py-2 font-semibold">#</th><th className="font-semibold">Reference</th><th className="font-semibold">Type</th><th className="font-semibold">Account</th>
                <th className="text-right font-semibold">Amount (TZS)</th><th className="pl-4 font-semibold">Requested</th><th className="font-semibold">Status</th><th className="px-5 text-right font-semibold">Action</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.requestId} className="border-t border-line hover:bg-surface">
                    <td className="px-5 py-3 text-muted">{i + 1}</td>
                    <td className="font-mono text-xs">{r.requestRef}</td>
                    <td><span className="inline-flex items-center gap-2"><span aria-hidden="true" className={`h-2 w-2 rounded-full ${needsSecondStaff(r.requestType) ? 'bg-brand' : 'bg-accent'}`} />{TYPE_LABEL[r.requestType]}</span></td>
                    <td>{r.agentName ? <><b className="block">{r.agentName}</b><span className="text-xs text-muted">{r.accountNumber}</span></> : <span className="text-muted">Company ledger</span>}</td>
                    <td className="text-right font-bold tabular-nums">{formatTzs(r.amount, { symbol: false })}</td>
                    <td className="pl-4 text-xs">{formatDate(r.createdAt)}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td className="px-5 text-right"><Button variant="secondary" className="h-9 px-4 text-sm" onClick={() => setPanel({ kind: 'review', request: r })}>{r.status === 'PENDING' && canManage ? 'Review' : 'View'}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {panel?.kind === 'review' && (
        <ReviewPanel request={panel.request} canManage={canManage} onClose={() => setPanel(null)} onDone={() => { setPanel(null); state.reload() }} />
      )}
      {(panel?.kind === 'mint' || panel?.kind === 'commission') && (
        <RaisePanel kind={panel.kind} onClose={() => setPanel(null)} onDone={() => { setPanel(null); state.reload() }} />
      )}
    </div>
  )
}

function ReviewPanel({ request: r, canManage, onClose, onDone }: { request: TreasuryRequest; canManage: boolean; onClose: () => void; onDone: () => void }) {
  const { session } = useSession()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pending = r.status === 'PENDING'
  // Maker-checker: the person who raised a mint or commission request cannot decide it.
  const own = needsSecondStaff(r.requestType) && r.requestedByUserId !== null && r.requestedByUserId === session?.userId
  const canDecide = pending && canManage && !own

  async function decide(kind: 'approve' | 'reject') {
    if (kind === 'reject' && note.trim().length < 3) { setError('A decision note is required to reject.'); return }
    setBusy(true); setError(null)
    try {
      await api(`/treasury/requests/${r.requestId}/${kind}`, { method: 'POST', body: kind === 'reject' ? { reason: note.trim() } : undefined, idempotencyKey: newIdempotencyKey() })
      toast.success(kind === 'approve' ? 'Request approved' : 'Request rejected')
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not complete the action.')
    } finally { setBusy(false) }
  }

  const facts: [string, string][] = [
    ['Type', TYPE_LABEL[r.requestType]],
    ['Requested by', r.requestedByUserName || (r.agentName ?? '—')],
    ['Requested', formatDateTime(r.createdAt)],
    ...(r.agentName ? [['Agent code', r.agentNumber ?? '—'], ['Location', [r.district, r.region].filter(Boolean).join(', ') || '—'], ['Float account', r.accountNumber ?? '—']] as [string, string][] : []),
    ['Reason', r.reason || '—'],
    ...(r.externalReference ? [['External reference', r.externalReference]] as [string, string][] : []),
  ]

  return (
    <SidePanel open title={`${formatTzs(r.amount)}`} subtitle={`${r.requestRef} · ${TYPE_LABEL[r.requestType]}`} onClose={onClose}
      footer={canDecide ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">Decision note <span className="font-normal text-muted">(required to reject)</span>
            <textarea id="tr-note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={255} placeholder="e.g. Slip matched on CRDB statement, 09:41"
              className="rounded-xl border border-slate-300 p-3 text-sm font-normal" /></label>
          {error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
          <div className="flex gap-2">
            <Button block loading={busy} onClick={() => void decide('approve')}>Approve {formatTzs(r.amount, { symbol: false })}</Button>
            <Button variant="danger" disabled={busy} onClick={() => void decide('reject')}>Reject</Button>
          </div>
        </div>
      ) : undefined}>
      <div className="mb-4"><StatusBadge status={r.status} /></div>
      <h3 className="mb-1 text-sm font-extrabold">Request details</h3>
      {facts.map(([k, v]) => <DetailRow key={k} label={k}>{v}</DetailRow>)}

      <h3 className="mb-2 mt-5 text-sm font-extrabold">History</h3>
      <ol className="flex flex-col gap-3 text-sm">
        <li className="flex gap-3"><span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" /><span><b>Requested</b>{r.requestedByUserName ? ` by ${r.requestedByUserName}` : ''}<br /><span className="text-xs text-muted">{formatDateTime(r.createdAt)}</span></span></li>
        {!pending && <li className="flex gap-3"><span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${r.status === 'APPROVED' ? 'bg-teal-500' : 'bg-rose-500'}`} /><span><b>{r.status === 'APPROVED' ? 'Approved' : 'Rejected'}</b>{r.decidedByUserName ? ` by ${r.decidedByUserName}` : ''}<br /><span className="text-xs text-muted">{formatDateTime(r.decidedAt)}</span>{r.decisionNote && <><br /><span>{r.decisionNote}</span></>}</span></li>}
      </ol>

      {own && pending && (
        <div role="status" className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><b>You requested this.</b> Another staff member must approve or reject it.</div>
      )}
      {pending && !canManage && <p className="mt-4 text-sm text-muted">You can view this request but cannot decide it.</p>}
    </SidePanel>
  )
}

function RaisePanel({ kind, onClose, onDone }: { kind: 'mint' | 'commission'; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attemptKey] = useState(newIdempotencyKey) // one key per opened form; a double tap re-sends the same key
  const clean = normalizeAmount(amount)
  const valid = clean !== '' && clean !== '0.00' && !clean.startsWith('-') && description.trim().length >= 3
  const title = kind === 'mint' ? 'Request mint' : 'Request commission top-up'

  async function submit() {
    setBusy(true); setError(null)
    try {
      await api(kind === 'mint' ? '/treasury/mint' : '/treasury/commission/topup', { method: 'POST', body: { amount: clean, description: description.trim() }, idempotencyKey: attemptKey })
      toast.success('Request submitted', { description: 'Another staff member must approve it before any money moves.' })
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit the request.')
    } finally { setBusy(false) }
  }

  return (
    <SidePanel open title={title} subtitle="Needs a second staff member" onClose={onClose}
      footer={<div className="flex flex-col gap-3">{error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
        <Button block loading={busy} disabled={!valid} onClick={() => void submit()}>Submit request {valid ? `for ${formatTzs(clean)}` : ''}</Button></div>}>
      <div className="flex flex-col gap-4">
        <Field label="Amount (TZS)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} hint="Whole shillings, e.g. 5,000,000" />
        <Field label="Description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={255} hint={kind === 'mint' ? 'e.g. Bank deposit slip 118' : 'Why the commission pool needs funding'} />
        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Sandbox · demo money. No money moves until a different staff member approves this request.</p>
      </div>
    </SidePanel>
  )
}
