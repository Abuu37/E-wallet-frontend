import { Check, Loader2, Plus, ShieldAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { ApiError, api, newIdempotencyKey } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { amountOf, formatTzs, normalizeAmount } from '../../shared/lib/money'
import { Button } from '../../shared/ui/controls'
import { PinPad } from '../../shared/ui/PinPad'
import { toast } from '../../shared/ui/toast'
import { BankCard, NameCheck } from '../customer/banks'
import { DEMO_LABEL, bankName, type BankBalance, type BankMoveResult, type LinkedBank } from '../customer/bankTypes'
import { useLinkBank } from '../customer/useLinkBank'
import type { FloatBankSummary } from './agentApi'

type Step = 'form' | 'confirm' | 'processing' | 'done' | 'failed'
type Source = 'float' | 'commission'
const CHIPS = ['100000', '250000', '500000', '1000000']
const MIN = 1000

interface Props {
  /** topup pulls money from the agent's bank into float. send pays float or commission out to the bank. */
  kind: 'topup' | 'send'
  floatBalance: number
  commissionBalance: number
  summary?: FloatBankSummary
  /** Called after money moved, so the page can refresh its numbers. */
  onChanged: () => void
  /** For a top-up over the daily cap: switch to the Request float tab with the rest of the amount. */
  onRequestRest?: (rest: number) => void
}

/** One bank move for an agent: choose the bank, the amount, the PIN. Used by "From bank" and "Send to bank". */
export function AgentBankMove({ kind, floatBalance, commissionBalance, summary, onChanged, onRequestRest }: Props) {
  const banks = useApi<LinkedBank[]>((signal) => api('/banks', { signal }), [])
  const [bankId, setBankId] = useState('')
  const [source, setSource] = useState<Source>('float')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [step, setStep] = useState<Step>('form')
  const [result, setResult] = useState<BankMoveResult | null>(null)
  const [outcome, setOutcome] = useState<'PENDING' | 'COMPLETED' | 'FAILED'>('PENDING')
  const [failure, setFailure] = useState('')
  const attemptKey = useRef('')

  const linker = useLinkBank((bank) => { setBankId(bank.id); banks.reload() })
  const list = banks.data ?? []
  const bank = list.find((b) => b.id === bankId) ?? list.find((b) => b.usable) ?? list[0]

  const balance = useApi<BankBalance | null>((signal) => (kind === 'topup' && bank?.id && bank.usable ? api<BankBalance>(`/banks/${bank.id}/balance`, { signal }) : Promise.resolve(null)), [kind, bank?.id, bank?.usable])

  const n = normalizeAmount(amount)
  const amountNum = n ? Number(n) : 0
  const bankAvailable = balance.data ? Number(amountOf(balance.data.availableTzs)) : Infinity
  const left = summary ? Number(amountOf(summary.leftToday)) : Infinity
  const held = kind === 'topup' ? 0 : source === 'float' ? floatBalance : commissionBalance
  const overCap = kind === 'topup' && amountNum > 0 && amountNum > left
  const endpoint = kind === 'topup' ? '/agent/float/bank-topup' : source === 'float' ? '/agent/float/bank-withdraw' : '/agent/commission/bank-withdraw'

  let amountError = ''
  if (amountNum > 0 && amountNum < MIN) amountError = `The smallest amount is ${formatTzs(MIN, { symbol: false })} TZS.`
  else if (overCap) amountError = `This is over today's limit for bank top-ups. You can still add ${formatTzs(left, { symbol: false })} TZS by bank today.`
  else if (kind === 'topup' && amountNum > bankAvailable) amountError = `Your bank has ${formatTzs(bankAvailable, { symbol: false })} TZS available.`
  else if (kind === 'send' && amountNum > held) amountError = `You only have ${formatTzs(held, { symbol: false })} TZS in your ${source === 'float' ? 'float' : 'commission wallet'}.`
  const canContinue = Boolean(bank?.usable) && amountNum >= MIN && !amountError

  async function confirm() {
    if (pin.length !== 4 || !bank) return
    if (!attemptKey.current) attemptKey.current = newIdempotencyKey()
    setStep('processing')
    try {
      const r = await api<BankMoveResult>(endpoint, { method: 'POST', idempotencyKey: attemptKey.current, body: { linkedBankId: bank.id, amount: n, pin } })
      setResult(r); setOutcome(r.status === 'COMPLETED' ? 'COMPLETED' : 'PENDING'); setStep('done'); onChanged()
      if (kind === 'topup') toast.success('Float topped up', { description: `${formatTzs(r.amount, { symbol: false })} TZS from ${r.bank}` })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
      setPin(''); attemptKey.current = ''
      if (/wrong pin/i.test(msg)) { toast.error('Wrong PIN', { description: 'Nothing was moved. Try again.' }); setStep('confirm'); return }
      setFailure(msg); setStep('failed')
      toast.error(kind === 'topup' ? 'Float was not topped up' : 'Could not send to your bank', { description: msg })
    }
  }

  // A payout to the bank is Processing until the bank confirms: watch the receipt.
  useEffect(() => {
    if (step !== 'done' || !result || outcome !== 'PENDING') return
    const timer = window.setInterval(async () => {
      try {
        const receipt = await api<{ status: string }>(`/transactions/${result.reference}`)
        if (receipt.status === 'COMPLETED' || receipt.status === 'FAILED') {
          setOutcome(receipt.status); onChanged()
          if (receipt.status === 'COMPLETED') toast.success('Sent to your bank', { description: result.bank })
          else toast.error('Your bank did not accept it', { description: 'The money is back in your wallet.' })
        }
      } catch { /* try again on the next tick */ }
    }, 2000)
    return () => window.clearInterval(timer)
  }, [step, result, outcome, onChanged])

  function reset() { setStep('form'); setAmount(''); setPin(''); setResult(null); attemptKey.current = '' }

  if (banks.loading && !banks.data) return <div className="p-8 text-center text-muted"><Loader2 aria-hidden="true" className="mx-auto animate-spin" /></div>

  return (
    <section className="flex flex-col gap-4 rounded-[22px] border border-line bg-white p-6">
      {linker.launcher}

      {step === 'form' && (list.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <div><h2 className="text-xl font-extrabold">Link your business bank</h2>
            <p className="mt-1 text-sm text-slate-600">You sign in to your bank in Plaid&apos;s secure window. The account must be in your business name.</p></div>
          <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900">{DEMO_LABEL}: pick any bank and sign in with <b>user_good</b> and <b>pass_good</b>.</p>
          <Button loading={linker.busy} onClick={linker.start}><Plus aria-hidden="true" size={16} /> Link a bank</Button>
        </div>
      ) : (
        <>
          {kind === 'send' && (
            <div role="radiogroup" aria-label="Send from" className="grid grid-cols-2 gap-1 rounded-[14px] bg-slate-100 p-1">
              {([['float', 'Float', floatBalance], ['commission', 'Commission', commissionBalance]] as const).map(([v, label, bal]) => (
                <button key={v} type="button" role="radio" aria-checked={source === v} onClick={() => setSource(v)}
                  className={`flex h-12 flex-col items-center justify-center rounded-[11px] text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${source === v ? 'bg-white shadow-sm' : 'text-slate-500'}`}>
                  {label}<span className="text-xs font-semibold text-slate-500">{formatTzs(bal, { symbol: false })} TZS</span></button>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <span id={`ab-${kind}-bank`} className="text-sm font-semibold">{kind === 'topup' ? 'From' : 'To'}</span>
            <div role="radiogroup" aria-labelledby={`ab-${kind}-bank`} className="flex flex-col gap-2">
              {list.map((b) => <BankCard key={b.id} bank={b} selected={b.id === bank?.id} onSelect={() => setBankId(b.id)} />)}
            </div>
            <button type="button" onClick={linker.start} disabled={linker.busy} className="inline-flex w-fit items-center gap-1.5 text-sm font-bold text-brand-dark hover:underline"><Plus aria-hidden="true" size={15} /> Link another bank</button>
          </div>
          {bank && !bank.usable && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">The name on this account does not match your business name, so it cannot be used.</p>}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`ab-${kind}-amount`} className="text-sm font-semibold">Amount (TZS)</label>
            <input id={`ab-${kind}-amount`} inputMode="numeric" autoComplete="off" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" aria-invalid={amountError ? true : undefined}
              className={`h-16 w-full rounded-xl border bg-white px-4 text-3xl font-extrabold tracking-tight focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${amountError ? 'border-[#DC2626]' : 'border-slate-300 focus-visible:border-brand'}`} />
            <div className="flex flex-wrap gap-2">{CHIPS.map((c) => <button key={c} type="button" onClick={() => setAmount(c)} className="rounded-full border border-line px-3 py-1.5 text-sm font-semibold hover:border-brand hover:bg-blue-50 hover:text-brand">{formatTzs(c, { symbol: false })}</button>)}</div>
            <p role={amountError ? 'alert' : undefined} className={`text-sm ${amountError ? 'font-semibold text-[#DC2626]' : 'text-muted'}`}>
              {amountError || (kind === 'topup' ? (balance.data ? `Your bank has ${formatTzs(balance.data.availableTzs, { symbol: false })} TZS (demo rate 1 USD = ${formatTzs(balance.data.usdToTzs, { symbol: false })} TZS)` : '') : 'No fee for agents.')}</p>
            {overCap && onRequestRest && left < amountNum && (
              <button type="button" onClick={() => onRequestRest(amountNum - Math.max(left, 0))} className="w-fit rounded-full border border-brand px-4 py-2 text-sm font-bold text-brand-dark hover:bg-blue-50">Request float for the rest ({formatTzs(amountNum - Math.max(left, 0), { symbol: false })} TZS)</button>
            )}
          </div>
          <Button block disabled={!canContinue} onClick={() => { attemptKey.current = newIdempotencyKey(); setPin(''); setStep('confirm') }}>
            {kind === 'topup' ? `Top up ${amountNum ? formatTzs(amountNum, { symbol: false }) + ' TZS' : ''}`.trim() : `Send ${amountNum ? formatTzs(amountNum, { symbol: false }) + ' TZS' : ''}`.trim()}
          </Button>
        </>
      ))}

      {step === 'confirm' && bank && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-1 text-center"><span className="text-sm text-muted">{kind === 'topup' ? 'You are adding to your float' : `You are sending from your ${source === 'float' ? 'float' : 'commission'}`}</span>
            <b className="text-4xl font-extrabold tracking-tight">{formatTzs(amountNum, { symbol: false })} <span className="text-base font-semibold text-muted">TZS</span></b>
            <span className="text-sm">{kind === 'topup' ? 'from' : 'to'} <b>{bankName(bank)}</b></span><NameCheck check={bank.nameCheck} /></div>
          <PinPad value={pin} onChange={setPin} label="Enter your PIN to approve" />
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button variant="secondary" block onClick={() => setStep('form')}>Back</Button>
            <Button block disabled={pin.length !== 4} onClick={() => void confirm()}>Approve</Button>
          </div>
          <p className="text-center text-xs text-muted">{DEMO_LABEL}: the matching line appears on the Sandbox bank.</p>
        </div>
      )}

      {step === 'processing' && (
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 p-8 text-center">
          <Loader2 aria-hidden="true" className="animate-spin text-brand" size={40} /><h2 className="text-xl font-extrabold">Working…</h2><p className="text-sm text-muted">Checking your PIN.</p>
        </div>
      )}

      {step === 'done' && result && (
        <div aria-live="polite" className="flex flex-col gap-4">
          {outcome === 'PENDING' ? <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-brand-dark"><Loader2 className="animate-spin" size={28} /></span>
            : outcome === 'COMPLETED' ? <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700"><Check size={30} strokeWidth={3} /></span>
              : <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700"><ShieldAlert size={28} /></span>}
          <div>
            <h2 className="text-[24px] font-extrabold tracking-tight">{kind === 'topup' ? `${formatTzs(result.amount, { symbol: false })} TZS added to your float` : outcome === 'PENDING' ? 'Processing…' : outcome === 'COMPLETED' ? 'Sent to your bank' : 'Your bank did not accept it'}</h2>
            <p className="text-sm text-slate-600">{kind === 'topup' ? `From ${result.bank}. It is in your float now.` : outcome === 'PENDING' ? `${formatTzs(result.amount, { symbol: false })} TZS is on its way to ${result.bank}.` : outcome === 'COMPLETED' ? `${formatTzs(result.amount, { symbol: false })} TZS reached ${result.bank}.` : 'The money is back in your wallet.'}</p>
          </div>
          <dl className="flex flex-col gap-2 rounded-xl bg-surface px-4 py-3 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Balance now</dt><dd className="font-bold">{formatTzs(result.balanceAfter, { symbol: false })} TZS</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Reference</dt><dd className="font-mono text-xs font-bold">{result.reference}</dd></div>
          </dl>
          <p className="rounded-xl bg-slate-100 px-3 py-2 text-center text-xs font-bold text-slate-700">{DEMO_LABEL}</p>
          <Button block variant="secondary" onClick={reset}>Done</Button>
        </div>
      )}

      {step === 'failed' && (
        <div className="flex flex-col gap-4">
          <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-700"><ShieldAlert size={28} /></span>
          <div><h2 className="text-[24px] font-extrabold tracking-tight">{kind === 'topup' ? 'Float was not topped up' : 'Nothing was sent'}</h2><p className="text-sm text-slate-600">Your balances did not change.</p></div>
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{failure}</p>
          <Button block onClick={() => setStep('form')}>Try again</Button>
        </div>
      )}
    </section>
  )
}
