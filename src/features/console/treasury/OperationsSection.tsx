import { useRef, useState } from 'react'
import { ApiError, api, newIdempotencyKey } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { formatDateTime } from '../../../shared/lib/dates'
import { formatTzs, normalizeAmount } from '../../../shared/lib/money'
import { Button, EmptyState, ErrorState, Field, LoadingState } from '../../../shared/ui/controls'
import { Modal } from '../../../shared/ui/Modal'
import { SidePanel, StatusBadge } from '../../../shared/ui/SidePanel'
import { toast } from '../../../shared/ui/toast'

type OpType = 'SWEEP' | 'REVERSAL' | 'ADJUSTMENT_PAY_IN' | 'ADJUSTMENT_CHARGE'

interface Operation {
  id: string; opRef: string; type: OpType; amount: number | string; reason: string; targetReference: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; requestedBy: string; decidedBy: string | null; decisionNote: string | null
  resultReference: string | null; createdAt: string; decidedAt: string | null; askedByYou: boolean
}

const LABEL: Record<OpType, string> = {
  SWEEP: 'Sweep revenue to the company bank',
  REVERSAL: 'Reverse a wrong transfer',
  ADJUSTMENT_PAY_IN: 'Escrow correction: company paid in',
  ADJUSTMENT_CHARGE: 'Escrow correction: bank charge',
}
const HELP: Record<OpType, string> = {
  SWEEP: 'Revenue and escrow both go down, and the money is paid to the company bank.',
  REVERSAL: 'A new opposite entry takes the amount back from the recipient and returns the fee. Nothing is edited or deleted.',
  ADJUSTMENT_PAY_IN: 'The company paid its own money into the escrow account: escrow and revenue both go up.',
  ADJUSTMENT_CHARGE: 'The bank took a charge from the escrow account: escrow and revenue both go down.',
}

