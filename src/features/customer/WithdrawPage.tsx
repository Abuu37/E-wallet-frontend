import { ArrowLeft, Check, Landmark, Loader2, MapPin, ShieldAlert } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ApiError, api, newIdempotencyKey } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { amountOf, formatTzs, normalizeAmount } from '../../shared/lib/money'
import { Button } from '../../shared/ui/controls'
import { PinPad } from '../../shared/ui/PinPad'
import { toast } from '../../shared/ui/toast'
import { groupTill, type KycInfo, type Quote, type WithdrawResult, type Wallet } from './types'

type Step = 'form' | 'confirm' | 'processing' | 'approved' | 'failed'
const CHIPS = ['10000', '20000', '50000', '100000']
const MIN = 1000

/** Withdraw cash at an agent (W25, W26): the agent's till, the amount, your own PIN, then a code for the agent. */
export default function WithdrawPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const wallet = useApi<Wallet>((signal) => api('/wallets/me', { signal }), [])
  const kyc = useApi<KycInfo>((signal) => api('/kyc/status', { signal }), [])

  const [step, setStep] = useState<Step>('form')
  const [till, setTill] = useState((params.get('till') ?? '').replace(/\D/g, '').slice(0, 6))
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [pin, setPin] = useState('')
  const [result, setResult] = useState<WithdrawResult | null>(null)
  const [failure, setFailure] = useState('')
  const attemptKey = useRef('')
  const quoteTimer = useRef<number | undefined>(undefined)

  const balance = Number(amountOf(wallet.data?.balance ?? 0))
  const n = normalizeAmount(amount)
  const amountNum = n ? Number(n) : 0
  const fee = quote ? Number(amountOf(quote.fee)) : 0
  const total = amountNum + fee
  const perPayment = kyc.data ? Number(amountOf(kyc.data.perPaymentLimit)) : Infinity
  const leftToday = kyc.data ? Math.max(0, Number(amountOf(kyc.data.dailyLimit)) - Number(amountOf(kyc.data.usedToday))) : Infinity

  function onAmount(v: string) {
    setAmount(v); setQuote(null)
    window.clearTimeout(quoteTimer.current)
    const m = normalizeAmount(v)
    if (!m || Number(m) < MIN) return
    quoteTimer.current = window.setTimeout(async () => {
      try { setQuote(await api<Quote>('/tariffs/quote', { query: { type: 'CASH_OUT', amount: m } })) } catch { setQuote(null) }
    }, 250)
  }

  let amountError = ''
  if (amountNum > 0 && amountNum < MIN) amountError = `The smallest amount is ${formatTzs(MIN, { symbol: false })} TZS.`
  else if (amountNum > perPayment) amountError = `This is over your ${formatTzs(perPayment, { symbol: false })} TZS per-payment limit.`
  else if (amountNum > leftToday) amountError = `This is over your daily limit. You can still withdraw ${formatTzs(leftToday, { symbol: false })} TZS today.`
  else if (quote && total > balance) amountError = `Not enough balance. You need ${formatTzs(total, { symbol: false })} TZS including the fee.`
  const tillOk = /^\d{6}$/.test(till)
  const canContinue = tillOk && amountNum >= MIN && Boolean(quote) && !amountError

  async function confirm() {
    if (pin.length !== 4) return
    if (!attemptKey.current) attemptKey.current = newIdempotencyKey()
    setStep('processing')
    try {
      const r = await api<WithdrawResult>('/transactions/withdraw', { method: 'POST', idempotencyKey: attemptKey.current, body: { tillNumber: till, amount: n, pin } })
      setResult(r); setStep('approved'); wallet.reload(); kyc.reload()
      toast.success('Withdrawal approved', { description: 'Show the code to the agent to get your cash.' })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
      setPin(''); attemptKey.current = ''
      if (/wrong pin/i.test(msg)) { toast.error('Wrong PIN', { description: 'Nothing was withdrawn. Try again.' }); setStep('confirm'); return }
      setFailure(msg); setStep('failed')
      toast.error('Withdrawal did not go through', { description: msg })
    }
  }

  if (wallet.loading && !wallet.data) return <div className="p-10 text-center text-muted"><Loader2 aria-hidden="true" className="mx-auto animate-spin" /></div>

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 tabular-nums">
      {(step === 'form' || step === 'confirm') && (
        <div className="flex items-center gap-3">
          {step === 'confirm' && <button type="button" aria-label="Back" onClick={() => setStep('form')} className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white hover:bg-slate-50"><ArrowLeft aria-hidden="true" size={18} /></button>}
          <div><h1 className="text-[26px] font-extrabold tracking-tight">Withdraw</h1><p className="text-sm text-muted">Get cash from a WalletPesa agent</p></div>
        </div>
      )}

      {step === 'form' && (
        <>
          <div role="tablist" aria-label="How to withdraw" className="flex gap-1 rounded-full bg-slate-100 p-1">
            <button type="button" role="tab" aria-selected="true" className="flex-1 rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm">Cash at an agent</button>
            <button type="button" role="tab" aria-selected="false" disabled title="Coming soon" className="flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-slate-400"><Landmark aria-hidden="true" size={15} /> To my bank <span className="text-[11px] font-semibold">soon</span></button>
          </div>
          <section className="flex flex-col gap-4 rounded-[22px] border border-line bg-white p-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="wd-till" className="text-sm font-semibold">Agent till number</label>
              <input id="wd-till" inputMode="numeric" autoComplete="off" value={groupTill(till)} onChange={(e) => setTill(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="220 341"
                className="h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-2xl font-extrabold tracking-wide focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" />
              <p className="text-sm text-muted">The agent tells you their till number, or <Link to="/app/agents" className="inline-flex items-center gap-1 font-semibold text-brand-dark"><MapPin aria-hidden="true" size={14} /> find an agent near you</Link>.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="wd-amount" className="text-sm font-semibold">Amount (TZS)</label>
              <input id="wd-amount" inputMode="numeric" autoComplete="off" value={amount} onChange={(e) => onAmount(e.target.value)} placeholder="0" aria-invalid={amountError ? true : undefined}
                className={`h-16 w-full rounded-xl border bg-white px-4 text-3xl font-extrabold tracking-tight focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${amountError ? 'border-[#DC2626]' : 'border-slate-300 focus-visible:border-brand'}`} />
              <div className="flex flex-wrap gap-2">{CHIPS.map((c) => <button key={c} type="button" onClick={() => onAmount(c)} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:border-brand hover:bg-blue-50 hover:text-brand">{formatTzs(c, { symbol: false })}</button>)}</div>
              <p role={amountError ? 'alert' : undefined} className={`text-sm ${amountError ? 'font-semibold text-[#DC2626]' : 'text-muted'}`}>{amountError || `Balance ${formatTzs(balance, { symbol: false })} TZS`}</p>
            </div>
            <dl className="flex flex-col gap-2 rounded-xl border border-line px-4 py-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Agent fee</dt><dd className="font-bold">{quote ? `${formatTzs(quote.fee, { symbol: false })} TZS` : '—'}</dd></div>
              <div className="flex justify-between border-t border-line pt-2"><dt className="font-semibold">Total from your wallet</dt><dd className="font-extrabold">{quote ? `${formatTzs(total, { symbol: false })} TZS` : '—'}</dd></div>
            </dl>
            <Button block disabled={!canContinue} onClick={() => { attemptKey.current = newIdempotencyKey(); setPin(''); setStep('confirm') }}>Continue</Button>
          </section>
        </>
      )}

      {step === 'confirm' && quote && (
        <section className="flex flex-col gap-5 rounded-[22px] border border-line bg-white p-6">
          <div className="flex flex-col items-center gap-1 text-center"><span className="text-sm text-muted">You are withdrawing</span><b className="text-4xl font-extrabold tracking-tight">{formatTzs(amountNum, { symbol: false })} <span className="text-base font-semibold text-muted">TZS</span></b>
            <span className="text-sm">at till <b>{groupTill(till)}</b></span></div>
          <dl className="flex flex-col gap-2 rounded-xl bg-surface px-4 py-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Fee</dt><dd className="font-bold">{formatTzs(quote.fee, { symbol: false })} TZS</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Total</dt><dd className="font-bold">{formatTzs(total, { symbol: false })} TZS</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Balance after</dt><dd className="font-bold">{formatTzs(balance - total, { symbol: false })} TZS</dd></div>
          </dl>
          <PinPad value={pin} onChange={setPin} label="Enter your PIN to approve" />
          <Button block disabled={pin.length !== 4} onClick={() => void confirm()}>Approve withdrawal</Button>
          <p className="text-center text-xs text-muted">The agent never sees your PIN. They see only the code you get next.</p>
        </section>
      )}

      {step === 'processing' && (
        <section role="status" aria-live="polite" className="flex flex-col items-center gap-4 rounded-[22px] border border-line bg-white p-12 text-center">
          <Loader2 aria-hidden="true" className="animate-spin text-brand" size={44} />
          <h1 className="text-2xl font-extrabold">Approving…</h1><p className="text-sm text-muted">One moment.</p>
        </section>
      )}

      {step === 'approved' && result && (
        <section className="flex flex-col gap-5 rounded-[22px] border border-line bg-white p-7">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700"><Check size={30} strokeWidth={3} /></span>
          <div><h1 className="text-[26px] font-extrabold tracking-tight">Approved. Show the agent</h1><p className="text-sm text-slate-600">{result.agent.businessName} · till {groupTill(result.agent.tillNumber)} · {result.agent.district}</p></div>
          <div className="flex flex-col items-center gap-1 rounded-2xl bg-ink px-4 py-6 text-white"><span className="text-xs font-bold uppercase tracking-widest text-slate-400">Your code</span>
            <span aria-label={`Code ${result.matchCode.split('').join(' ')}`} className="text-6xl font-extrabold tracking-[0.3em]">{result.matchCode}</span>
            <span className="text-sm text-slate-300">The agent sees the same code and hands you {formatTzs(result.amount, { symbol: false })} TZS</span></div>
          <dl className="flex flex-col gap-2 rounded-xl bg-surface px-4 py-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Fee</dt><dd className="font-bold">{formatTzs(result.fee, { symbol: false })} TZS</dd></div>
            <div className="flex justify-between"><dt className="text-muted">New balance</dt><dd className="font-bold">{formatTzs(result.newBalance, { symbol: false })} TZS</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Reference</dt><dd className="font-mono text-xs font-bold">{result.referenceNo}</dd></div>
          </dl>
          <Button block onClick={() => navigate('/app')}>Done</Button>
        </section>
      )}

      {step === 'failed' && (
        <section className="flex flex-col gap-5 rounded-[22px] border border-line bg-white p-7">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700"><ShieldAlert size={28} /></span>
          <div><h1 className="text-[26px] font-extrabold tracking-tight">Withdrawal did not go through</h1><p className="text-sm text-slate-600">Your money is safe. Nothing left your wallet.</p></div>
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{failure}</p>
          <div className="flex flex-col gap-2.5 sm:flex-row"><Button block onClick={() => setStep('form')}>Try again</Button><Button block variant="secondary" onClick={() => navigate('/app')}>Back to dashboard</Button></div>
        </section>
      )}
    </div>
  )
}
