import { useMemo, useState } from 'react'
import { ApiError, api, newIdempotencyKey } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { useSession } from '../../../shared/auth/context'
import { formatDate, formatDateTime } from '../../../shared/lib/dates'
import { formatTzs, normalizeAmount } from '../../../shared/lib/money'
import { Button, EmptyState, ErrorState, Field, LoadingState } from '../../../shared/ui/controls'
import { DetailRow, SidePanel, StatusBadge } from '../../../shared/ui/SidePanel'
import { toast } from '../../../lib/toast'
import type { TreasuryList, TreasuryRequest } from './types'

type Panel = { kind: 'review'; request: TreasuryRequest } | { kind: 'mint' } | { kind: 'commission' } | null

export default function TreasuryPage() {
  const { has } = useSession()
  const canManage = has('FLOAT_MANAGE')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [search, setSearch] = useState('')
  const [date, setDate] = useState('')
  const [panel, setPanel] = useState<Panel>(null)

  const state = useApi<TreasuryList>((signal) => api('/treasury/requests', { query: { status: status || undefined, size: 100 }, signal }), [status], 30_000)

  // The server filters by status only; search, type and date narrow the loaded page in the browser.
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (state.data?.requests ?? []).filter((r) =>
      (!type || r.requestType === type)
      && (!date || r.createdAt.slice(0, 10) === date)
      && (!q || [r.agentName, r.agentNumber, r.requestRef, r.phone].some((v) => v?.toLowerCase().includes(q))))
  }, [state.data, type, date, search])

  const summary = state.data?.summary

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Treasury</h1>
        {canManage && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPanel({ kind: 'commission' })}>Top up commission</Button>
            <Button onClick={() => setPanel({ kind: 'mint' })}>Mint float</Button>
          </div>
        )}
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[['Pending', summary.pending, 'text-amber-700'], ['Approved', summary.approved, 'text-teal-700'], ['Rejected', summary.rejected, 'text-rose-700']].map(([label, s, tone]) => {
            const m = s as { count: number; balance: number | string }
            return (
              <div key={label as string} className="rounded-2xl border border-line bg-white p-5">
                <span className="text-[13px] font-semibold text-muted">{label as string}</span>
                <p className={`text-xl font-extrabold tabular-nums ${tone}`}>{formatTzs(m.balance)}</p>
                <span className="text-xs text-muted">{m.count} requests</span>
              </div>
            )
          })}
        </div>
      )}

      <div role="search" aria-label="Filter requests" className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4">
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-semibold">Search
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Agent, code, reference" className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-normal" /></label>
        <label className="flex flex-col gap-1 text-xs font-semibold">Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-2 text-sm font-normal">
            <option value="">All</option><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option></select></label>
        <label className="flex flex-col gap-1 text-xs font-semibold">Type
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-2 text-sm font-normal">
            <option value="">All</option><option value="TOPUP">Top-up</option><option value="WITHDRAWAL">Withdrawal</option></select></label>
        <label className="flex flex-col gap-1 text-xs font-semibold">Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-2 text-sm font-normal" /></label>
        {(search || status || type || date) && <Button variant="ghost" onClick={() => { setSearch(''); setStatus(''); setType(''); setDate('') }}>Clear</Button>}
      </div>

      <section aria-label="Float requests" className="rounded-2xl border border-line bg-white">
        {state.loading && !state.data ? <LoadingState /> : state.error && !state.data ? <ErrorState error={state.error} onRetry={state.reload} /> : rows.length === 0 ? (
          <EmptyState title="No float requests match" description="Requests from agents appear here for review." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead><tr className="text-xs text-muted"><th className="p-3 font-semibold">Request</th><th className="font-semibold">Agent</th><th className="font-semibold">Type</th><th className="text-right font-semibold">Amount (TZS)</th><th className="pl-4 font-semibold">Status</th><th className="font-semibold">Requested</th><th className="p-3"><span className="sr-only">Review</span></th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.requestId} className="border-t border-line hover:bg-surface">
                    <td className="p-3 font-mono text-xs">{r.requestRef}</td>
                    <td><b className="block">{r.agentName}</b><span className="text-xs text-muted">{r.agentNumber}</span></td>
                    <td>{r.requestType}</td>
                    <td className="text-right font-bold tabular-nums">{formatTzs(r.amount, { symbol: false })}</td>
                    <td className="pl-4"><StatusBadge status={r.status} /></td>
                    <td className="text-xs">{formatDate(r.createdAt)}</td>
                    <td className="p-3 text-right"><Button variant="secondary" className="h-9 px-4 text-sm" onClick={() => setPanel({ kind: 'review', request: r })}>Review</Button></td>
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
        <MoneyPanel kind={panel.kind} onClose={() => setPanel(null)} onDone={() => { setPanel(null); state.reload() }} />
      )}
    </div>
  )
}

