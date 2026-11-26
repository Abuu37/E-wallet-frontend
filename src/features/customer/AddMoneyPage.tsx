import { ArrowLeft, Check, Landmark, Loader2, Plus, ShieldAlert } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, api, newIdempotencyKey } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { amountOf, formatTzs, normalizeAmount } from '../../shared/lib/money'
import { Button } from '../../shared/ui/controls'
import { PinPad } from '../../shared/ui/PinPad'
import { toast } from '../../shared/ui/toast'
import { BankCard, NameCheck } from './banks'
import { DEMO_LABEL, bankName, type BankBalance, type BankMoveResult, type LinkedBank } from './bankTypes'
import { useLinkBank } from './useLinkBank'
import type { KycInfo, Wallet } from './types'

type Step = 'form' | 'confirm' | 'processing' | 'done' | 'failed'
const CHIPS = ['20000', '50000', '100000', '150000']
const MIN = 1000

/** Add money from your own bank (W31 to W34): choose or link a bank, an amount, your PIN, done. Demo: Plaid Sandbox. */
export default function AddMoneyPage() {
  const navigate = useNavigate()
  const wallet = useApi<Wallet>((signal) => api('/wallets/me', { signal }), [])
  const kyc = useApi<KycInfo>((signal) => api('/kyc/status', { signal }), [])
  const banks = useApi<LinkedBank[]>((signal) => api('/banks', { signal }), [])

  const [step, setStep] = useState<Step>('form')
  const [bankId, setBankId] = useState('')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [result, setResult] = useState<BankMoveResult | null>(null)
  const [failure, setFailure] = useState('')
  const attemptKey = useRef('')

  const linker = useLinkBank((bank) => { setBankId(bank.id); banks.reload() })
  const list = banks.data ?? []
  const bank = list.find((b) => b.id === bankId) ?? list.find((b) => b.usable) ?? list[0]


  const balance = useApi<BankBalance | null>((signal) => (bank?.id && bank.usable ? api<BankBalance>(`/banks/${bank.id}/balance`, { signal }) : Promise.resolve(null)), [bank?.id, bank?.usable])

  const walletBalance = Number(amountOf(wallet.data?.balance ?? 0))
  const n = normalizeAmount(amount)
  const amountNum = n ? Number(n) : 0
  const perPayment = kyc.data ? Number(amountOf(kyc.data.perPaymentLimit)) : Infinity
  const maxBalance = kyc.data ? Number(amountOf(kyc.data.maxBalance)) : Infinity
  const bankAvailable = balance.data ? Number(amountOf(balance.data.availableTzs)) : Infinity

  let amountError = ''
  if (amountNum > 0 && amountNum < MIN) amountError = `The smallest amount is ${formatTzs(MIN, { symbol: false })} TZS.`
  else if (amountNum > perPayment) amountError = `This is over your ${formatTzs(perPayment, { symbol: false })} TZS per-payment limit.`
  else if (walletBalance + amountNum > maxBalance) amountError = `A wallet can hold at most ${formatTzs(maxBalance, { symbol: false })} TZS.`
  else if (amountNum > bankAvailable) amountError = `Your bank has ${formatTzs(bankAvailable, { symbol: false })} TZS available.`
  const canContinue = Boolean(bank?.usable) && amountNum >= MIN && !amountError

  async function confirm() {
    if (pin.length !== 4 || !bank) return
    if (!attemptKey.current) attemptKey.current = newIdempotencyKey()
    setStep('processing')
    try {
      const r = await api<BankMoveResult>('/transactions/bank-topup', { method: 'POST', idempotencyKey: attemptKey.current, body: { linkedBankId: bank.id, amount: n, pin } })
      setResult(r); setStep('done'); wallet.reload(); kyc.reload()
      toast.success('Money added', { description: `${formatTzs(r.amount, { symbol: false })} TZS from ${r.bank}` })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
      setPin(''); attemptKey.current = ''
      if (/wrong pin/i.test(msg)) { toast.error('Wrong PIN', { description: 'Nothing was added. Try again.' }); setStep('confirm'); return }
      setFailure(msg); setStep('failed')
      toast.error('Could not add money', { description: msg })
    }
  }

  if ((wallet.loading && !wallet.data) || (banks.loading && !banks.data)) return <div className="p-10 text-center text-muted"><Loader2 aria-hidden="true" className="mx-auto animate-spin" /></div>

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 tabular-nums">
      {linker.launcher}
      {(step === 'form' || step === 'confirm') && (
        <div className="flex items-center gap-3">
          {step === 'confirm' && <button type="button" aria-label="Back" onClick={() => setStep('form')} className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-white hover:bg-slate-50"><ArrowLeft aria-hidden="true" size={18} /></button>}
          <div className="flex-1"><h1 className="text-[26px] font-extrabold tracking-tight">Add money</h1><p className="text-sm text-muted">From your own bank, straight into your wallet</p></div>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{DEMO_LABEL}</span>
        </div>
      )}

      {step === 'form' && (list.length === 0 ? (
        <section className="flex flex-col items-start gap-4 rounded-[22px] border border-line bg-white p-6">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-brand-dark"><Landmark size={26} /></span>
          <div><h2 className="text-xl font-extrabold">Link your bank</h2>
            <p className="mt-1 text-sm text-slate-600">You sign in to your bank in Plaid&apos;s secure window. WalletPesa never sees your bank password, and the bank must be in your own name.</p></div>
          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">This is a demo on Plaid Sandbox. In the Plaid window pick any bank and sign in with <b>user_good</b> and <b>pass_good</b>.</p>
          <Button loading={linker.busy} onClick={linker.start}><Plus aria-hidden="true" size={16} /> Link a bank</Button>
        </section>
      ) : (
        <section className="flex flex-col gap-4 rounded-[22px] border border-line bg-white p-6">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold" id="am-bank-label">From</span>
            <div role="radiogroup" aria-labelledby="am-bank-label" className="flex flex-col gap-2">
              {list.map((b) => <BankCard key={b.id} bank={b} selected={b.id === bank?.id} onSelect={() => setBankId(b.id)} />)}
            </div>
            <button type="button" onClick={linker.start} disabled={linker.busy} className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-brand-dark hover:underline"><Plus aria-hidden="true" size={15} /> Link another bank</button>
          </div>
          {bank && !bank.usable && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">The name on this account does not match your name on WalletPesa, so it cannot be used.</p>}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="am-amount" className="text-sm font-semibold">Amount (TZS)</label>
            <input id="am-amount" inputMode="numeric" autoComplete="off" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" aria-invalid={amountError ? true : undefined}
              className={`h-16 w-full rounded-xl border bg-white px-4 text-3xl font-extrabold tracking-tight focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${amountError ? 'border-[#DC2626]' : 'border-slate-300 focus-visible:border-brand'}`} />
            <div className="flex flex-wrap gap-2">{CHIPS.map((c) => <button key={c} type="button" onClick={() => setAmount(c)} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:border-brand hover:bg-blue-50 hover:text-brand">{formatTzs(c, { symbol: false })}</button>)}</div>
            <p role={amountError ? 'alert' : undefined} className={`text-sm ${amountError ? 'font-semibold text-[#DC2626]' : 'text-muted'}`}>
              {amountError || (balance.data ? `Your bank has ${formatTzs(balance.data.availableTzs, { symbol: false })} TZS (demo rate 1 USD = ${formatTzs(balance.data.usdToTzs, { symbol: false })} TZS)` : `Wallet ${formatTzs(walletBalance, { symbol: false })} TZS`)}</p>
          </div>
          <dl className="flex flex-col gap-2 rounded-xl border border-line px-4 py-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Fee</dt><dd className="font-bold">0 TZS</dd></div>
            <div className="flex justify-between border-t border-line pt-2"><dt className="font-semibold">Your wallet after</dt><dd className="font-extrabold">{formatTzs(walletBalance + amountNum, { symbol: false })} TZS</dd></div>
          </dl>
          <Button block disabled={!canContinue} onClick={() => { attemptKey.current = newIdempotencyKey(); setPin(''); setStep('confirm') }}>Continue</Button>
        </section>
      ))}

      {step === 'confirm' && bank && (
        <section className="flex flex-col gap-5 rounded-[22px] border border-line bg-white p-6">
          <div className="flex flex-col items-center gap-1 text-center"><span className="text-sm text-muted">You are adding</span><b className="text-4xl font-extrabold tracking-tight">{formatTzs(amountNum, { symbol: false })} <span className="text-base font-semibold text-muted">TZS</span></b>
            <span className="text-sm">from <b>{bankName(bank)}</b></span><NameCheck check={bank.nameCheck} /></div>
          <dl className="flex flex-col gap-2 rounded-xl bg-surface px-4 py-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Fee</dt><dd className="font-bold">0 TZS</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Wallet after</dt><dd className="font-bold">{formatTzs(walletBalance + amountNum, { symbol: false })} TZS</dd></div>
          </dl>
          <PinPad value={pin} onChange={setPin} label="Enter your PIN to approve" />
          <Button block disabled={pin.length !== 4} onClick={() => void confirm()}>Add {formatTzs(amountNum, { symbol: false })} TZS</Button>
          <p className="text-center text-xs text-muted">{DEMO_LABEL}: the matching debit appears on the Sandbox bank.</p>
        </section>
      )}

      {step === 'processing' && (
        <section role="status" aria-live="polite" className="flex flex-col items-center gap-4 rounded-[22px] border border-line bg-white p-12 text-center">
          <Loader2 aria-hidden="true" className="animate-spin text-brand" size={44} />
          <h1 className="text-2xl font-extrabold">Adding money…</h1><p className="text-sm text-muted">Checking your bank and your PIN.</p>
        </section>
      )}

      {step === 'done' && result && (
        <section className="flex flex-col gap-5 rounded-[22px] border border-line bg-white p-7">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700"><Check size={30} strokeWidth={3} /></span>
          <div><h1 className="text-[26px] font-extrabold tracking-tight">{formatTzs(result.amount, { symbol: false })} TZS added</h1><p className="text-sm text-slate-600">From {result.bank}. It is in your wallet now.</p></div>
          <dl className="flex flex-col gap-2 rounded-xl bg-surface px-4 py-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">New balance</dt><dd className="font-bold">{formatTzs(result.balanceAfter, { symbol: false })} TZS</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Reference</dt><dd className="font-mono text-xs font-bold">{result.reference}</dd></div>
          </dl>
          <p className="rounded-xl bg-slate-100 px-3 py-2 text-center text-xs font-bold text-slate-700">{DEMO_LABEL}</p>
          <Button block onClick={() => navigate('/app')}>Done</Button>
        </section>
      )}

      {step === 'failed' && (
        <section className="flex flex-col gap-5 rounded-[22px] border border-line bg-white p-7">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700"><ShieldAlert size={28} /></span>
          <div><h1 className="text-[26px] font-extrabold tracking-tight">Money was not added</h1><p className="text-sm text-slate-600">Nothing left your bank and nothing changed in your wallet.</p></div>
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{failure}</p>
          <div className="flex flex-col gap-2.5 sm:flex-row"><Button block onClick={() => setStep('form')}>Try again</Button><Button block variant="secondary" onClick={() => navigate('/app')}>Back to dashboard</Button></div>
        </section>
      )}
    </div>
  )
}
