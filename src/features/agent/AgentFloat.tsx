import { useRef, useState, type FormEvent } from 'react'
import { api, newIdempotencyKey } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { formatDate, formatDateTime } from '../../shared/lib/dates'
import { formatTzs, normalizeAmount } from '../../shared/lib/money'
import { reportError, toast } from '../../shared/ui/toast'
import { Button, ErrorState, LoadingState } from '../../shared/ui/controls'
import type { AgentOverview } from './AgentHome'

type RequestType = 'TOPUP' | 'WITHDRAWAL'
interface FloatRequest {
  requestId: string
  requestRef: string
  requestType: RequestType | string
  amount: number | string
  reason: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  decisionNote: string | null
  decidedAt: string | null
  createdAt: string
  externalReference: string | null
}
interface FloatList { requests: FloatRequest[] }

const TYPE_LABEL: Record<string, string> = { TOPUP: 'top-up', WITHDRAWAL: 'withdrawal' }
const FIELD = 'rounded-[14px] border border-slate-300 px-4 text-ink focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200'

function Step({ title, sub, state }: { title: string; sub: string; state: 'done' | 'now' | 'todo' }) {
  const dot = state === 'done' ? 'bg-accent' : state === 'now' ? 'bg-brand' : 'border-2 border-slate-600'
  return (
    <li className="flex gap-3.5">
      <span className="flex flex-col items-center"><span aria-hidden="true" className={`mt-[3px] h-3.5 w-3.5 rounded-full ${dot}`} /><span aria-hidden="true" className={`min-h-[22px] w-0.5 flex-1 ${state === 'done' ? 'bg-accent' : 'bg-slate-700'}`} /></span>
      <span className="flex flex-col pb-3"><span className={`text-[15px] font-bold ${state === 'todo' ? 'text-slate-400' : 'text-white'}`}>{title}</span><span className="text-[13px] text-slate-400">{sub}</span></span>
    </li>
  )
}

