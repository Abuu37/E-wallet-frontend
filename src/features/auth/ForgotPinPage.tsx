import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../../shared/api/client'
import { isWeakPin, WEAK_PIN_MESSAGE } from '../../shared/lib/pin'
import { maskEmail } from '../../shared/lib/phone'
import { Button } from '../../shared/ui/controls'
import { toast } from '../../shared/ui/toast'
import { AuthShell, type AuthSide, type SideStep } from './AuthShell'
import { FieldError, PinField, TextField } from './authFields'

type Step = 'email' | 'code' | 'pin' | 'done'
const ORDER: Step[] = ['email', 'code', 'pin']
const STEPS: [string, string][] = [['Your account', 'The email on your wallet'], ['Email code', '6 digits, valid 5 minutes'], ['New PIN', 'Other devices are signed out']]
const SIDE_TITLE = 'Get back into your wallet.'
const SIDE_BODY = 'Confirm it’s you, then set a new PIN. Your money stays where it is. This also unlocks a locked account.'

const digitsOf = (v: string) => v.replace(/\D/g, '')

function pinRules(pin: string, again: string): { text: string; ok: boolean }[] {
  const full = /^[0-9]{4}$/.test(pin)
  const d = [...pin].map(Number)
  const same = full && d.every((n) => n === d[0])
  const seq = full && ('0123456789'.includes(pin) || '9876543210'.includes(pin))
  const pairs = full && ((d[0] === d[2] && d[1] === d[3]) || (d[0] === d[1] && d[2] === d[3]))
  return [
    { text: 'Exactly 4 digits', ok: full },
    { text: 'Not one digit repeated (like 0000)', ok: full && !same },
    { text: 'Not a sequence (like 1234 or 4321)', ok: full && !seq },
    { text: 'Not a repeating pair (like 1212 or 1122)', ok: full && !pairs },
    { text: 'Both entries match', ok: full && pin === again },
  ]
}

