import { ArrowLeft, Check, Loader2, Plus, ShieldAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, api, newIdempotencyKey } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { amountOf, formatTzs, normalizeAmount } from '../../shared/lib/money'
import { Button } from '../../shared/ui/controls'
import { PinPad } from '../../shared/ui/PinPad'
import { toast } from '../../shared/ui/toast'
import { BankCard, NameCheck } from './banks'
import { DEMO_LABEL, bankName, type BankMoveResult, type LinkedBank } from './bankTypes'
import { useLinkBank } from './useLinkBank'
import type { KycInfo, Quote, Wallet } from './types'
import { WithdrawTabs, type WithdrawMode } from './WithdrawTabs'

type Step = 'form' | 'confirm' | 'processing' | 'sent' | 'failed'
const CHIPS = ['20000', '50000', '100000', '150000']
const MIN = 1000

/** Withdraw to your own bank (W27 to W29): a bank in your name, an amount, your PIN, then Processing until the bank confirms. */
export function WithdrawToBank({ wallet, kyc, mode, onMode }: { wallet: Wallet | undefined; kyc: KycInfo | undefined; mode: WithdrawMode; onMode: (m: WithdrawMode) => void }) {
  const navigate = useNavigate()
  const banks = useApi<LinkedBank[]>((signal) => api('/banks', { signal }), [])
  const [step, setStep] = useState<Step>('form')
  const [bankId, setBankId] = useState('')
  const [amount, setAmount] = useState('')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [pin, setPin] = useState('')
  const [result, setResult] = useState<BankMoveResult | null>(null)
  const [outcome, setOutcome] = useState<'PENDING' | 'COMPLETED' | 'FAILED'>('PENDING')
  const [failure, setFailure] = useState('')
  const attemptKey = useRef('')
  const quoteTimer = useRef<number | undefined>(undefined)

  const linker = useLinkBank((bank) => { setBankId(bank.id); banks.reload() })
  const list = banks.data ?? []
  const bank = list.find((b) => b.id === bankId) ?? list.find((b) => b.usable) ?? list[0]

  const balance = Number(amountOf(wallet?.balance ?? 0))
  const n = normalizeAmount(amount)
  const amountNum = n ? Number(n) : 0
  const fee = quote ? Number(amountOf(quote.fee)) : 0
  const total = amountNum + fee
  const perPayment = kyc ? Number(amountOf(kyc.perPaymentLimit)) : Infinity
  const leftToday = kyc ? Math.max(0, Number(amountOf(kyc.dailyLimit)) - Number(amountOf(kyc.usedToday))) : Infinity

  function onAmount(v: string) {
    setAmount(v); setQuote(null)
    window.clearTimeout(quoteTimer.current)
    const m = normalizeAmount(v)
    if (!m || Number(m) < MIN) return
    quoteTimer.current = window.setTimeout(async () => {
      try { setQuote(await api<Quote>('/tariffs/quote', { query: { type: 'BANK_WITHDRAWAL', amount: m } })) } catch { setQuote(null) }
    }, 250)
  }

  let amountError = ''
  if (amountNum > 0 && amountNum < MIN) amountError = `The smallest amount is ${formatTzs(MIN, { symbol: false })} TZS.`
  else if (amountNum > perPayment) amountError = `This is over your ${formatTzs(perPayment, { symbol: false })} TZS per-payment limit.`
  else if (amountNum > leftToday) amountError = `This is over your daily limit. You can still withdraw ${formatTzs(leftToday, { symbol: false })} TZS today.`
  else if (quote && total > balance) amountError = `Not enough balance. You need ${formatTzs(total, { symbol: false })} TZS including the fee.`
  const canContinue = Boolean(bank?.usable) && amountNum >= MIN && Boolean(quote) && !amountError

  async function confirm() {
    if (pin.length !== 4 || !bank) return
    if (!attemptKey.current) attemptKey.current = newIdempotencyKey()
    setStep('processing')
    try {
      const r = await api<BankMoveResult>('/transactions/bank-withdraw', { method: 'POST', idempotencyKey: attemptKey.current, body: { linkedBankId: bank.id, amount: n, pin } })
      setResult(r); setOutcome('PENDING'); setStep('sent')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
      setPin(''); attemptKey.current = ''
      if (/wrong pin/i.test(msg)) { toast.error('Wrong PIN', { description: 'Nothing was withdrawn. Try again.' }); setStep('confirm'); return }
      setFailure(msg); setStep('failed')
      toast.error('Withdrawal did not go through', { description: msg })
    }
  }

  // The bank confirms a moment after we accept: watch the receipt until it is Completed (or refunded).
  useEffect(() => {
    if (step !== 'sent' || !result || outcome !== 'PENDING') return
    const timer = window.setInterval(async () => {
      try {
        const receipt = await api<{ status: string }>(`/transactions/${result.reference}`)
        if (receipt.status === 'COMPLETED' || receipt.status === 'FAILED') {
          setOutcome(receipt.status)
          void api<Wallet>('/wallets/me').then((w) => setResult((r) => (r ? { ...r, balanceAfter: w.balance } : r))).catch(() => undefined)
          if (receipt.status === 'COMPLETED') toast.success('Sent to your bank', { description: result.bank })
          else toast.error('Your bank did not accept it', { description: 'The full amount and the fee are back in your wallet.' })
        }
      } catch { /* try again on the next tick */ }
    }, 2000)
    return () => window.clearInterval(timer)
  }, [step, result, outcome])

  return (
    <>
      {linker.launcher}
      {(step === 'form' || step === 'confirm') && (
        <div className="flex items-center gap-3">
          {step === 'confirm' && <button type="button" aria-label="Back" onClick={() => setStep('form')} className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white hover:bg-slate-50"><ArrowLeft aria-hidden="true" size={18} /></button>}
          <div className="flex-1"><h1 className="text-[26px] font-extrabold tracking-tight">Withdraw</h1><p className="text-sm text-muted">Send money to your own bank</p></div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{DEMO_LABEL}</span>
        </div>
      )}

      {step === 'form' && (
        <>
          <WithdrawTabs mode={mode} onChange={onMode} />
          {banks.loading && !banks.data ? <div className="p-8 text-center text-muted"><Loader2 aria-hidden="true" className="mx-auto animate-spin" /></div> : list.length === 0 ? (
            <section className="flex flex-col items-start gap-4 rounded-[22px] border border-line bg-white p-6">
              <div><h2 className="text-xl font-extrabold">Link your bank first</h2>
                <p className="mt-1 text-sm text-slate-600">Withdrawals go only to a bank in your own name. You sign in to it in Plaid&apos;s secure window.</p></div>
              <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">Demo on Plaid Sandbox: pick any bank and sign in with <b>user_good</b> and <b>pass_good</b>.</p>
              <Button loading={linker.busy} onClick={linker.start}><Plus aria-hidden="true" size={16} /> Link a bank</Button>
            </section>
          ) : (
            <section className="flex flex-col gap-4 rounded-[22px] border border-line bg-white p-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold" id="wb-bank-label">To</span>
                <div role="radiogroup" aria-labelledby="wb-bank-label" className="flex flex-col gap-2">
                  {list.map((b) => <BankCard key={b.id} bank={b} selected={b.id === bank?.id} onSelect={() => setBankId(b.id)} />)}
                </div>
                <button type="button" onClick={linker.start} disabled={linker.busy} className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-brand-dark hover:underline"><Plus aria-hidden="true" size={15} /> Link another bank</button>
              </div>
              {bank && !bank.usable && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">The name on this account does not match your name on WalletPesa, so it cannot be used.</p>}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="wb-amount" className="text-sm font-semibold">Amount (TZS)</label>
                <input id="wb-amount" inputMode="numeric" autoComplete="off" value={amount} onChange={(e) => onAmount(e.target.value)} placeholder="0" aria-invalid={amountError ? true : undefined}
                  className={`h-16 w-full rounded-xl border bg-white px-4 text-3xl font-extrabold tracking-tight focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${amountError ? 'border-[#DC2626]' : 'border-slate-300 focus-visible:border-brand'}`} />
                <div className="flex flex-wrap gap-2">{CHIPS.map((c) => <button key={c} type="button" onClick={() => onAmount(c)} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:border-brand hover:bg-blue-50 hover:text-brand">{formatTzs(c, { symbol: false })}</button>)}</div>
                <p role={amountError ? 'alert' : undefined} className={`text-sm ${amountError ? 'font-semibold text-[#DC2626]' : 'text-muted'}`}>{amountError || `Balance ${formatTzs(balance, { symbol: false })} TZS`}</p>
              </div>
              <dl className="flex flex-col gap-2 rounded-xl border border-line px-4 py-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Arrives in your bank</dt><dd className="font-bold">{amountNum ? `${formatTzs(amountNum, { symbol: false })} TZS` : '—'}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Fee</dt><dd className="font-bold">{quote ? `${formatTzs(quote.fee, { symbol: false })} TZS` : '—'}</dd></div>
                <div className="flex justify-between border-t border-line pt-2"><dt className="font-semibold">Total from your wallet</dt><dd className="font-extrabold">{quote ? `${formatTzs(total, { symbol: false })} TZS` : '—'}</dd></div>
              </dl>
              <Button block disabled={!canContinue} onClick={() => { attemptKey.current = newIdempotencyKey(); setPin(''); setStep('confirm') }}>Continue</Button>
            </section>
          )}
        </>
      )}

      {step === 'confirm' && quote && bank && (
        <section className="flex flex-col gap-5 rounded-[22px] border border-line bg-white p-6">
          <div className="flex flex-col items-center gap-1 text-center"><span className="text-sm text-muted">You are sending</span><b className="text-4xl font-extrabold tracking-tight">{formatTzs(amountNum, { symbol: false })} <span className="text-base font-semibold text-muted">TZS</span></b>
            <span className="text-sm">to <b>{bankName(bank)}</b></span><NameCheck check={bank.nameCheck} /></div>
          <dl className="flex flex-col gap-2 rounded-xl bg-surface px-4 py-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Fee</dt><dd className="font-bold">{formatTzs(quote.fee, { symbol: false })} TZS</dd></div>
            <div className="flex justify-between"><dt className="text-muted">From your wallet</dt><dd className="font-bold">{formatTzs(total, { symbol: false })} TZS</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Balance after</dt><dd className="font-bold">{formatTzs(balance - total, { symbol: false })} TZS</dd></div>
          </dl>
          <PinPad value={pin} onChange={setPin} label="Enter your PIN to approve" />
          <Button block disabled={pin.length !== 4} onClick={() => void confirm()}>Send {formatTzs(amountNum, { symbol: false })} TZS</Button>
          <p className="text-center text-xs text-muted">{DEMO_LABEL}: the matching credit appears on the Sandbox bank.</p>
        </section>
      )}

      {step === 'processing' && (
        <section role="status" aria-live="polite" className="flex flex-col items-center gap-4 rounded-[22px] border border-line bg-white p-12 text-center">
          <Loader2 aria-hidden="true" className="animate-spin text-brand" size={44} />
          <h1 className="text-2xl font-extrabold">Sending…</h1><p className="text-sm text-muted">Checking your PIN.</p>
        </section>
      )}

      {step === 'sent' && result && (
        <section aria-live="polite" className="flex flex-col gap-5 rounded-[22px] border border-line bg-white p-7">
          {outcome === 'PENDING' && <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-brand-dark"><Loader2 className="animate-spin" size={28} /></span>}
          {outcome === 'COMPLETED' && <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700"><Check size={30} strokeWidth={3} /></span>}
          {outcome === 'FAILED' && <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700"><ShieldAlert size={28} /></span>}
          <div>
            <h1 className="text-[26px] font-extrabold tracking-tight">{outcome === 'PENDING' ? 'Processing…' : outcome === 'COMPLETED' ? 'Sent to your bank' : 'Your bank did not accept it'}</h1>
            <p className="text-sm text-slate-600">
              {outcome === 'PENDING' ? `${formatTzs(result.amount, { symbol: false })} TZS is on its way to ${result.bank}. This usually takes a few seconds.`
                : outcome === 'COMPLETED' ? `${formatTzs(result.amount, { symbol: false })} TZS reached ${result.bank}.`
                  : 'The full amount and the fee are back in your wallet.'}</p>
          </div>
          <dl className="flex flex-col gap-2 rounded-xl bg-surface px-4 py-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Fee</dt><dd className="font-bold">{outcome === 'FAILED' ? '0' : formatTzs(result.fee, { symbol: false })} TZS</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Wallet balance</dt><dd className="font-bold">{formatTzs(result.balanceAfter, { symbol: false })} TZS</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Reference</dt><dd className="font-mono text-xs font-bold">{result.reference}</dd></div>
          </dl>
          <p className="rounded-xl bg-slate-100 px-3 py-2 text-center text-xs font-bold text-slate-700">{DEMO_LABEL}</p>
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
    </>
  )
}
