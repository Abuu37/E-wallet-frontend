import { CheckCircle2 } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, api, newIdempotencyKey } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { formatDateTime } from '../../shared/lib/dates'
import { amountOf, compareAmounts, formatTzs, normalizeAmount, subtractAmounts } from '../../shared/lib/money'
import { maskPhone, toE164Tz } from '../../shared/lib/phone'
import { Button, ErrorState, LoadingState } from '../../shared/ui/controls'
import { toast } from '../../shared/ui/toast'
import type { AgentOverview } from './AgentHome'

type Amount = number | string
interface CashInResult {
  transactionReference: string
  status: string
  currency: string
  amount: Amount
  fee: Amount
  commission: Amount
  customer: { phone: string; newBalance: Amount }
  agent: { agentAccountNumber: string; newFloatBalance: Amount; newCommissionBalance: Amount }
  createdAt: string
}

const INPUT = 'h-[52px] rounded-[14px] border border-slate-300 px-4 text-[17px] font-semibold text-ink focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200'

export default function AgentCashIn() {
  const overview = useApi<AgentOverview>((signal) => api('/agent/dashboard/overview', { signal }), [])
  const [phone, setPhone] = useState('')
  const [account, setAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState<CashInResult | null>(null)
  // One key per attempt: it is created on the first submit and reused if the same attempt is re-sent.
  const attemptKey = useRef('')
  const inFlight = useRef(false)

  if (overview.loading && !overview.data) return <LoadingState />
  if (overview.error && !overview.data) return <ErrorState error={overview.error} onRetry={overview.reload} />
  const float = overview.data!.wallets.floatAccount
  const clean = normalizeAmount(amount)
  const amountOk = clean !== '' && compareAmounts(clean, '1000.00') >= 0
  const floatAfter = amountOk ? subtractAmounts(amountOf(float.balance), clean) : null // display only; the server is the authority
  const valid = phone.replace(/\D/g, '').length >= 9 && account.trim().length > 0 && amountOk && /^[0-9]{4}$/.test(pin)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid || inFlight.current) return // a double tap cannot post twice
    inFlight.current = true
    if (!attemptKey.current) attemptKey.current = newIdempotencyKey()
    setBusy(true); setError(null)
    try {
      const result = await api<CashInResult>('/transactions/cash-in', {
        method: 'POST',
        idempotencyKey: attemptKey.current,
        body: { agentAccountNumber: float.accountNumber, accountNumber: account.trim(), amount: clean, phone: toE164Tz(phone), agentPin: pin },
      })
      setReceipt(result)
      toast.success('Cash-in complete', {
         description: 'The receipt is on screen.' 
        })
    } catch (err) {
      setPin('')
      attemptKey.current = '' // a failed attempt may be corrected and retried as a new attempt
      const msg = err instanceof ApiError ? err.message : 'Could not complete the cash-in.'
      setError(msg)
      toast.error('Cash-in failed', { description: msg })
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  function reset() { setPhone(''); setAccount(''); setAmount(''); setPin(''); setReceipt(null); setError(null); attemptKey.current = ''; overview.reload() }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5 tabular-nums">
      <div className="flex flex-col gap-1">
        <h1 className="text-[28px] font-extrabold tracking-tight">Cash-in</h1>
        <p className="text-sm text-slate-600">Customer gives you cash, you move it from your float to their wallet.</p>
      </div>

      {receipt ? (
        <section aria-label="Receipt" className="flex max-w-xl flex-col gap-3 rounded-3xl border border-line bg-white p-7">
          <div className="flex items-center gap-2 text-[#16A34A]"><CheckCircle2 aria-hidden="true" size={24} /><h2 className="text-lg font-extrabold">Cash-in complete</h2></div>
          <dl className="flex flex-col gap-2 text-sm">
            {[['Reference', receipt.transactionReference], ['Date', formatDateTime(receipt.createdAt)], ['Customer', maskPhone(receipt.customer.phone)],
              ['Amount', formatTzs(receipt.amount)], ['Fee', formatTzs(receipt.fee)], ['Your commission', formatTzs(receipt.commission)],
              ['Your float now', formatTzs(receipt.agent.newFloatBalance)]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line pb-2 last:border-0"><dt className="text-muted">{k}</dt><dd className="text-right font-bold">{v}</dd></div>
            ))}
          </dl>
          <div className="mt-2 flex gap-2">
            <Button block onClick={reset}>New cash-in</Button>
            <Link to="/agent" className="inline-flex h-12 items-center rounded-full border border-line px-6 font-bold hover:bg-slate-50">Dashboard</Link>
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">

          <form onSubmit={submit} className="flex flex-col gap-[18px] rounded-3xl border border-line bg-white p-7">
            <div className="flex flex-col gap-1.5"><label htmlFor="ci-phone" className="text-sm font-semibold">Customer phone</label>
              <input id="ci-phone" inputMode="tel" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" className={INPUT} />
            </div>

            <div className="flex flex-col gap-1.5"><label htmlFor="ci-acc" className="text-sm font-semibold">Customer wallet account number</label>
              <input id="ci-acc" inputMode="numeric" autoComplete="off" value={account} onChange={(e) => setAccount(e.target.value)} className={INPUT} />
              <span className="text-[13px] text-slate-600">Ask the customer to show it in their app. Name lookup arrives with send money.</span>
            </div>

            <div className="flex flex-col gap-1.5"><label htmlFor="ci-amt" className="text-sm font-semibold">Cash received</label>
              <input id="ci-amt" inputMode="decimal" autoComplete="off" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="50,000"
                className="h-[60px] rounded-[14px] border-2 border-brand px-4 text-[28px] font-extrabold text-ink shadow-[0_0_0_4px_#DBEAFE] focus-visible:outline-none" />
              <span className="text-[13px] text-slate-600">Minimum 1,000 TZS</span>
            </div>

            <div className="flex flex-col gap-1.5"><label htmlFor="ci-pin" className="text-sm font-semibold">Your agent PIN</label>
              <input id="ci-pin" type="password" inputMode="numeric" autoComplete="off" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} className={`${INPUT} w-44 tracking-[0.3em]`} />
            </div>
            
            {error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
            <Button type="submit" block loading={busy} disabled={!valid} className="h-14 rounded-[14px] text-[17px]">
              {amountOk ? `Confirm ${formatTzs(clean)}` : 'Confirm'}
            </Button>
          </form>

          <aside className="flex flex-col gap-4">
            <div className="flex flex-col rounded-3xl bg-ink p-6 text-white">
              <span className="mb-2 text-sm font-bold text-slate-400">Before you confirm</span>
              <div className="flex justify-between py-3 text-base"><span className="text-slate-300">Customer receives</span><b>{amountOk ? formatTzs(clean) : '—'}</b></div>
              <div className="flex justify-between border-t border-slate-800 py-3 text-base"><span className="text-slate-300">Your float after</span><b>{floatAfter ? formatTzs(floatAfter) : '—'}</b></div>
              <div className="flex justify-between border-t border-slate-800 py-3 text-base"><span className="text-slate-300">Your commission</span><b className="text-accent">On receipt</b></div>
              <div className="flex justify-between border-t border-slate-800 py-3 text-base"><span className="text-slate-300">Customer fee</span><b>On receipt</b></div>
            </div>
            <div className="flex flex-col gap-2.5 rounded-[20px] border border-line bg-white p-5">
              <span className="text-[15px] font-extrabold">Good practice</span>
              <span className="text-sm leading-relaxed text-slate-600">Count the cash before you confirm. Ask the customer to say their name. Never ask for their PIN: cash-in never needs it.</span>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