/** Moves that need two different staff members: sweeps, reversals and escrow corrections (S02b). */
export function OperationsSection() {
  const ops = useApi<Operation[]>((signal) => api('/treasury/operations', { query: { size: 50 }, signal }), [], 30_000)
  const [creating, setCreating] = useState(false)
  const [rejecting, setRejecting] = useState<Operation | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const keys = useRef<Record<string, string>>({})

  async function approve(op: Operation) {
    setBusyId(op.id)
    keys.current[op.id] ??= newIdempotencyKey()
    try {
      await api(`/treasury/operations/${op.id}/approve`, { method: 'POST', idempotencyKey: keys.current[op.id] })
      toast.success('Approved', { description: `${op.opRef} moved ${formatTzs(op.amount, { symbol: false })} TZS.` })
      ops.reload()
    } catch (err) {
      delete keys.current[op.id]
      toast.error('Could not approve', { description: err instanceof ApiError ? err.message : 'Please try again.' })
    } finally { setBusyId(null) }
  }

  const rows = ops.data ?? []
  return (
    <section aria-label="Two-person approvals" className="rounded-2xl border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-3">
        <div className="max-w-2xl"><h2 className="text-base font-extrabold">Two-person approvals</h2>
          <p className="text-sm text-muted">Sweeps, reversals and escrow corrections need two different staff members. One asks, another approves, and only then does money move.</p></div>
        <Button onClick={() => setCreating(true)}>New request</Button>
      </div>
      {ops.loading && !ops.data ? <LoadingState /> : ops.error && !ops.data ? <ErrorState error={ops.error} onRetry={ops.reload} /> : rows.length === 0 ? (
        <EmptyState title="Nothing waiting" description="Requests for a sweep, a reversal or an escrow correction show here." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead><tr className="text-xs text-muted"><th className="px-5 py-2 font-semibold">Reference</th><th className="font-semibold">What</th><th className="text-right font-semibold">Amount (TZS)</th><th className="pl-4 font-semibold">Asked by</th><th className="font-semibold">Status</th><th className="px-5 text-right font-semibold">Action</th></tr></thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-t border-line align-top">
                  <td className="px-5 py-3 font-mono text-xs">{o.opRef}<span className="block text-muted">{formatDateTime(o.createdAt)}</span></td>
                  <td><b className="block">{LABEL[o.type]}</b><span className="text-xs text-muted">{o.reason}{o.targetReference ? ` · ${o.targetReference}` : ''}</span>
                    {o.status === 'REJECTED' && o.decisionNote && <span className="block text-xs text-rose-700">Rejected: {o.decisionNote}</span>}
                    {o.status === 'APPROVED' && o.resultReference && <span className="block text-xs text-teal-700">Done · {o.resultReference} · approved by {o.decidedBy}</span>}</td>
                  <td className="text-right font-bold tabular-nums">{formatTzs(o.amount, { symbol: false })}</td>
                  <td className="pl-4">{o.requestedBy}{o.askedByYou && <span className="block text-xs text-muted">you</span>}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="px-5 text-right">
                    {o.status === 'PENDING' && (o.askedByYou ? (
                      <span className="flex flex-col items-end gap-1"><span className="text-xs text-muted">Waiting for a second staff member</span>
                        <Button variant="ghost" className="h-8 px-3 text-xs" onClick={() => setRejecting(o)}>Withdraw</Button></span>
                    ) : (
                      <span className="inline-flex gap-2"><Button className="h-9 px-4 text-sm" loading={busyId === o.id} onClick={() => void approve(o)}>Approve</Button>
                        <Button variant="danger" className="h-9 px-4 text-sm" disabled={busyId === o.id} onClick={() => setRejecting(o)}>Reject</Button></span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {creating && <NewOperation onClose={() => setCreating(false)} onDone={() => { setCreating(false); ops.reload() }} />}
      {rejecting && <RejectDialog op={rejecting} onClose={() => setRejecting(null)} onDone={() => { setRejecting(null); ops.reload() }} />}
    </section>
  )
}

function NewOperation({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [type, setType] = useState<OpType>('SWEEP')
  const [amount, setAmount] = useState('')
  const [target, setTarget] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [key] = useState(newIdempotencyKey)
  const clean = normalizeAmount(amount)
  const reversal = type === 'REVERSAL'
  const valid = reason.trim().length >= 3 && (reversal ? target.trim().length >= 6 : clean !== '' && Number(clean) > 0)

  async function submit() {
    setBusy(true); setError(null)
    try {
      await api('/treasury/operations', { method: 'POST', idempotencyKey: key, body: { type, amount: reversal ? undefined : clean, reason: reason.trim(), targetReference: reversal ? target.trim() : undefined } })
      toast.success('Request sent', { description: 'A second staff member must approve it before any money moves.' })
      onDone()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not send the request.'
      setError(msg); toast.error('Request not sent', { description: msg })
    } finally { setBusy(false) }
  }

  return (
    <SidePanel open title="New request" subtitle="Needs a second staff member" onClose={onClose}
      footer={<div className="flex flex-col gap-3">{error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
        <Button block loading={busy} disabled={!valid} onClick={() => void submit()}>Send for approval</Button></div>}>
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">What do you need?
          <select value={type} onChange={(e) => setType(e.target.value as OpType)} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-normal">
            {(Object.keys(LABEL) as OpType[]).map((t) => <option key={t} value={t}>{LABEL[t]}</option>)}</select></label>
        <p className="rounded-xl bg-surface p-3 text-sm text-slate-600">{HELP[type]}</p>
        {reversal
          ? <Field label="Transfer reference" value={target} onChange={(e) => setTarget(e.target.value)} hint="e.g. TRF-20261126-AB12CD34. The amount is taken from the transfer." />
          : <Field label="Amount (TZS)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} hint="Whole shillings, e.g. 500,000" />}
        <Field label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} hint="The second person reads this before approving." />
      </div>
    </SidePanel>
  )
}

function RejectDialog({ op, onClose, onDone }: { op: Operation; onClose: () => void; onDone: () => void }) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const own = op.askedByYou

  async function submit() {
    setBusy(true)
    try {
      await api(`/treasury/operations/${op.id}/reject`, { method: 'POST', body: { reason: reason.trim() } })
      toast.warning(own ? 'Request withdrawn' : 'Request rejected', { description: 'No money moved.' })
      onDone()
    } catch (err) {
      toast.error('Could not reject', { description: err instanceof ApiError ? err.message : 'Please try again.' })
    } finally { setBusy(false) }
  }

  return (
    <Modal open radius="small" width={440} title={own ? 'Withdraw this request?' : 'Reject this request?'} subtitle={op.opRef} onClose={onClose}
      footer={<><Button variant="secondary" onClick={onClose}>Keep it</Button><Button variant="danger" loading={busy} disabled={reason.trim().length < 3} onClick={() => void submit()}>{own ? 'Withdraw' : 'Reject'}</Button></>}>
      <label className="flex flex-col gap-1.5 pb-2 text-sm font-semibold">Why?
        <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} className="rounded-xl border border-slate-300 p-3 text-sm font-normal" /></label>
    </Modal>
  )
}
