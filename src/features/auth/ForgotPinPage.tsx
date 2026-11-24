import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, api } from '../../shared/api/client'
import { isWeakPin, WEAK_PIN_MESSAGE } from '../../shared/lib/pin'
import { maskEmail } from '../../shared/lib/phone'
import { Button, Field } from '../../shared/ui/controls'
import { PinPad } from '../../shared/ui/PinPad'

type Step = 'email' | 'reset' | 'done'

/** Reset (and unlock) flow: email, then the emailed code together with a new PIN. */
export default function ForgotPinPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [pin, setPin] = useState('')
  const [pinAgain, setPinAgain] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try { await action() } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally { setBusy(false) }
  }

  const sendCode = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      await api('/auth/forgot-pin', { method: 'POST', anonymous: true, body: { email: email.trim() } })
      setStep('reset')
    })
  }

  const weak = pin.length === 4 && isWeakPin(pin)
  const mismatch = pinAgain.length === 4 && pin !== pinAgain
  const ready = otp.length === 6 && pin.length === 4 && !weak && pin === pinAgain

  const reset = (e: FormEvent) => {
    e.preventDefault()
    if (!ready) return
    void run(async () => {
      await api('/auth/reset-pin', { method: 'POST', anonymous: true, body: { email: email.trim(), otp, newPin: pin } })
      setStep('done')
    })
  }

  return (
    <main className="min-h-screen bg-white text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-6 pb-7 pt-14">
        {step === 'email' && (
          <form onSubmit={sendCode} className="flex flex-1 flex-col gap-5">
            <h1 className="text-2xl font-extrabold tracking-tight">Reset your PIN</h1>
            <p className="text-[15px] text-slate-600">Enter your email. If an account exists we will send a 6-digit code. This also unlocks a locked account.</p>
            <Field label="Email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={error ?? undefined} required />
            <div className="mt-auto flex flex-col gap-2">
              <Button type="submit" block loading={busy} disabled={!email.includes('@')}>Send code</Button>
              <Link to="/login" className="py-3 text-center text-sm font-bold text-brand-dark">Back to sign in</Link>
            </div>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={reset} className="flex flex-1 flex-col gap-4">
            <h1 className="text-2xl font-extrabold tracking-tight">Choose a new PIN</h1>
            <p className="text-sm text-slate-600">Code sent to {maskEmail(email)}. Single use, valid for 5 minutes.</p>
            <Field label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} />
            {pin.length < 4
              ? <PinPad value={pin} onChange={setPin} label="Choose a new 4-digit PIN" />
              : <PinPad value={pinAgain} onChange={setPinAgain} label="Type the new PIN again" />}
            <p role="status" aria-live="polite" className={`min-h-[18px] text-center text-[13px] ${weak || mismatch ? 'text-[#B91C1C]' : 'text-slate-600'}`}>
              {weak ? WEAK_PIN_MESSAGE : mismatch ? 'The PINs do not match.' : pin.length < 4 ? 'Avoid repeats and sequences like 1234.' : 'Type it once more to confirm.'}
            </p>
            {(weak || mismatch) && <Button type="button" variant="ghost" onClick={() => { setPin(''); setPinAgain('') }}>Start over</Button>}
            {error && <p role="alert" className="text-center text-sm font-medium text-[#BE123C]">{error}</p>}
            <div className="flex items-start gap-3 rounded-2xl bg-orange-50 p-3.5 text-[13px] leading-relaxed text-orange-900">
              For your safety, every other device is signed out after the reset.
            </div>
            <Button type="submit" block loading={busy} disabled={!ready} className="mt-auto">Reset PIN</Button>
          </form>
        )}

        {step === 'done' && (
          <div className="flex flex-1 flex-col gap-5 pt-10">
            <h1 className="text-[30px] font-extrabold leading-tight tracking-tight">New PIN set. Your wallet is locked down.</h1>
            <p className="text-[15px] text-slate-600">Sign in with your new PIN. If this was not you, contact support.</p>
            <Link to="/login" className="mt-auto inline-flex h-12 items-center justify-center rounded-full bg-brand font-bold text-white hover:bg-brand-dark">Go to sign in</Link>
          </div>
        )}
      </div>
    </main>
  )
}
