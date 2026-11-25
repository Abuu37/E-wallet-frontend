import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { useSession } from '../../shared/auth/context'
import { formatTzs } from '../../shared/lib/money'
import { groupedTz, isTzMobile, maskEmail, toE164Tz, tzDigits } from '../../shared/lib/phone'
import { Button } from '../../shared/ui/controls'
import { toast } from '../../shared/ui/toast'
import { AuthShell, type AuthSide, type SideStep } from './AuthShell'
import { FieldError, PhoneField, PinField, TextField } from './authFields'

type Step = 'phone' | 'details' | 'code' | 'pin' | 'done'
const ORDER: Step[] = ['phone', 'details', 'code', 'pin', 'done']

interface Details { first: string; middle: string; last: string; nida: string; dob: string; email: string; address: string }
const EMPTY: Details = { first: '', middle: '', last: '', nida: '', dob: '', email: '', address: '' }

const SIDE: Record<Step, [string, string]> = {
  phone: ['Money that moves like a message.', 'Send, receive and withdraw cash at any agent. Open a wallet with just your phone and NIDA card.'],
  details: ['We check it’s really you.', 'The names on your wallet must match your NIDA card, so people you pay see your real name.'],
  code: ['One code, one phone.', 'Your wallet is tied to this account. We ask for a code whenever you reset your PIN.'],
  pin: ['Only you approve payments.', 'We keep only a scrambled copy of your PIN, so nobody at WalletPesa can see or use it.'],
  done: ['Welcome to WalletPesa.', 'Add money at any agent, then send to anyone with a phone number.'],
}
const STEP_LABELS: [Step, string, string][] = [['details', 'About you', 'Name, NIDA, date of birth'], ['code', 'Verify your account', '6-digit code'], ['pin', 'Create your PIN', '4 digits, only you know it']]
const NAME = /^[\p{L}\s'-]+$/u

const digitsOf = (v: string) => v.replace(/\D/g, '')

function ageOn(dobIso: string): number {
  const d = new Date(dobIso)
  if (Number.isNaN(d.getTime())) return NaN
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  if (now < new Date(now.getFullYear(), d.getMonth(), d.getDate())) age--
  return age
}

function detailErrors(v: Details): Partial<Record<keyof Details, string>> {
  const e: Partial<Record<keyof Details, string>> = {}
  ;(['first', 'last', 'nida', 'dob', 'email', 'address'] as const).forEach((k) => { if (!v[k].trim()) e[k] = 'Required' })
  ;(['first', 'middle', 'last'] as const).forEach((k) => { if (v[k] && !NAME.test(v[k].trim())) e[k] = 'Letters, spaces, hyphens and apostrophes only' })
  if (v.nida && digitsOf(v.nida).length !== 20) e.nida = `NIDA number has 20 digits (${digitsOf(v.nida).length} entered)`
  if (v.dob) {
    const a = ageOn(v.dob)
    if (Number.isNaN(a) || a < 0) e.dob = 'Date of birth must be in the past'
    else if (a < 18) e.dob = 'You must be 18 or older to open a wallet'
  }
  if (v.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) e.email = 'Enter a valid email, like name@example.com'
  if (v.address && v.address.trim().length > 255) e.address = 'Keep it under 255 characters'
  return e
}

/** A technical login name the person never sees or types: their name plus random digits. */
function makeUsername(v: Details): string {
  const base = `${v.first}${v.last}`.toLowerCase().replace(/[^a-z]/g, '').slice(0, 20) || 'user'
  return `${base}${Math.floor(1000 + Math.random() * 9000)}`
}

function pinRules(pin: string, dob: string): { text: string; ok: boolean }[] {
  const d = digitsOf(dob)
  const full = /^[0-9]{4}$/.test(pin)
  const digits = [...pin].map(Number)
  const allSame = full && digits.every((n) => n === digits[0])
  const sequence = full && ('0123456789'.includes(pin) || '9876543210'.includes(pin))
  const pairs = full && ((digits[0] === digits[2] && digits[1] === digits[3]) || (digits[0] === digits[1] && digits[2] === digits[3]))
  const birth = full && d.length === 8 && (d.slice(0, 4) === pin || d.slice(4, 8) === pin || d.slice(6, 8) + d.slice(4, 6) === pin)
  return [
    { text: 'Exactly 4 digits', ok: full },
    { text: 'Not one digit repeated (like 0000)', ok: full && !allSame },
    { text: 'Not a sequence (like 1234 or 4321)', ok: full && !sequence },
    { text: 'Not a repeating pair (like 1212 or 1122)', ok: full && !pairs },
    { text: 'Not your birth year or birthday', ok: full && !birth },
  ]
}

interface KycLimits { basic: { perPayment: number | string; daily: number | string; maxBalance: number | string } }

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signIn, status: sessionStatus } = useSession()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [terms, setTerms] = useState(false)
  const [phoneShown, setPhoneShown] = useState(false)
  const [v, setV] = useState<Details>(EMPTY)
  const [detailsShown, setDetailsShown] = useState(false)
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(60)
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [pinShown, setPinShown] = useState(false)
  const [pinVisible, setPinVisible] = useState(false)
  const [busy, setBusy] = useState(false)
  const [accountNo, setAccountNo] = useState<string | null>(null)
  const [autoSignedIn, setAutoSignedIn] = useState(false)

  // Resend countdown while the code step is open.
  useEffect(() => {
    if (step !== 'code' || resendIn <= 0) return
    const t = window.setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => window.clearTimeout(t)
  }, [step, resendIn])

  const phoneOk = isTzMobile(phone)
  const dErr = useMemo(() => (detailsShown ? detailErrors(v) : {}), [detailsShown, v])
  const dCount = Object.keys(dErr).length
  const rules = useMemo(() => pinRules(pin, v.dob), [pin, v.dob])
  const pinOk = rules.every((r) => r.ok)
  const match = pin === pin2 && pin2.length === 4

  const idx = ORDER.indexOf(step)
  const sideSteps: SideStep[] = STEP_LABELS.map(([, label, sub], i) => {
    const n = i + 1
    return { label, sub, number: n, state: idx > n || step === 'done' ? 'done' : idx === n ? 'current' : 'todo' } as SideStep
  })
  const side: AuthSide = {
    title: SIDE[step][0], body: SIDE[step][1], steps: step === 'phone' || step === 'done' ? undefined : sideSteps,
    bullets: step === 'phone' ? ['Ready in under 3 minutes', 'Fees shown before you pay, every time', 'A receipt for every payment'] : undefined,
    note: { title: 'Your money is protected', text: 'Every wallet is backed 1:1 by money held in the escrow account. Fees are shown before you confirm, and you get a receipt for every payment.' },
  }

  const set = (k: keyof Details) => (value: string) => setV((p) => ({ ...p, [k]: value }))
  const fieldErr = (k: keyof Details, serverKey: string) => dErr[k] || serverErrors[serverKey] || ''

  async function register(e: FormEvent) {
    e.preventDefault()
    setDetailsShown(true)
    if (busy || Object.keys(detailErrors(v)).length) return
    setBusy(true); setFormError(null); setServerErrors({})
    try {
      let attempt = 0
      for (;;) {
        try {
          await api('/customers/register', {
            method: 'POST', anonymous: true,
            body: {
              username: makeUsername(v), firstName: v.first.trim(), middleName: v.middle.trim() || undefined, lastName: v.last.trim(),
              email: v.email.trim(), phone: toE164Tz(phone), nidaNumber: digitsOf(v.nida), dateOfBirth: v.dob, address: v.address.trim(),
            },
          })
          break
        } catch (err) {
          // The generated login name collided with someone else's: try another one.
          if (err instanceof ApiError && err.status === 409 && /username/i.test(err.message) && attempt++ < 3) continue
          throw err
        }
      }
      setCode(''); setCodeError(null); setResendIn(60); setStep('code')
      toast.success('Account created', { description: `We emailed a 6-digit code to ${maskEmail(v.email)}.` })
    } catch (err) {
      if (err instanceof ApiError) {
        const mapped: Record<string, string> = {}
        for (const [key, msg] of Object.entries(err.fieldErrors)) mapped[key] = msg
        setServerErrors(mapped)
        setFormError(mapped.phone ? 'That phone number was not accepted: ' + mapped.phone : Object.keys(mapped).length ? 'Please check the highlighted fields.' : err.message)
      } else setFormError('Something went wrong. Please try again.')
    } finally { setBusy(false) }
  }

  async function verify(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    if (code.length !== 6) { setCodeError('Enter all 6 digits'); return }
    setBusy(true); setCodeError(null)
    try {
      await api('/otp/verify', { method: 'POST', anonymous: true, body: { email: v.email.trim(), otp: code } })
      setStep('pin')
      toast.success('Email verified')
    } catch (err) {
      setCode('')
      setCodeError(err instanceof ApiError ? err.message : 'Could not verify the code.')
    } finally { setBusy(false) }
  }

  async function resend() {
    if (resendIn > 0 || busy) return
    setBusy(true); setCodeError(null)
    try {
      await api('/otp/resend', { method: 'POST', anonymous: true, body: { email: v.email.trim() } })
      setCode(''); setResendIn(60)
      toast.info('New code sent', { description: `Check ${maskEmail(v.email)}.` })
    } catch (err) { setCodeError(err instanceof ApiError ? err.message : 'Could not send a new code.') } finally { setBusy(false) }
  }

  async function createPin(e: FormEvent) {
    e.preventDefault()
    setPinShown(true)
    if (busy || !pinOk || !match) return
    setBusy(true)
    try {
      const profile = await api<{ wallet?: { accountNumber?: string } }>('/auth/set-pin', {
        method: 'POST', anonymous: true, body: { email: v.email.trim(), pin, confirmPin: pin2 },
      })
      setAccountNo(profile?.wallet?.accountNumber ?? null)
      // The PIN only ever lives in this page's memory. Use it once to open the new wallet, then drop it.
      try { await signIn(toE164Tz(phone), pin); setAutoSignedIn(true) } catch { setAutoSignedIn(false) }
      setPin(''); setPin2(''); setStep('done')
      toast.success('Your wallet is ready')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not create your PIN.'
      setFormError(msg)
      toast.error('PIN not saved', { description: msg })
    } finally { setBusy(false) }
  }

  return (
    <AuthShell cta="register" side={side}>
      <div className="mx-auto flex w-full max-w-[460px] flex-col gap-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold text-slate-600">{step === 'phone' ? 'Get started' : step === 'done' ? 'All set' : `Step ${idx} of 3`}</span>
          {(step === 'details' || step === 'code') && (
            <button type="button" onClick={() => setStep(ORDER[Math.max(0, idx - 1)])} className="rounded px-1 text-sm font-semibold text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">Back</button>
          )}
        </div>

        {step === 'phone' && (
          <form onSubmit={(e) => { e.preventDefault(); if (!phoneOk || !terms) { setPhoneShown(true); return } setStep('details') }} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">Create your wallet</h1>
              <p className="text-[15px] text-slate-600">Ready in under 3 minutes. Fees are shown before you pay, every time.</p></div>
            <PhoneField id="r-phone" value={phone} onChange={setPhone} hint="We’ll send a 6-digit code to check it’s really you."
              error={phoneShown && !phoneOk ? (tzDigits(phone) ? 'Use a Tanzanian mobile number: 9 digits starting with 6 or 7' : 'Enter your phone number') : ''} />
            <div className="flex flex-col gap-1">
              <label className="flex items-start gap-2.5 text-sm text-slate-700"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1 h-[18px] w-[18px] accent-brand" />
                <span>I agree to the <a href="#terms" className="font-semibold text-brand-dark">Terms</a> and <a href="#privacy" className="font-semibold text-brand-dark">Privacy policy</a>.</span></label>
              <FieldError id="r-terms-err">{phoneShown && !terms ? 'Please agree to continue' : ''}</FieldError>
            </div>
            <Button type="submit" block className="h-[52px] text-[15px]">Continue</Button>
            <p className="text-center text-sm text-slate-600">Already have a wallet? <Link to="/login" className="font-semibold text-brand-dark no-underline hover:underline">Log in</Link></p>
          </form>
        )}

        {step === 'details' && (
          <form onSubmit={register} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">About you</h1>
              <p className="text-[15px] text-slate-600">For {groupedTz(phone)}. Use the details on your NIDA card.</p></div>
            {(dCount > 0 || formError) && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-semibold text-red-800">{dCount > 0 ? `Fix ${dCount} field${dCount === 1 ? '' : 's'} to continue.` : formError}</div>}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <TextField id="r-first" label="First name" value={v.first} onChange={set('first')} error={fieldErr('first', 'firstName')} placeholder="Asha" autoComplete="given-name" />
              <TextField id="r-last" label="Last name" value={v.last} onChange={set('last')} error={fieldErr('last', 'lastName')} placeholder="Juma" autoComplete="family-name" />
            </div>
            <TextField id="r-middle" label="Middle name" optional value={v.middle} onChange={set('middle')} error={fieldErr('middle', 'middleName')} autoComplete="additional-name" />
            <TextField id="r-nida" label="NIDA number" inputMode="numeric" value={v.nida} onChange={set('nida')} error={fieldErr('nida', 'nidaNumber')} placeholder="19900412-12345-00001-23" hint="20 digits, printed under your photo. Dashes optional." />
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <TextField id="r-dob" label="Date of birth" type="date" value={v.dob} onChange={set('dob')} error={fieldErr('dob', 'dateOfBirth')} hint="You must be 18 or older." autoComplete="bday" />
              <TextField id="r-email" label="Email" type="email" inputMode="email" value={v.email} onChange={set('email')} error={fieldErr('email', 'email')} hint="For your code, receipts and statements." autoComplete="email" />
            </div>
            <TextField id="r-address" label="Home address" value={v.address} onChange={set('address')} error={fieldErr('address', 'address')} placeholder="e.g. Plot 12, Mikocheni, Dar es Salaam" autoComplete="street-address" />
            <Button type="submit" block loading={busy} className="h-[52px] text-[15px]">Continue</Button>
            <p className="text-center text-xs text-slate-500">We use these to keep your wallet safe and meet KYC rules.</p>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={verify} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">Enter the code</h1>
              <p className="text-[15px] text-slate-600">Sent by email to <b className="text-ink">{maskEmail(v.email)}</b>. <button type="button" onClick={() => setStep('details')} className="font-semibold text-brand-dark hover:underline">Change details</button></p></div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="r-code" className="text-sm font-semibold">6-digit code</label>
              <input id="r-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => { setCode(digitsOf(e.target.value).slice(0, 6)); setCodeError(null) }} placeholder="••••••"
                aria-invalid={codeError ? true : undefined} aria-describedby="r-code-err"
                className={`h-[60px] w-full rounded-xl border bg-white px-4 text-center text-[26px] font-extrabold tracking-[0.5em] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${codeError ? 'border-[#DC2626]' : 'border-slate-300 focus-visible:border-brand'}`} />
              <FieldError id="r-code-err">{codeError}</FieldError>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>5 tries · expires in 5 min</span>
              <button type="button" onClick={() => void resend()} disabled={resendIn > 0 || busy} className={`font-semibold ${resendIn > 0 ? 'text-slate-400' : 'text-brand-dark hover:underline'}`}>
                {resendIn > 0 ? `Resend in ${Math.floor(resendIn / 60)}:${String(resendIn % 60).padStart(2, '0')}` : 'Resend code'}
              </button>
            </div>
            <div className="rounded-2xl bg-surface p-3.5 text-[13px] leading-relaxed text-slate-700">WalletPesa will never call to ask for this code. Do not share it with anyone, including agents.</div>
            <Button type="submit" block loading={busy} className="h-[52px] text-[15px]">Verify</Button>
          </form>
        )}

        {step === 'pin' && (
          <form onSubmit={createPin} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">Create your PIN</h1>
              <p className="text-[15px] text-slate-600">Your PIN approves every payment. Only you know it: not agents, not WalletPesa staff.</p></div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <PinField label="4-digit PIN" value={pin} onChange={setPin} autoComplete="new-password" visible={pinVisible} onToggleVisible={() => setPinVisible((x) => !x)} error={pinShown && !pinOk ? ' ' : ''} />
              <PinField label="Repeat PIN" value={pin2} onChange={setPin2} autoComplete="new-password" visible={pinVisible} onToggleVisible={() => setPinVisible((x) => !x)} error={pinShown && pinOk && !match ? ' ' : ''} />
            </div>
            <ul aria-label="PIN rules" className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
              {rules.map((r) => {
                const started = pin.length > 0
                return (
                  <li key={r.text} className={`flex items-center gap-2 ${!started ? 'text-slate-600' : r.ok ? 'text-green-700' : 'text-red-700'}`}>
                    <span aria-hidden="true" className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[11px] font-bold text-white ${!started ? 'bg-slate-300' : r.ok ? 'bg-green-600' : 'bg-red-600'}`}>{!started ? '•' : r.ok ? '✓' : '✕'}</span>{r.text}
                  </li>
                )
              })}
            </ul>
            <FieldError id="r-pin-err">{formError ?? (pinShown ? (!pinOk ? 'Choose a PIN that passes every rule above.' : !match ? 'The two PINs don’t match.' : '') : '')}</FieldError>
            <Button type="submit" block loading={busy} className="h-[52px] text-[15px]">Create PIN and open wallet</Button>
          </form>
        )}

        {step === 'done' && <Done first={v.first} email={v.email} phone={phone} accountNo={accountNo} autoSignedIn={autoSignedIn && sessionStatus === 'authenticated'}
          onVerify={() => navigate('/app/verify')} onWallet={() => navigate('/app')} onLogin={() => navigate('/login')} />}
      </div>
    </AuthShell>
  )
}

function Done({ first, email, phone, accountNo, autoSignedIn, onVerify, onWallet, onLogin }: {
  first: string; email: string; phone: string; accountNo: string | null; autoSignedIn: boolean; onVerify: () => void; onWallet: () => void; onLogin: () => void
}) {
  // Real limits from the server, available because the new customer was just signed in.
  const kyc = useApi<KycLimits & { verified: { perPayment: number | string; daily: number | string } }>((signal) => api('/kyc/status', { signal }), [autoSignedIn], undefined)
  const limits = kyc.data
  return (
    <div className="flex flex-col gap-5">
      <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl text-green-700">✓</span>
      <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">Your wallet is ready, {first}</h1>
        <p className="text-[15px] text-slate-600">Your account is set up for {groupedTz(phone)}. A confirmation was sent to {maskEmail(email)}.</p></div>
      <div className="flex flex-col gap-3 rounded-3xl bg-ink p-5 text-white">
        <div className="flex items-center justify-between text-sm font-bold text-slate-400"><span>WalletPesa · Main</span><span className="rounded-full bg-accent px-2.5 py-1 text-xs text-ink">Basic tier</span></div>
        <b className="text-4xl leading-none tracking-tight">0 <span className="text-base font-semibold text-slate-400">TZS</span></b>
        <span className="text-sm text-slate-400">{accountNo ? `Account •••• ${accountNo.slice(-4)}` : ''}</span>
      </div>
      {limits && (
        <div className="grid grid-cols-3 gap-2.5" aria-label="Your starting limits">
          {([['Per payment', limits.basic.perPayment], ['Per day', limits.basic.daily], ['Max balance', limits.basic.maxBalance]] as const).map(([k, val]) => (
            <div key={k} className="flex flex-col rounded-2xl border border-line p-3"><span className="text-xs text-slate-600">{k}</span><b className="text-base tabular-nums">{formatTzs(val, { symbol: false })}</b></div>
          ))}
        </div>
      )}
      {autoSignedIn ? (
        <>
          <div className="rounded-2xl bg-blue-50 p-4 text-sm text-slate-700">
            <div className="mb-1 flex items-center justify-between"><b className="text-ink">Verify once to raise your limits.</b><span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold">Demo · Plaid Sandbox</span></div>
            About 2 minutes with your ID and a selfie{limits ? `. Then up to ${formatTzs(limits.verified.perPayment, { symbol: false })} per payment and ${formatTzs(limits.verified.daily, { symbol: false })} a day.` : '.'}
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button block onClick={onVerify}>Verify my identity</Button>
            <Button block variant="secondary" onClick={onWallet}>Go to my wallet</Button>
          </div>
        </>
      ) : (
        <Button block onClick={onLogin}>Log in to your wallet</Button>
      )}
    </div>
  )
}
