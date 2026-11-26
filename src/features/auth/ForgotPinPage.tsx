import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../../shared/api/client'
import { WEAK_PIN_MESSAGE, isWeakPin } from '../../shared/lib/pin'
import { groupedTz, toE164Tz } from '../../shared/lib/phone'
import { Button } from '../../shared/ui/controls'
import { reportError, toast } from '../../shared/ui/toast'
import { AuthShell, type AuthSide, type SideStep } from './AuthShell'
import { FieldError, PhoneField, PinField, TextField } from './authFields'
import { bind } from './bind'
import { codeSchema, digitsOf, forgotSchema, newPinSchema, pinRules } from './schemas'

type Step = 'who' | 'code' | 'pin' | 'done'
const ORDER: Step[] = ['who', 'code', 'pin']
const STEPS: [string, string][] = [['Your phone', 'Phone and last 4 NIDA digits'], ['Email code', '6 digits, valid 5 minutes'], ['New PIN', 'Other devices are signed out']]
const BTN = 'h-[52px] text-[15px] shadow-[0_10px_20px_-10px_rgba(37,99,235,0.7)]'
const pinSchema = newPinSchema()

/** Reset your PIN (customers): phone + last 4 NIDA digits, a code by email, a new PIN. Agents and staff ask an administrator. */
export default function ForgotPinPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('who')
  const [phone, setPhone] = useState('')
  const [nidaLast4, setNidaLast4] = useState('')
  const [code, setCode] = useState('')
  const [resendIn, setResendIn] = useState(60)
  const [resending, setResending] = useState(false)
  const [pinVisible, setPinVisible] = useState(false)

  useEffect(() => {
    if (step !== 'code' || resendIn <= 0) return
    const t = window.setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => window.clearTimeout(t)
  }, [step, resendIn])

  /** Always the same answer from the server, so the screen moves on whether or not the details matched. */
  async function requestCode(p: string, n: string): Promise<boolean> {
    try {
      await api('/auth/forgot-pin', { method: 'POST', anonymous: true, body: { phone: toE164Tz(p), nidaLast4: n } })
      toast.success('Check your email', { description: 'If these details match an account, we sent a code to the email on file.' })
      return true
    } catch (err) {
      reportError(err, 'Could not send the code')
      return false
    }
  }

  const whoForm = useFormik({
    initialValues: { phone, nidaLast4 },
    validationSchema: forgotSchema,
    onSubmit: async (v) => {
      if (await requestCode(v.phone, v.nidaLast4)) { setPhone(v.phone); setNidaLast4(v.nidaLast4); setCode(''); setResendIn(60); setStep('code') }
    },
  })

  const codeForm = useFormik({
    initialValues: { code },
    validationSchema: codeSchema,
    enableReinitialize: true,
    onSubmit: async (v, { setFieldError, setFieldValue }) => {
      try {
        await api('/otp/verify', { method: 'POST', anonymous: true, body: { phone: toE164Tz(phone), otp: v.code } })
        setCode(v.code); setStep('pin')
      } catch (err) {
        void setFieldValue('code', '', false)
        setFieldError('code', reportError(err, 'Code not accepted', 'Could not check the code.'))
      }
    },
  })

  const pinForm = useFormik({
    initialValues: { pin: '', pin2: '' },
    validationSchema: pinSchema,
    onSubmit: async (v, { resetForm }) => {
      try {
        await api('/auth/reset-pin', { method: 'POST', anonymous: true, body: { phone: toE164Tz(phone), otp: code, newPin: v.pin } })
        resetForm(); setCode(''); setStep('done')
        toast.success('PIN reset', { description: 'Other devices were signed out.' })
      } catch (err) {
        const msg = reportError(err, 'PIN not reset')
        // The code stopped working (expired, used up): go back to ask for a fresh one.
        if (err instanceof ApiError && /code|expired|attempts/i.test(msg)) { resetForm(); setCode(''); setStep('who') }
      }
    },
  })

  async function resend() {
    if (resendIn > 0 || resending) return
    setResending(true)
    if (await requestCode(phone, nidaLast4)) { void codeForm.setFieldValue('code', '', false); setResendIn(60) }
    setResending(false)
  }

  const idx = ORDER.indexOf(step)
  const sideSteps: SideStep[] = STEPS.map(([label, sub], i) => ({ label, sub, number: i + 1, state: step === 'done' || i < idx ? 'done' : i === idx ? 'current' : 'todo' }))
  const side: AuthSide = {
    title: 'Get back into your wallet.',
    body: 'Confirm it’s you with your phone, then set a new PIN. Your money stays where it is.',
    steps: step === 'done' ? undefined : sideSteps,
    note: { title: 'WalletPesa will never call you for this code.', text: 'Don’t share it with anyone, including agents and staff.' },
  }

  const rules = [...pinRules(pinForm.values.pin), { text: 'Both entries match', ok: pinForm.values.pin.length === 4 && pinForm.values.pin === pinForm.values.pin2 }]
  const submitted = pinForm.submitCount > 0
  const pinErr = pinForm.errors.pin && isWeakPin(pinForm.values.pin) ? WEAK_PIN_MESSAGE : pinForm.errors.pin
  const pin1 = bind(pinForm, 'pin')
  const pin2 = bind(pinForm, 'pin2')
  const codeField = bind(codeForm, 'code')

  return (
    <AuthShell cta="login" side={side}>
      <div className="mx-auto flex w-full max-w-[420px] flex-col gap-5">
        {step !== 'done' && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5" aria-hidden="true">{ORDER.map((s, i) => <span key={s} className={`h-[5px] flex-1 rounded-full ${i <= idx ? 'bg-brand' : 'bg-line'}`} />)}</div>
            <span className="text-[13px] font-bold text-brand-dark">Step {idx + 1} of 3: {STEPS[idx][0]}</span>
          </div>
        )}

        {step === 'who' && (
          <form onSubmit={whoForm.handleSubmit} noValidate className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">Reset your PIN</h1>
              <p className="text-[15px] text-slate-600">We’ll email a 6-digit code to the address on your wallet.</p></div>
            <PhoneField id="fp-phone" {...bind(whoForm, 'phone')} />
            <div className="flex flex-col gap-1.5">
              <TextField id="fp-nida" label="Last 4 digits of your NIDA number" inputMode="numeric" maxLength={4} placeholder="0000" autoComplete="off"
                {...bind(whoForm, 'nidaLast4')} onChange={(v) => bind(whoForm, 'nidaLast4').onChange(digitsOf(v).slice(0, 4))}
                hint="A second check, so a stolen SIM alone can’t reset your PIN." />
            </div>
            <Button type="submit" block loading={whoForm.isSubmitting} className={BTN}>Send code</Button>
            <p className="text-center text-sm text-slate-600">Remembered it? <Link to="/login" className="font-semibold text-brand-dark no-underline hover:underline">Log in</Link></p>
            <p className="rounded-xl border border-line bg-surface px-3.5 py-3 text-[13px] leading-normal text-slate-600">Agents and staff: ask your administrator to reset your PIN.</p>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={codeForm.handleSubmit} noValidate className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">Enter the code</h1>
              <p className="text-[15px] text-slate-600">If these details match an account, we sent a code to the email on file for {groupedTz(phone)}. <button type="button" onClick={() => setStep('who')} className="font-semibold text-brand-dark hover:underline">Change</button></p></div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="fp-code" className="text-sm font-semibold">6-digit code</label>
              <input id="fp-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codeField.value} onChange={(e) => codeField.onChange(digitsOf(e.target.value).slice(0, 6))} placeholder="••••••"
                aria-invalid={codeField.error ? true : undefined} aria-describedby="fp-code-err"
                className={`h-[60px] w-full rounded-xl border bg-white px-4 text-center text-[26px] font-extrabold tracking-[0.5em] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${codeField.error ? 'border-[#DC2626]' : 'border-slate-300 focus-visible:border-brand'}`} />
              <FieldError id="fp-code-err">{codeField.error}</FieldError>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>5 tries · expires in 5 min</span>
              <button type="button" onClick={() => void resend()} disabled={resendIn > 0 || resending} className={`font-semibold ${resendIn > 0 ? 'text-slate-400' : 'text-brand-dark hover:underline'}`}>
                {resendIn > 0 ? `Resend in ${Math.floor(resendIn / 60)}:${String(resendIn % 60).padStart(2, '0')}` : 'Resend code'}
              </button>
            </div>
            <Button type="submit" block loading={codeForm.isSubmitting} className={BTN}>Verify code</Button>
          </form>
        )}

        {step === 'pin' && (
          <form onSubmit={pinForm.handleSubmit} noValidate className="flex flex-col gap-[18px]">
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">Choose a new PIN</h1>
              <p className="text-[15px] text-slate-600">4 digits. You’ll use it to sign in and approve every payment.</p></div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <PinField label="New PIN" {...pin1} error={pin1.error ? ' ' : ''} autoComplete="new-password" visible={pinVisible} onToggleVisible={() => setPinVisible((x) => !x)} />
              <PinField label="Type it again" {...pin2} error={pin2.error ? ' ' : ''} autoComplete="new-password" visible={pinVisible} onToggleVisible={() => setPinVisible((x) => !x)} />
            </div>
            <ul aria-label="PIN rules" className="m-0 flex list-none flex-col gap-1.5 rounded-xl border border-line bg-surface p-3.5 text-[13px]">
              {rules.map((r) => {
                const started = pinForm.values.pin.length > 0 || submitted
                return <li key={r.text} className={`flex items-center gap-2 ${!started ? 'text-slate-600' : r.ok ? 'text-green-700' : 'text-red-700'}`}>
                  <b aria-hidden="true" className="w-4 text-center">{r.ok ? '✓' : submitted ? '✕' : '•'}</b>{r.text}</li>
              })}
            </ul>
            <FieldError id="fp-pin-err">{submitted ? pinErr || pinForm.errors.pin2 || '' : ''}</FieldError>
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-3.5 py-3 text-[13px] leading-normal text-orange-900">For your safety, every other device is signed out after the reset, and we email you to confirm.</div>
            <Button type="submit" block loading={pinForm.isSubmitting} className={BTN}>Reset PIN</Button>
          </form>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-start gap-[18px]">
            <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-3xl text-green-600">✓</span>
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">New PIN set</h1>
              <p className="text-[15px] leading-normal text-slate-600">We signed out every other device and emailed you to confirm. Log in with your new PIN.</p></div>
            <div className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[13px] leading-normal text-slate-600">Didn’t do this? Call support right away and we’ll lock your wallet while we check.</div>
            <Button type="button" block onClick={() => navigate('/login')} className={BTN}>Log in</Button>
          </div>
        )}
      </div>
    </AuthShell>
  )
}