export default function AgentFloat() {
  const overview = useApi<AgentOverview>((signal) => api('/agent/dashboard/overview', { signal }), [])
  const requests = useApi<FloatList>((signal) => api('/treasury/requests', { query: { size: 50 }, signal }), [], 30_000)

  const [type, setType] = useState<RequestType>('TOPUP')
  const [amount, setAmount] = useState('')
  const [slip, setSlip] = useState('')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const attemptKey = useRef(newIdempotencyKey())

  if ((overview.loading && !overview.data) || (requests.loading && !requests.data)) return <LoadingState />
  if (overview.error && !overview.data) return <ErrorState error={overview.error} onRetry={overview.reload} />
  if (requests.error && !requests.data) return <ErrorState error={requests.error} onRetry={requests.reload} />

  const all = requests.data?.requests ?? []
  const open = all.find((r) => r.status === 'PENDING')
  const past = all.filter((r) => r.status !== 'PENDING').slice(0, 6)
  const clean = normalizeAmount(amount)
  const valid = clean !== '' && clean !== '0.00' && !clean.startsWith('-') && slip.trim().length >= 3 && reason.trim().length >= 3

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid || busy) return
    setBusy(true); setError(null)
    try {
      await api('/treasury/requests', {
        method: 'POST', idempotencyKey: attemptKey.current,
        body: { requestType: type, amount: clean, externalReference: slip.trim(), reason: reason.trim() },
      })
      toast.success('Request sent', { description: 'WalletPesa Finance will review it. You get a notice when it is decided.' })
      attemptKey.current = newIdempotencyKey() // the next request is a new attempt
      setAmount(''); setSlip(''); setReason('')
      requests.reload()
    } catch (err) {
      setError(reportError(err, 'Request not sent', 'Could not send the request.'))
    } finally { setBusy(false) }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 tabular-nums">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-extrabold tracking-tight">Float</h1>
        <span className="text-sm text-slate-600">Balance {formatTzs(overview.data?.wallets.floatAccount.balance)} · requests go to WalletPesa Finance</span>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
        <form onSubmit={submit} className="flex flex-col gap-[18px] rounded-3xl border border-line bg-white p-7">
          <h2 className="text-xl font-extrabold">New request</h2>
          <div role="radiogroup" aria-label="Request type" className="grid grid-cols-2 gap-1 rounded-[14px] bg-slate-100 p-1">
            {([['TOPUP', 'Top up float'], ['WITHDRAWAL', 'Withdraw float']] as const).map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={type === v} onClick={() => setType(v)}
                className={`h-11 rounded-[11px] text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${type === v ? 'bg-white shadow-sm' : ''}`}>{label}</button>
            ))}
          </div>
          <div className="flex flex-col gap-1.5"><label htmlFor="fl-amt" className="text-sm font-semibold">Amount (TZS)</label>
            <input id="fl-amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500,000" className={`${FIELD} h-14 text-2xl font-extrabold`} /></div>
          <div className="flex flex-col gap-1.5"><label htmlFor="fl-ref" className="text-sm font-semibold">Bank deposit slip number</label>
            <input id="fl-ref" value={slip} onChange={(e) => setSlip(e.target.value)} maxLength={100} className={`${FIELD} h-[52px] font-semibold`} />
            <span className="text-[13px] text-slate-600">Finance matches this against the bank statement.</span></div>
          <div className="flex flex-col gap-1.5"><label htmlFor="fl-why" className="text-sm font-semibold">Reason</label>
            <textarea id="fl-why" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} className={`${FIELD} resize-none py-3 text-[15px]`} /></div>
          {error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
          <Button type="submit" loading={busy} disabled={!valid} block className="h-14 rounded-[14px] text-[17px]">{type === 'TOPUP' ? 'Send top-up request' : 'Send withdrawal request'}</Button>
        </form>

        <aside className="flex flex-col gap-4">
          {open && (
            <section aria-label="Open request" className="flex flex-col gap-4 rounded-3xl bg-ink p-6 text-white">
              <div className="flex items-center justify-between"><span className="font-mono text-[13px] text-slate-400">{open.requestRef}</span>
                <span className="rounded-full bg-[#1E3A8A] px-2.5 py-1 text-xs font-bold text-blue-100">Under review</span></div>
              <span className="text-[32px] font-extrabold tracking-tight">{formatTzs(open.amount)} <span className="text-sm font-normal tracking-normal text-slate-400">{TYPE_LABEL[open.requestType] ?? open.requestType}</span></span>
              <ol className="m-0 flex list-none flex-col p-0">
                <Step title="Submitted" sub={`${formatDateTime(open.createdAt)} · by you`} state="done" />
                <Step title="Under review" sub="One WalletPesa Finance staff member decides" state="now" />
                <Step title={open.requestType === 'WITHDRAWAL' ? 'Float debited' : 'Float credited'} sub="You are told when it is approved or rejected" state="todo" />
              </ol>
            </section>
          )}
          <section aria-label="Past requests" className="rounded-[20px] border border-line bg-white px-5 py-2">
            {past.length === 0 ? <p className="py-4 text-sm text-slate-600">{open ? 'No decided requests yet.' : 'No requests yet. Your requests and their results appear here.'}</p> : (
              <ul>
                {past.map((p, i) => (
                  <li key={p.requestId} className={`flex items-center gap-3 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                    <span className="flex flex-1 flex-col"><b className="text-[15px]">{formatTzs(p.amount, { symbol: false })} · {TYPE_LABEL[p.requestType] ?? p.requestType}</b>
                      <span className="text-[13px] text-slate-600">{formatDate(p.decidedAt ?? p.createdAt)}{p.status === 'REJECTED' && p.decisionNote ? ` · ${p.decisionNote}` : ''}</span></span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.status === 'APPROVED' ? 'bg-teal-100 text-teal-800' : 'bg-red-100 text-red-700'}`}>{p.status === 'APPROVED' ? (p.requestType === 'WITHDRAWAL' ? 'Debited' : 'Credited') : 'Rejected'}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
