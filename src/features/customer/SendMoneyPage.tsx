import { ArrowLeft, Check, Loader2, ShieldAlert, UserCheck, UserX } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api, newIdempotencyKey } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { amountOf, formatTzs, normalizeAmount } from '../../shared/lib/money'
import { groupedTz, isTzMobile, toE164Tz } from '../../shared/lib/phone'
import { Button } from '../../shared/ui/controls'
import { PinPad } from '../../shared/ui/PinPad'
import { toast } from '../../shared/ui/toast'
import { PhoneField } from '../auth/authFields'
import type { Beneficiary, KycInfo, Lookup, Quote, TransferResult, Wallet } from './types'

type Step = 'who' | 'amount' | 'confirm' | 'processing' | 'done' | 'failed'
const CHIPS = ['5000', '10000', '20000', '50000']
const MIN = 1000

/** Send money wallet to wallet (W17–W22): who, how much with the fee, your PIN, then the result. */
export default function SendMoneyPage() {
  const navigate = useNavigate()
  const wallet = useApi<Wallet>((signal) => api('/wallets/me', { signal }), [])
  const kyc = useApi<KycInfo>((signal) => api('/kyc/status', { signal }), [])
  const saved = useApi<Beneficiary[]>((signal) => api('/beneficiaries', { signal }), [])

  const [step, setStep] = useState<Step>('who')
  const [phone, setPhone] = useState('')
  const [lookup, setLookup] = useState<Lookup | null>(null)
  const [looking, setLooking] = useState(false)
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [pin, setPin] = useState('')
  const [result, setResult] = useState<TransferResult | null>(null)
  const [failure, setFailure] = useState('')
  const attemptKey = useRef('')
  const timer = useRef<number | undefined>(undefined)
  const quoteTimer = useRef<number | undefined>(undefined)

  const balance = Number(amountOf(wallet.data?.balance ?? 0))
  const clean = normalizeAmount(amount)
  const amountNum = clean ? Number(clean) : 0
  const fee = quote ? Number(amountOf(quote.fee)) : 0
  const total = amountNum + fee
  const perPayment = kyc.data ? Number(amountOf(kyc.data.perPaymentLimit)) : Infinity
  const leftToday = kyc.data ? Math.max(0, Number(amountOf(kyc.data.dailyLimit)) - Number(amountOf(kyc.data.usedToday))) : Infinity
  const verified = kyc.data?.status === 'VERIFIED'

  function onPhone(v: string) {
    setPhone(v); setLookup(null)
    window.clearTimeout(timer.current)
    if (!isTzMobile(v)) { setLooking(false); return }
    setLooking(true)
    timer.current = window.setTimeout(async () => {
      try { setLookup(await api<Lookup>('/wallets/lookup', { query: { phone: toE164Tz(v) } })) } catch (err) {
        setLookup(null)
        toast.warning('Could not look up that number', { description: err instanceof ApiError ? err.message : 'Try again in a moment.' })
      } finally { setLooking(false) }
    }, 350)
  }

  function onAmount(v: string) {
    setAmount(v); setQuote(null)
    window.clearTimeout(quoteTimer.current)
    const n = normalizeAmount(v)
    if (!n || Number(n) < MIN) return
    quoteTimer.current = window.setTimeout(async () => {
      try { setQuote(await api<Quote>('/tariffs/quote', { query: { type: 'TRANSFER', amount: n } })) } catch { setQuote(null) }
    }, 250)
  }

  let amountError = ''
  if (amountNum > 0 && amountNum < MIN) amountError = `The smallest amount is ${formatTzs(MIN, { symbol: false })} TZS.`
  else if (amountNum > perPayment) amountError = `This is over your ${formatTzs(perPayment, { symbol: false })} TZS per-payment limit.`
  else if (amountNum > leftToday) amountError = `This is over your daily limit. You can still send ${formatTzs(leftToday, { symbol: false })} TZS today.`
  else if (quote && total > balance) amountError = `Not enough balance. You need ${formatTzs(total, { symbol: false })} TZS including the fee.`
  const canContinue = amountNum >= MIN && Boolean(quote) && !amountError

  async function send() {
    if (pin.length !== 4) return
    if (!attemptKey.current) attemptKey.current = newIdempotencyKey()
    setStep('processing')
    try {
      const r = await api<TransferResult>('/transactions/transfer', {
        method: 'POST', idempotencyKey: attemptKey.current, body: { phone: toE164Tz(phone), amount: clean, pin },
      })
      setResult(r); setStep('done'); wallet.reload(); kyc.reload()
      toast.success('Money sent', { description: `TZS ${formatTzs(r.amount, { symbol: false })} to ${r.recipientName}` })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
      setPin('')
      if (/wrong pin/i.test(msg)) {
        // Nothing was sent: stay on the PIN screen and let them try again with a fresh key.
        attemptKey.current = ''
        toast.error('Wrong PIN', { description: 'Nothing was sent. Try again.' })
        setStep('confirm')
        return
      }
      attemptKey.current = ''
      setFailure(msg); setStep('failed')
      toast.error('Payment did not go through', { description: msg })
    }
  }

  const reset = () => { setStep('who'); setPhone(''); setLookup(null); setAmount(''); setQuote(null); setPin(''); setResult(null); setFailure(''); attemptKey.current = '' }

  if (wallet.loading && !wallet.data) return <div className="p-10 text-center text-muted"><Loader2 aria-hidden="true" className="mx-auto animate-spin" /></div>

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 tabular-nums">
      {step !== 'done' && step !== 'failed' && step !== 'processing' && (
        <div className="flex items-center gap-3">
          {step !== 'who' && <button type="button" aria-label="Back" onClick={() => setStep(step === 'confirm' ? 'amount' : 'who')} className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white hover:bg-slate-50"><ArrowLeft aria-hidden="true" size={18} /></button>}
          <div><h1 className="text-[26px] font-extrabold tracking-tight">Send money</h1><p className="text-sm text-muted">To another WalletPesa wallet · {step === 'who' ? 'Step 1 of 3' : step === 'amount' ? 'Step 2 of 3' : 'Step 3 of 3'}</p></div>
        </div>
      )}

      {step === 'who' && (
        <section className="flex flex-col gap-4 rounded-[22px] border border-line bg-white p-6">
          {(saved.data?.length ?? 0) > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm font-semibold">Saved contacts</span>
              <div className="flex flex-wrap gap-2">
                {saved.data!.slice(0, 6).map((b) => (
                  <button key={b.phone} type="button" onClick={() => onPhone(b.phone.replace('+255', '0'))} className="rounded-full border border-line px-3.5 py-2 text-sm font-semibold hover:border-brand hover:bg-blue-50 hover:text-brand">{b.name}</button>
                ))}
              </div>
            </div>
          )}
          <PhoneField id="send-phone" value={phone} onChange={onPhone} hint="The number your friend registered WalletPesa with." />
          {looking && <p className="flex items-center gap-2 text-sm text-muted"><Loader2 aria-hidden="true" className="animate-spin" size={16} /> Looking up {groupedTz(phone)}…</p>}
          {lookup?.found && lookup.canReceive && (
            <div role="status" className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 text-green-800"><UserCheck aria-hidden="true" size={20} /><span><b>{lookup.name}</b><br /><span className="text-xs">Registered on WalletPesa · {groupedTz(phone)}</span></span></div>
          )}
          {lookup?.found && !lookup.canReceive && (
            <div role="alert" className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3 text-amber-900"><ShieldAlert aria-hidden="true" size={20} /><span><b>{lookup.name}</b> cannot receive money right now.</span></div>
          )}
          {lookup && !lookup.found && (
            <div role="alert" className="flex items-start gap-3 rounded-xl bg-slate-100 px-4 py-3 text-slate-800"><UserX aria-hidden="true" size={20} className="mt-0.5 shrink-0" />
              <span><b>Not on WalletPesa yet.</b><br /><span className="text-sm">Sending to other networks (M-Pesa, Mixx by Yas, Airtel Money, HaloPesa) is coming soon.</span></span></div>
          )}
          <Button block disabled={!lookup?.found || !lookup.canReceive} onClick={() => setStep('amount')}>Continue</Button>
        </section>
      )}

      {step === 'amount' && (
        <section className="flex flex-col gap-4 rounded-[22px] border border-line bg-white p-6">
          <div className="flex items-center gap-3 rounded-xl bg-surface px-4 py-3"><UserCheck aria-hidden="true" size={18} className="text-green-700" /><span className="text-sm"><b>{lookup?.name}</b> · {groupedTz(phone)}</span></div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="send-amount" className="text-sm font-semibold">Amount (TZS)</label>
            <input id="send-amount" inputMode="numeric" autoComplete="off" value={amount} onChange={(e) => onAmount(e.target.value)} placeholder="0" aria-invalid={amountError ? true : undefined} aria-describedby="send-amount-note"
              className={`h-16 w-full rounded-xl border bg-white px-4 text-3xl font-extrabold tracking-tight focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${amountError ? 'border-[#DC2626]' : 'border-slate-300 focus-visible:border-brand'}`} />
            <div className="flex flex-wrap gap-2">{CHIPS.map((c) => <button key={c} type="button" onClick={() => onAmount(c)} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:border-brand hover:bg-blue-50 hover:text-brand">{formatTzs(c, { symbol: false })}</button>)}</div>
            <p id="send-amount-note" role={amountError ? 'alert' : undefined} className={`text-sm ${amountError ? 'font-semibold text-[#DC2626]' : 'text-muted'}`}>
              {amountError || `Balance ${formatTzs(balance, { symbol: false })} TZS · up to ${formatTzs(Math.min(perPayment, leftToday), { symbol: false })} TZS now`}
            </p>
            {amountError && !verified && /limit/.test(amountError) && <Link to="/app/verify" className="text-sm font-semibold text-brand-dark">Verify your identity to raise your limits</Link>}
          </div>
          <dl className="flex flex-col gap-2 rounded-xl border border-line px-4 py-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Fee</dt><dd className="font-bold">{quote ? `${formatTzs(quote.fee, { symbol: false })} TZS` : '—'}</dd></div>
            <div className="flex justify-between border-t border-line pt-2"><dt className="font-semibold">Total from your wallet</dt><dd className="font-extrabold">{quote ? `${formatTzs(total, { symbol: false })} TZS` : '—'}</dd></div>
          </dl>
          <Button block disabled={!canContinue} onClick={() => { attemptKey.current = newIdempotencyKey(); setPin(''); setStep('confirm') }}>Continue</Button>
        </section>
      )}

      {step === 'confirm' && quote && (
        <section className="flex flex-col gap-5 rounded-[22px] border border-line bg-white p-6">
          <div className="flex flex-col items-center gap-1 text-center"><span className="text-sm text-muted">You are sending</span><b className="text-4xl font-extrabold tracking-tight">{formatTzs(amountNum, { symbol: false })} <span className="text-base font-semibold text-muted">TZS</span></b>
            <span className="text-sm">to <b>{lookup?.name}</b> · {groupedTz(phone)}</span></div>
          <dl className="flex flex-col gap-2 rounded-xl bg-surface px-4 py-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Fee</dt><dd className="font-bold">{formatTzs(quote.fee, { symbol: false })} TZS</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Total</dt><dd className="font-bold">{formatTzs(total, { symbol: false })} TZS</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Balance after</dt><dd className="font-bold">{formatTzs(balance - total, { symbol: false })} TZS</dd></div>
          </dl>
          <PinPad value={pin} onChange={setPin} label="Enter your PIN to confirm" />
          <Button block disabled={pin.length !== 4} onClick={() => void send()}>Send {formatTzs(amountNum, { symbol: false })} TZS</Button>
          <p className="text-center text-xs text-muted">Only you know your PIN. WalletPesa staff and agents never ask for it.</p>
        </section>
      )}

      {step === 'processing' && (
        <section role="status" aria-live="polite" className="flex flex-col items-center gap-4 rounded-[22px] border border-line bg-white p-12 text-center">
          <Loader2 aria-hidden="true" className="animate-spin text-brand" size={44} />
          <h1 className="text-2xl font-extrabold">Sending {formatTzs(total, { symbol: false })} TZS…</h1>
          <p className="text-sm text-muted">Hold on, this takes a second. Please do not close this page.</p>
        </section>
      )}

      {step === 'done' && result && (
        <section className="flex flex-col gap-5 rounded-[22px] border border-line bg-white p-7">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700"><Check size={30} strokeWidth={3} /></span>
          <div><h1 className="text-[26px] font-extrabold tracking-tight">{formatTzs(result.amount, { symbol: false })} TZS sent</h1><p className="text-sm text-slate-600">to {result.recipientName} · {result.recipientPhone}</p></div>
          <dl className="flex flex-col gap-2 rounded-xl bg-surface px-4 py-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Fee</dt><dd className="font-bold">{formatTzs(result.fee, { symbol: false })} TZS</dd></div>
            <div className="flex justify-between"><dt className="text-muted">New balance</dt><dd className="font-bold">{formatTzs(result.newBalance, { symbol: false })} TZS</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Reference</dt><dd className="font-mono text-xs font-bold">{result.referenceNo}</dd></div>
          </dl>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button block onClick={() => navigate('/app')}>Done</Button>
            <Button block variant="secondary" onClick={() => navigate(`/app/transactions?ref=${result.referenceNo}`)}>View receipt</Button>
            <Button block variant="ghost" onClick={reset}>Send another</Button>
          </div>
        </section>
      )}

      {step === 'failed' && (
        <section className="flex flex-col gap-5 rounded-[22px] border border-line bg-white p-7">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700"><ShieldAlert size={28} /></span>
          <div><h1 className="text-[26px] font-extrabold tracking-tight">Payment did not go through</h1><p className="text-sm text-slate-600">Your money is safe. Nothing left your wallet.</p></div>
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{failure}</p>
          <div className="flex flex-col gap-2.5 sm:flex-row"><Button block onClick={() => setStep('amount')}>Try again</Button><Button block variant="secondary" onClick={() => navigate('/app')}>Back to dashboard</Button></div>
        </section>
      )}
    </div>
  )
}
