import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../../shared/api/client'
import { isWeakPin, WEAK_PIN_MESSAGE } from '../../shared/lib/pin'
import { maskEmail, toE164Tz } from '../../shared/lib/phone'
import { Button, Field } from '../../shared/ui/controls'
import { PinPad } from '../../shared/ui/PinPad'

type Step = 'phone' | 'details' | 'otp' | 'pin'
const STEPS: Step[] = ['details', 'otp', 'pin']

interface Details {
  phone: string
  username: string
  firstName: string
  middleName: string
  lastName: string
  email: string
  nidaNumber: string
  dateOfBirth: string
  address: string
}

const EMPTY: Details = {
  phone: '', username: '', firstName: '', middleName: '', lastName: '', email: '', nidaNumber: '', dateOfBirth: '', address: '',
}

function Progress({ step }: { step: Step }) {
  const index = STEPS.indexOf(step)
  if (index < 0) return null
  return (
    <div className="flex flex-col gap-3">
      <p className="text-right text-[13px] font-bold text-slate-600">Step {index + 1} of 3</p>
      <div className="flex gap-1.5" aria-hidden="true">
        {STEPS.map((s, i) => <span key={s} className={`h-1 flex-1 rounded ${i <= index ? 'bg-brand' : 'bg-line'}`} />)}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('phone')
  const [d, setD] = useState<Details>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [otp, setOtp] = useState('')
  const [pin, setPin] = useState('')
  const [pinAgain, setPinAgain] = useState('')

  const set = (key: keyof Details) => (e: { target: { value: string } }) => setD((p) => ({ ...p, [key]: e.target.value }))

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setFormError(null)
    setErrors({})
    try {
      await action()
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors)
        setFormError(err.message)
      } else {
        setFormError('Something went wrong. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  const phoneOk = d.phone.replace(/\D/g, '').length >= 9

  const submitDetails = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      await api('/customers/register', {
        method: 'POST',
        anonymous: true,
        body: {
          username: d.username.trim(),
          firstName: d.firstName.trim(),
          middleName: d.middleName.trim() || undefined,
          lastName: d.lastName.trim(),
          email: d.email.trim(),
          phone: toE164Tz(d.phone),
          nidaNumber: d.nidaNumber.replace(/[\s-]/g, ''),
          dateOfBirth: d.dateOfBirth,
          address: d.address.trim(),
        },
      })
      setStep('otp')
    })
  }

  const submitOtp = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      await api('/otp/verify', { method: 'POST', anonymous: true, body: { email: d.email.trim(), otp } })
      setStep('pin')
    })
  }

  const resendOtp = () => run(async () => {
    await api('/otp/resend', { method: 'POST', anonymous: true, body: { email: d.email.trim() } })
  })

  const weak = pin.length === 4 && isWeakPin(pin)
  const mismatch = pinAgain.length === 4 && pin !== pinAgain
  const pinReady = pin.length === 4 && !weak && pinAgain === pin

  const submitPin = (e: FormEvent) => {
    e.preventDefault()
    if (!pinReady) return
    void run(async () => {
      await api('/auth/set-pin', { method: 'POST', anonymous: true, body: { email: d.email.trim(), pin, confirmPin: pinAgain } })
      navigate('/login', { replace: true })
    })
  }

  return (
    <main className="min-h-screen bg-white text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-6 pb-7 pt-14">
        {step !== 'phone' && <Progress step={step} />}

        {step === 'phone' && (
          <form onSubmit={(e) => { e.preventDefault(); if (phoneOk) setStep('details') }} className="flex flex-1 flex-col gap-5">
            <h1 className="text-[30px] font-extrabold tracking-tight">Create your wallet</h1>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="rg-phone" className="text-sm font-semibold">Phone number</label>
              <div className="flex gap-2">
                <span className="flex h-[52px] items-center rounded-xl border border-slate-300 px-3.5 font-bold">+255</span>
                <input id="rg-phone" inputMode="tel" autoComplete="tel-national" value={d.phone} onChange={set('phone')} placeholder="712 345 678"
                  className="h-[52px] min-w-0 flex-1 rounded-xl border border-slate-300 px-3.5 text-[17px] font-semibold focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" />
              </div>
              <span className="text-[13px] text-slate-600">We will send a 6-digit code to check it is yours.</span>
            </div>
            <div className="mt-auto flex flex-col gap-3">
              <Button type="submit" block disabled={!phoneOk}>Continue</Button>
              <p className="text-center text-sm text-slate-600">Already have a wallet? <Link to="/login" className="font-bold text-brand-dark">Sign in</Link></p>
            </div>
          </form>
        )}

        {step === 'details' && (
          <form onSubmit={submitDetails} className="flex flex-1 flex-col gap-3.5">
            <div>
              <h1 className="text-[26px] font-extrabold tracking-tight">About you</h1>
              <p className="text-sm text-slate-600">Use the details on your NIDA card.</p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="First name" value={d.firstName} onChange={set('firstName')} error={errors.firstName} autoComplete="given-name" required />
              <Field label="Last name" value={d.lastName} onChange={set('lastName')} error={errors.lastName} autoComplete="family-name" required />
            </div>
            <Field label="Middle name (optional)" value={d.middleName} onChange={set('middleName')} error={errors.middleName} autoComplete="additional-name" />
            <Field label="Username" value={d.username} onChange={set('username')} error={errors.username} autoComplete="username" required />
            <Field label="NIDA number" inputMode="numeric" value={d.nidaNumber} onChange={set('nidaNumber')} error={errors.nidaNumber} hint="20 digits, printed under your photo" required />
            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Date of birth" type="date" value={d.dateOfBirth} onChange={set('dateOfBirth')} error={errors.dateOfBirth} autoComplete="bday" required />
              <Field label="Email" type="email" inputMode="email" value={d.email} onChange={set('email')} error={errors.email} autoComplete="email" required />
            </div>
            <Field label="Home address" value={d.address} onChange={set('address')} error={errors.address} autoComplete="street-address" required />
            {errors.phone && <p role="alert" className="text-xs font-medium text-[#BE123C]">{errors.phone}</p>}
            {formError && !Object.keys(errors).length && <p role="alert" className="text-sm font-medium text-[#BE123C]">{formError}</p>}
            <div className="mt-auto flex flex-col gap-2 pt-2">
              <Button type="submit" block loading={busy}>Continue</Button>
              <Button type="button" variant="ghost" block onClick={() => setStep('phone')}>Back</Button>
              <p className="text-center text-xs text-slate-600">We use these to keep your wallet safe and meet KYC rules.</p>
            </div>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={submitOtp} className="flex flex-1 flex-col gap-5">
            <div>
              <h1 className="text-[30px] font-extrabold tracking-tight">Enter the code</h1>
              <p className="text-[15px] text-slate-600">We sent a 6-digit code to <b className="text-ink">{maskEmail(d.email)}</b>.</p>
            </div>
            <Field label="6-digit code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} error={formError ?? undefined} className="text-center text-2xl tracking-[0.4em]" />
            <p className="text-sm text-slate-600">5 tries · expires in 5 minutes</p>
            <div className="mt-auto flex flex-col gap-3">
              <div className="rounded-2xl bg-surface p-3.5 text-[13px] leading-relaxed text-slate-700">
                WalletPesa will never call to ask for this code. Do not share it with anyone, including agents.
              </div>
              <Button type="submit" block loading={busy} disabled={otp.length !== 6}>Verify</Button>
              <Button type="button" variant="ghost" block onClick={() => void resendOtp()} disabled={busy}>Send a new code</Button>
            </div>
          </form>
        )}

        {step === 'pin' && (
          <form onSubmit={submitPin} className="flex flex-1 flex-col gap-4">
            <div>
              <h1 className="text-[30px] font-extrabold tracking-tight">Create your PIN</h1>
              <p className="text-[15px] text-slate-600">Your PIN approves every payment. Only you know it: not agents, not WalletPesa staff.</p>
            </div>
            {pin.length < 4 ? (
              <PinPad value={pin} onChange={setPin} label="Choose a 4-digit PIN" />
            ) : (
              <PinPad value={pinAgain} onChange={setPinAgain} label="Type your PIN again" />
            )}
            <p role="status" aria-live="polite" className={`min-h-[18px] text-center text-[13px] ${weak || mismatch ? 'text-[#B91C1C]' : 'text-slate-600'}`}>
              {weak ? WEAK_PIN_MESSAGE : mismatch ? 'The PINs do not match. Type it again.' : pin.length < 4 ? 'Avoid repeats and sequences like 1234.' : 'Type it once more to confirm.'}
            </p>
            {(weak || mismatch) && (
              <Button type="button" variant="ghost" onClick={() => { setPin(''); setPinAgain('') }}>Start over</Button>
            )}
            {formError && <p role="alert" className="text-center text-sm font-medium text-[#BE123C]">{formError}</p>}
            <Button type="submit" block loading={busy} disabled={!pinReady} className="mt-auto">Create PIN</Button>
          </form>
        )}
      </div>
    </main>
  )
}
