import { useFormik } from 'formik'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { useSession } from '../../shared/auth/context'
import { formatTzs } from '../../shared/lib/money'
import { groupedTz, maskEmail, toE164Tz } from '../../shared/lib/phone'
import { Button } from '../../shared/ui/controls'
import { reportError, toast } from '../../shared/ui/toast'
import { AuthShell, type AuthSide, type SideStep } from './AuthShell'
import { FieldError, PhoneField, PinField, TextField } from './authFields'
import { bind } from './bind'
import { codeSchema, detailsSchema, digitsOf, newPinSchema, pinRules, registerPhoneSchema, type DetailsValues } from './schemas'

type Step = 'phone' | 'details' | 'code' | 'pin' | 'done'
const ORDER: Step[] = ['phone', 'details', 'code', 'pin', 'done']
const BTN = 'h-[52px] text-[15px]'

const EMPTY: DetailsValues = { first: '', middle: '', last: '', nida: '', dob: '', email: '', address: '' }

const SIDE: Record<Step, [string, string]> = {
  phone: ['Money that moves like a message.', 'Send, receive and withdraw cash at any agent. Open a wallet with just your phone and NIDA card.'],
  details: ['We check it’s really you.', 'The names on your wallet must match your NIDA card, so people you pay see your real name.'],
  code: ['One code, one phone.', 'Your wallet is tied to this account. We ask for a code whenever you reset your PIN.'],
  pin: ['Only you approve payments.', 'We keep only a scrambled copy of your PIN, so nobody at WalletPesa can see or use it.'],
  done: ['Welcome to WalletPesa.', 'Add money at any agent, then send to anyone with a phone number.'],
}
const STEP_LABELS: [Step, string, string][] = [['details', 'About you', 'Name, NIDA, date of birth'], ['code', 'Verify your account', '6-digit code'], ['pin', 'Create your PIN', '4 digits, only you know it']]

/** Server field names, mapped to the form's own. */
const SERVER_FIELD: Record<string, keyof DetailsValues> = { firstName: 'first', middleName: 'middle', lastName: 'last', nidaNumber: 'nida', dateOfBirth: 'dob', email: 'email', address: 'address' }

/** A technical login name the person never sees or types: their name plus random digits. */
function makeUsername(v: DetailsValues): string {
  const base = `${v.first}${v.last}`.toLowerCase().replace(/[^a-z]/g, '').slice(0, 20) || 'user'
  return `${base}${Math.floor(1000 + Math.random() * 9000)}`
}

interface KycLimits { basic: { perPayment: number | string; daily: number | string; maxBalance: number | string } }