/** Reset (and unlock) flow, web layout: email, emailed code, new PIN, done. */
export default function ForgotPinPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [emailShown, setEmailShown] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [resendIn, setResendIn] = useState(60)
  const [pin, setPin] = useState('')
  const [pin2, setPin2] = useState('')
  const [pinShown, setPinShown] = useState(false)
  const [pinVisible, setPinVisible] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (step !== 'code' || resendIn <= 0) return
    const t = window.setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => window.clearTimeout(t)
  }, [step, resendIn])

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())
  const rules = pinRules(pin, pin2)
  const rulesOk = rules.every((r) => r.ok) && !isWeakPin(pin)
  const idx = ORDER.indexOf(step)

  async function sendCode(e?: FormEvent) {
    e?.preventDefault()
    setEmailShown(true)
    if (busy || !emailOk) return
    setBusy(true); setFormError(null); setCodeError(null)
    try {
      await api('/auth/forgot-pin', { method: 'POST', anonymous: true, body: { email: email.trim() } })
      setCode(''); setResendIn(60); setStep('code')
      toast.success('Code sent', { description: `Check ${maskEmail(email)}. It is valid for 5 minutes.` })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
      if (step === 'code') setCodeError(msg); else setFormError(msg)
      toast.error('Could not send the code', { description: msg })
    } finally { setBusy(false) }
  }

  function checkCode(e: FormEvent) {
    e.preventDefault()
    if (code.length !== 6) { setCodeError('Enter all 6 digits'); return }
    setCodeError(null); setPin(''); setPin2(''); setPinShown(false); setStep('pin')
  }

  async function reset(e: FormEvent) {
    e.preventDefault()
    setPinShown(true)
    if (busy || !rulesOk) return
    setBusy(true); setFormError(null)
    try {
      await api('/auth/reset-pin', { method: 'POST', anonymous: true, body: { email: email.trim(), otp: code, newPin: pin } })
      setPin(''); setPin2(''); setCode(''); setStep('done')
      toast.success('PIN reset', { description: 'Other devices were signed out.' })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.'
      // The code is only checked when the new PIN is sent, so a bad code sends the person back to retype it.
      if (err instanceof ApiError && /otp|code|expired/i.test(msg)) { setCode(''); setCodeError(msg); setStep('code') } else setFormError(msg)
      toast.error('PIN not reset', { description: msg })
    } finally { setBusy(false) }
  }

  const sideSteps: SideStep[] = STEPS.map(([label, sub], i) => ({ label, sub, number: i + 1, state: step === 'done' || i < idx ? 'done' : i === idx ? 'current' : 'todo' }))
  const side: AuthSide = {
    title: SIDE_TITLE, body: SIDE_BODY, steps: step === 'done' ? undefined : sideSteps,
    note: { title: 'WalletPesa will never call you for this code.', text: 'Don’t share it with anyone, including agents and staff.' },
  }

  return (
    <AuthShell cta="login" side={side}>
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-5">
        {step !== 'done' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5" aria-hidden="true">{ORDER.map((s, i) => <span key={s} className={`h-[5px] flex-1 rounded-full ${i <= idx ? 'bg-brand' : 'bg-line'}`} />)}</div>
            <span className="text-[13px] font-bold text-brand-dark">Step {idx + 1} of 3: {STEPS[idx][0]}</span>
          </div>
        )}

        {step === 'email' && (
          <form onSubmit={sendCode} noValidate className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">Reset your PIN</h1>
              <p className="text-[15px] text-slate-600">Enter the email on your wallet. If an account exists we’ll send a 6-digit code.</p></div>
            <TextField id="fp-email" label="Email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(v) => { setEmail(v); setFormError(null) }}
              error={emailShown && !emailOk ? (email.trim() ? 'Enter a valid email, like name@example.com' : 'Enter your email') : ''} />
            {formError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-semibold text-red-800">{formError}</div>}
            <Button type="submit" block loading={busy} className="h-[52px] text-[15px] shadow-[0_10px_20px_-10px_rgba(37,99,235,0.7)]">Send code</Button>
            <p className="text-center text-sm text-slate-600">Remembered it? <Link to="/login" className="font-semibold text-brand-dark no-underline hover:underline">Log in</Link></p>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={checkCode} noValidate className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">Enter the code</h1>
              <p className="text-[15px] text-slate-600">Sent by email to <b className="text-ink">{maskEmail(email)}</b>. <button type="button" onClick={() => setStep('email')} className="font-semibold text-brand-dark hover:underline">Change</button></p></div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fp-code" className="text-sm font-semibold">6-digit code</label>
              <input id="fp-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => { setCode(digitsOf(e.target.value).slice(0, 6)); setCodeError(null) }} placeholder="••••••"
                aria-invalid={codeError ? true : undefined} aria-describedby="fp-code-err"
                className={`h-[60px] w-full rounded-xl border bg-white px-4 text-center text-[26px] font-extrabold tracking-[0.5em] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${codeError ? 'border-[#DC2626]' : 'border-slate-300 focus-visible:border-brand'}`} />
              <FieldError id="fp-code-err">{codeError}</FieldError>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Expires in 5 min</span>
              <button type="button" onClick={() => void sendCode()} disabled={resendIn > 0 || busy} className={`font-semibold ${resendIn > 0 ? 'text-slate-400' : 'text-brand-dark hover:underline'}`}>
                {resendIn > 0 ? `Resend in ${Math.floor(resendIn / 60)}:${String(resendIn % 60).padStart(2, '0')}` : 'Resend code'}
              </button>
            </div>
            <Button type="submit" block className="h-[52px] text-[15px] shadow-[0_10px_20px_-10px_rgba(37,99,235,0.7)]">Continue</Button>
          </form>
        )}

        {step === 'pin' && (
          <form onSubmit={reset} noValidate className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">Choose a new PIN</h1>
              <p className="text-[15px] text-slate-600">4 digits. You’ll use it to sign in and approve every payment.</p></div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <PinField label="New PIN" value={pin} onChange={setPin} autoComplete="new-password" visible={pinVisible} onToggleVisible={() => setPinVisible((x) => !x)} error={pinShown && !rulesOk ? ' ' : ''} />
              <PinField label="Type it again" value={pin2} onChange={setPin2} autoComplete="new-password" visible={pinVisible} onToggleVisible={() => setPinVisible((x) => !x)} error={pinShown && pin !== pin2 ? ' ' : ''} />
            </div>
            <ul aria-label="PIN rules" className="m-0 flex list-none flex-col gap-1.5 rounded-xl border border-line bg-surface p-3.5 text-[13px]">
              {rules.map((r) => {
                const started = pin.length > 0 || pinShown
                return <li key={r.text} className={`flex items-center gap-2 ${!started ? 'text-slate-600' : r.ok ? 'text-green-700' : 'text-red-700'}`}>
                  <b aria-hidden="true" className="w-4 text-center">{r.ok ? '✓' : pinShown ? '✕' : '•'}</b>{r.text}</li>
              })}
            </ul>
            <FieldError id="fp-pin-err">{formError ?? (pinShown && !rulesOk ? (pin.length === 4 && isWeakPin(pin) ? WEAK_PIN_MESSAGE : 'Choose a PIN that passes every rule above.') : '')}</FieldError>
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-3 text-[13px] leading-normal text-orange-900">For your safety, every other device is signed out after the reset.</div>
            <Button type="submit" block loading={busy} className="h-[52px] text-[15px] shadow-[0_10px_20px_-10px_rgba(37,99,235,0.7)]">Reset PIN</Button>
          </form>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-start gap-[18px]">
            <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-600">✓</span>
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">New PIN set</h1>
              <p className="text-[15px] leading-normal text-slate-600">We signed out every other device. Log in with your new PIN.</p></div>
            <div className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[13px] leading-normal text-slate-600">Didn’t do this? Contact support right away so we can lock your wallet while we check.</div>
            <Button type="button" block onClick={() => navigate('/login')} className="h-[52px] text-[15px] shadow-[0_10px_20px_-10px_rgba(37,99,235,0.7)]">Log in</Button>
          </div>
        )}
      </div>
    </AuthShell>
  )
}
