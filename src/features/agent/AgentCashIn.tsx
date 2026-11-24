import { CheckCircle2 } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, api, newIdempotencyKey } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { formatDateTime } from '../../shared/lib/dates'
import { formatTzs, normalizeAmount } from '../../shared/lib/money'
import { maskPhone, toE164Tz } from '../../shared/lib/phone'
import { Button, ErrorState, Field, LoadingState } from '../../shared/ui/controls'
import { PinPad } from '../../shared/ui/PinPad'
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

type Step = 'form' | 'pin' | 'receipt'

export default function AgentCashIn() {
  const overview = useApi<AgentOverview>((signal) => api('/agent/dashboard/overview', { signal }), [])
  const [step, setStep] = useState<Step>('form')
  const [phone, setPhone] = useState('')
  const [account, setAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [receipt, setReceipt] = useState<CashInResult | null>(null)
  // One key per attempt: created when the PIN step opens and reused if the same attempt is re-sent.
  const attemptKey = useRef<string>('')
  const inFlight = useRef(false)

  if (overview.loading && !overview.data) return <LoadingState />
  if (overview.error && !overview.data) return <ErrorState error={overview.error} onRetry={overview.reload} />
  const agentAccount = overview.data!.wallets.floatAccount.accountNumber

  const clean = normalizeAmount(amount)
  const formValid = phone.replace(/\D/g, '').length >= 9 && account.trim().length > 0 && clean !== '' && Number(clean) >= 1000

  function toPin(e: FormEvent) {
    e.preventDefault()
    if (!formValid) return
    attemptKey.current = newIdempotencyKey()
    setPin(''); setError(null); setStep('pin')
  }

  async function submit() {
    if (inFlight.current || pin.length !== 4) return // a double tap cannot post twice
    inFlight.current = true
    setBusy(true); setError(null)
    try {
      const result = await api<CashInResult>('/transactions/cash-in', {
        method: 'POST',
        idempotencyKey: attemptKey.current,
        body: { agentAccountNumber: agentAccount, accountNumber: account.trim(), amount: clean, phone: toE164Tz(phone), agentPin: pin },
      })
      setReceipt(result)
      setStep('receipt')
    } catch (err) {
      setPin('')
      setError(err instanceof ApiError ? err.message : 'Could not complete the cash-in.')
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  function reset() { setPhone(''); setAccount(''); setAmount(''); setPin(''); setReceipt(null); setError(null); setStep('form'); overview.reload() }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Cash-in</h1>

      {step === 'form' && (
        <form onSubmit={toPin} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
          <Field label="Customer phone" inputMode="tel" autoComplete="off" value={phone} onChange={(e) => setPhone(e.target.value)} hint="+255 is added automatically" required />
          <Field label="Customer wallet account number" inputMode="numeric" autoComplete="off" value={account} onChange={(e) => setAccount(e.target.value)} required />
          <Field label="Amount (TZS)" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} hint="Minimum 1,000 TZS" required />
          <p className="text-xs text-muted">Float available: {formatTzs(overview.data!.wallets.floatAccount.balance)}</p>
          <Button type="submit" block disabled={!formValid}>Continue</Button>
        </form>
      )}

      {step === 'pin' && (
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-5">
          <dl className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Customer</dt><dd className="font-bold tabular-nums">{maskPhone(toE164Tz(phone))}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Amount</dt><dd className="font-bold tabular-nums">{formatTzs(clean)}</dd></div>
          </dl>
          <p className="text-sm font-semibold">Enter your agent PIN to confirm</p>
          <PinPad value={pin} onChange={setPin} label="Agent PIN" disabled={busy} />
          {error && <p role="alert" className="text-center text-sm font-medium text-[#BE123C]">{error}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setStep('form')} disabled={busy}>Back</Button>
            <Button block loading={busy} disabled={pin.length !== 4} onClick={() => void submit()}>Confirm cash-in</Button>
          </div>
        </div>
      )}

      {step === 'receipt' && receipt && (
        <section aria-label="Receipt" className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center gap-2 text-[#16A34A]"><CheckCircle2 aria-hidden="true" size={24} /><h2 className="text-lg font-extrabold">Cash-in complete</h2></div>
          <dl className="flex flex-col gap-2 text-sm">
            {[['Reference', receipt.transactionReference], ['Date', formatDateTime(receipt.createdAt)], ['Customer', maskPhone(receipt.customer.phone)],
              ['Amount', formatTzs(receipt.amount)], ['Fee', formatTzs(receipt.fee)], ['Your commission', formatTzs(receipt.commission)],
              ['Your float now', formatTzs(receipt.agent.newFloatBalance)]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-line pb-2 last:border-0"><dt className="text-muted">{k}</dt><dd className="text-right font-bold tabular-nums">{v}</dd></div>
            ))}
          </dl>
          <div className="mt-2 flex gap-2">
            <Button block onClick={reset}>New cash-in</Button>
            <Link to="/agent" className="inline-flex h-12 items-center rounded-full border border-line px-6 font-bold hover:bg-slate-50">Dashboard</Link>
          </div>
        </section>
      )}
    </div>
  )
}