export default function RegisterPage() {
  const navigate = useNavigate()
  const { signIn, status: sessionStatus } = useSession()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [v, setV] = useState<DetailsValues>(EMPTY)
  const [resendIn, setResendIn] = useState(60)
  const [resending, setResending] = useState(false)
  const [pinVisible, setPinVisible] = useState(false)
  const [accountNo, setAccountNo] = useState<string | null>(null)
  const [autoSignedIn, setAutoSignedIn] = useState(false)

  // Resend countdown while the code step is open.
  useEffect(() => {
    if (step !== 'code' || resendIn <= 0) return
    const t = window.setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => window.clearTimeout(t)
  }, [step, resendIn])

  const phoneForm = useFormik({
    initialValues: { phone: '', terms: false },
    validationSchema: registerPhoneSchema,
    onSubmit: (values) => { setPhone(values.phone); setStep('details') },
  })

  const detailsForm = useFormik({
    initialValues: v,
    validationSchema: detailsSchema,
    enableReinitialize: true,
    onSubmit: async (values, { setErrors }) => {
      const d = detailsSchema.cast(values) as DetailsValues
      try {
        let attempt = 0
        for (;;) {
          try {
            await api('/customers/register', {
              method: 'POST', anonymous: true,
              body: {
                username: makeUsername(d), firstName: d.first, middleName: d.middle || undefined, lastName: d.last,
                email: d.email, phone: toE164Tz(phone), nidaNumber: digitsOf(d.nida), dateOfBirth: d.dob, address: d.address,
              },
            })
            break
          } catch (err) {
            // The generated login name collided with someone else's: try another one.
            if (err instanceof ApiError && err.status === 409 && /username/i.test(err.message) && attempt++ < 3) continue
            throw err
          }
        }
        setV(d); setResendIn(60); setStep('code')
        toast.success('Account created', { description: `We emailed a 6-digit code to ${maskEmail(d.email)}.` })
      } catch (err) {
        const fields: Record<string, string> = {}
        if (err instanceof ApiError) {
          for (const [key, msg] of Object.entries(err.fieldErrors)) { const k = SERVER_FIELD[key]; if (k) fields[k] = msg }
          if (err.fieldErrors.phone) {
            // The phone number lives on the first step: send the person back to it.
            toast.error('That phone number was not accepted', { description: err.fieldErrors.phone })
            phoneForm.setFieldError('phone', err.fieldErrors.phone)
            setV(values); setStep('phone')
            return
          }
        }
        if (Object.keys(fields).length) {
          setErrors(fields)
          toast.error('Please check the highlighted fields', { description: Object.values(fields)[0] })
        } else reportError(err, 'Could not create your account')
      }
    },
  })

  const codeForm = useFormik({
    initialValues: { code: '' },
    validationSchema: codeSchema,
    onSubmit: async (values, { setFieldError, setFieldValue }) => {
      try {
        await api('/otp/verify', { method: 'POST', anonymous: true, body: { email: v.email, otp: values.code } })
        setStep('pin')
        toast.success('Email verified')
      } catch (err) {
        void setFieldValue('code', '', false)
        setFieldError('code', reportError(err, 'Code not accepted', 'Could not verify the code.'))
      }
    },
  })

  async function resend() {
    if (resendIn > 0 || resending) return
    setResending(true)
    try {
      await api('/otp/resend', { method: 'POST', anonymous: true, body: { email: v.email } })
      void codeForm.setFieldValue('code', '', false); setResendIn(60)
      toast.info('New code sent', { description: `Check ${maskEmail(v.email)}.` })
    } catch (err) { reportError(err, 'Could not send a new code', 'Could not send a new code.') } finally { setResending(false) }
  }

  const pinSchema = useMemo(() => newPinSchema(v.dob), [v.dob])
  const pinForm = useFormik({
    initialValues: { pin: '', pin2: '' },
    validationSchema: pinSchema,
    onSubmit: async (values) => {
      try {
        const profile = await api<{ wallet?: { accountNumber?: string } }>('/auth/set-pin', {
          method: 'POST', anonymous: true, body: { email: v.email, pin: values.pin, confirmPin: values.pin2 },
        })
        setAccountNo(profile?.wallet?.accountNumber ?? null)
        // The PIN only ever lives in this page's memory. Use it once to open the new wallet, then drop it.
        try { await signIn(toE164Tz(phone), values.pin); setAutoSignedIn(true) } catch { setAutoSignedIn(false) }
        pinForm.resetForm(); setStep('done')
        toast.success('Your wallet is ready')
      } catch (err) {
        reportError(err, 'PIN not saved', 'Could not create your PIN.')
      }
    },
  })

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

  const dCount = detailsForm.submitCount > 0 ? Object.keys(detailsForm.errors).length : 0
  const rules = pinRules(pinForm.values.pin, v.dob)
  const pinSubmitted = pinForm.submitCount > 0
  const pin1 = bind(pinForm, 'pin')
  const pin2 = bind(pinForm, 'pin2')
  const codeField = bind(codeForm, 'code')

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
          <form onSubmit={phoneForm.handleSubmit} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">Create your wallet</h1>
              <p className="text-[15px] text-slate-600">Ready in under 3 minutes. Fees are shown before you pay, every time.</p></div>
            <PhoneField id="r-phone" {...bind(phoneForm, 'phone')} hint="We’ll send a 6-digit code to check it’s really you." />
            <div className="flex flex-col gap-1">
              <label className="flex items-start gap-2.5 text-sm text-slate-700"><input type="checkbox" checked={phoneForm.values.terms} onChange={(e) => void phoneForm.setFieldValue('terms', e.target.checked)} className="mt-1 h-[18px] w-[18px] accent-brand" />
                <span>I agree to the <a href="#terms" className="font-semibold text-brand-dark">Terms</a> and <a href="#privacy" className="font-semibold text-brand-dark">Privacy policy</a>.</span></label>
              <FieldError id="r-terms-err">{phoneForm.submitCount > 0 ? phoneForm.errors.terms : ''}</FieldError>
            </div>
            <Button type="submit" block className={BTN}>Continue</Button>
            <p className="text-center text-sm text-slate-600">Already have a wallet? <Link to="/login" className="font-semibold text-brand-dark no-underline hover:underline">Log in</Link></p>
          </form>
        )}

        {step === 'details' && (
          <form onSubmit={detailsForm.handleSubmit} noValidate className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">About you</h1>
              <p className="text-[15px] text-slate-600">For {groupedTz(phone)}. Use the details on your NIDA card.</p></div>
            {dCount > 0 && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-semibold text-red-800">{`Fix ${dCount} field${dCount === 1 ? '' : 's'} to continue.`}</div>}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <TextField id="r-first" label="First name" {...bind(detailsForm, 'first')} placeholder="Asha" autoComplete="given-name" />
              <TextField id="r-last" label="Last name" {...bind(detailsForm, 'last')} placeholder="Juma" autoComplete="family-name" />
            </div>
            <TextField id="r-middle" label="Middle name" optional {...bind(detailsForm, 'middle')} autoComplete="additional-name" />
            <TextField id="r-nida" label="NIDA number" inputMode="numeric" {...bind(detailsForm, 'nida')} placeholder="19900412-12345-00001-23" hint="20 digits, printed under your photo. Dashes optional." />
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <TextField id="r-dob" label="Date of birth" type="date" {...bind(detailsForm, 'dob')} hint="You must be 18 or older." autoComplete="bday" />
              <TextField id="r-email" label="Email" type="email" inputMode="email" {...bind(detailsForm, 'email')} hint="For your code, receipts and statements." autoComplete="email" />
            </div>
            <TextField id="r-address" label="Home address" {...bind(detailsForm, 'address')} placeholder="e.g. Plot 12, Mikocheni, Dar es Salaam" autoComplete="street-address" />
            <Button type="submit" block loading={detailsForm.isSubmitting} className={BTN}>Continue</Button>
            <p className="text-center text-xs text-slate-500">We use these to keep your wallet safe and meet KYC rules.</p>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={codeForm.handleSubmit} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">Enter the code</h1>
              <p className="text-[15px] text-slate-600">Sent by email to <b className="text-ink">{maskEmail(v.email)}</b>. <button type="button" onClick={() => setStep('details')} className="font-semibold text-brand-dark hover:underline">Change details</button></p></div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="r-code" className="text-sm font-semibold">6-digit code</label>
              <input id="r-code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={codeField.value} onChange={(e) => codeField.onChange(digitsOf(e.target.value).slice(0, 6))} placeholder="••••••"
                aria-invalid={codeField.error ? true : undefined} aria-describedby="r-code-err"
                className={`h-[60px] w-full rounded-xl border bg-white px-4 text-center text-[26px] font-extrabold tracking-[0.5em] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${codeField.error ? 'border-[#DC2626]' : 'border-slate-300 focus-visible:border-brand'}`} />
              <FieldError id="r-code-err">{codeField.error}</FieldError>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>5 tries · expires in 5 min</span>
              <button type="button" onClick={() => void resend()} disabled={resendIn > 0 || resending} className={`font-semibold ${resendIn > 0 ? 'text-slate-400' : 'text-brand-dark hover:underline'}`}>
                {resendIn > 0 ? `Resend in ${Math.floor(resendIn / 60)}:${String(resendIn % 60).padStart(2, '0')}` : 'Resend code'}
              </button>
            </div>
            <div className="rounded-2xl bg-surface p-3.5 text-[13px] leading-relaxed text-slate-700">WalletPesa will never call to ask for this code. Do not share it with anyone, including agents.</div>
            <Button type="submit" block loading={codeForm.isSubmitting} className={BTN}>Verify</Button>
          </form>
        )}

        {step === 'pin' && (
          <form onSubmit={pinForm.handleSubmit} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5"><h1 className="text-[30px] font-extrabold tracking-tight">Create your PIN</h1>
              <p className="text-[15px] text-slate-600">Your PIN approves every payment. Only you know it: not agents, not WalletPesa staff.</p></div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <PinField label="4-digit PIN" {...pin1} error={pin1.error ? ' ' : ''} autoComplete="new-password" visible={pinVisible} onToggleVisible={() => setPinVisible((x) => !x)} />
              <PinField label="Repeat PIN" {...pin2} error={!pin1.error && pin2.error ? ' ' : ''} autoComplete="new-password" visible={pinVisible} onToggleVisible={() => setPinVisible((x) => !x)} />
            </div>
            <ul aria-label="PIN rules" className="m-0 flex list-none flex-col gap-1.5 p-0 text-sm">
              {rules.map((r) => {
                const started = pinForm.values.pin.length > 0
                return (
                  <li key={r.text} className={`flex items-center gap-2 ${!started ? 'text-slate-600' : r.ok ? 'text-green-700' : 'text-red-700'}`}>
                    <span aria-hidden="true" className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[11px] font-bold text-white ${!started ? 'bg-slate-300' : r.ok ? 'bg-green-600' : 'bg-red-600'}`}>{!started ? '•' : r.ok ? '✓' : '✕'}</span>{r.text}
                  </li>
                )
              })}
            </ul>
            <FieldError id="r-pin-err">{pinSubmitted ? pin1.error || pin2.error : ''}</FieldError>
            <Button type="submit" block loading={pinForm.isSubmitting} className={BTN}>Create PIN and open wallet</Button>
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