function ReviewPanel({ request: r, canManage, onClose, onDone }: { request: TreasuryRequest; canManage: boolean; onClose: () => void; onDone: () => void }) {
  const [rejecting, setRejecting] = useState(false)
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pending = r.status === 'PENDING'

  async function decide(kind: 'approve' | 'reject') {
    setBusy(true); setError(null)
    try {
      await api(`/treasury/requests/${r.requestId}/${kind}`, { method: 'POST', body: kind === 'reject' ? { reason: note.trim() } : undefined, idempotencyKey: newIdempotencyKey() })
      toast.success(kind === 'approve' ? 'Request approved' : 'Request rejected')
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not complete the action.')
    } finally { setBusy(false) }
  }

  return (
    <SidePanel open title={`${formatTzs(r.amount)}`} subtitle={`${r.requestRef} · ${r.requestType}`} onClose={onClose}
      footer={pending && canManage ? (
        rejecting ? (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm font-semibold">Reason for rejecting (required)
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={255} className="rounded-xl border border-slate-300 p-3 text-sm font-normal" /></label>
            {error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
            <div className="flex gap-2"><Button variant="secondary" onClick={() => setRejecting(false)} disabled={busy}>Back</Button>
              <Button variant="danger" block loading={busy} disabled={note.trim().length < 3} onClick={() => void decide('reject')}>Reject request</Button></div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
            <div className="flex gap-2"><Button variant="secondary" onClick={() => setRejecting(true)} disabled={busy}>Reject</Button>
              <Button block loading={busy} onClick={() => void decide('approve')}>Approve and move float</Button></div>
          </div>
        )
      ) : undefined}>
      <div className="mb-4"><StatusBadge status={r.status} /></div>
      <DetailRow label="Agent">{r.agentName}</DetailRow>
      <DetailRow label="Agent code">{r.agentNumber}</DetailRow>
      <DetailRow label="Location">{[r.district, r.region].filter(Boolean).join(', ') || '—'}</DetailRow>
      <DetailRow label="Float account">{r.accountNumber}</DetailRow>
      <DetailRow label="Requested">{formatDateTime(r.createdAt)}</DetailRow>
      <DetailRow label="Reason">{r.reason || '—'}</DetailRow>
      {r.externalReference && <DetailRow label="External reference">{r.externalReference}</DetailRow>}
      {r.status !== 'PENDING' && (<>
        <DetailRow label="Decided by">{r.decidedByUserName ?? '—'}</DetailRow>
        <DetailRow label="Decided">{formatDateTime(r.decidedAt)}</DetailRow>
        <DetailRow label="Decision note">{r.decisionNote || '—'}</DetailRow>
      </>)}
      {pending && !canManage && <p className="mt-4 text-sm text-muted">You can view this request but cannot decide it.</p>}
    </SidePanel>
  )
}

function MoneyPanel({ kind, onClose, onDone }: { kind: 'mint' | 'commission'; onClose: () => void; onDone: () => void }) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attemptKey] = useState(newIdempotencyKey) // one key per opened form; a double tap re-sends the same key
  const clean = normalizeAmount(amount)
  const valid = clean !== '' && clean !== '0.00' && !clean.startsWith('-') && description.trim().length >= 3
  const title = kind === 'mint' ? 'Mint float' : 'Top up commission pool'

  async function submit() {
    setBusy(true); setError(null)
    try {
      await api(kind === 'mint' ? '/treasury/mint' : '/treasury/commission/topup', {
        method: 'POST', body: { amount: clean, description: description.trim() }, idempotencyKey: attemptKey,
      })
      toast.success(`${title}: done`)
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not complete the action.')
    } finally { setBusy(false) }
  }

  return (
    <SidePanel open title={title} onClose={onClose}
      footer={<div className="flex flex-col gap-3">{error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
        <Button block loading={busy} disabled={!valid} onClick={() => void submit()}>{kind === 'mint' ? 'Mint' : 'Top up'} {valid ? formatTzs(clean) : ''}</Button></div>}>
      <div className="flex flex-col gap-4">
        <Field label="Amount (TZS)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} hint="Whole shillings, e.g. 5,000,000" />
        <Field label="Description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={255} />
        <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">Sandbox · demo money. This posts a balanced ledger entry and is recorded against your account.</p>
      </div>
    </SidePanel>
  )
}
