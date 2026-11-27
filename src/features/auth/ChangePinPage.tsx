import { useFormik } from 'formik'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as yup from 'yup'
import { ApiError, api } from '../../shared/api/client'
import { useSession } from '../../shared/auth/context'
import { WEAK_PIN_MESSAGE, isWeakPin } from '../../shared/lib/pin'
import { Button } from '../../shared/ui/controls'
import { reportError, toast } from '../../shared/ui/toast'
import { AuthShell, type AuthSide } from './AuthShell'
import { FieldError, PinField } from './authFields'
import { bind } from './bind'
import { pinRules } from './schemas'

const schema = yup.object({
  current: yup.string().default('').required('Enter your one-time PIN').length(4, 'Your one-time PIN has 4 digits'),
  pin: yup.string().default('').test('strong', 'Choose a PIN that passes every rule above.', (v) => pinRules(v ?? '').every((r) => r.ok) && !isWeakPin(v ?? '')),
  pin2: yup.string().default('').test('match', 'The two PINs don’t match.', (v, ctx) => v === ctx.parent.pin),
})

const SIDE: AuthSide = {
  title: 'Make this PIN your own.',
  body: 'You signed in with a one-time PIN. Replace it with a PIN only you know before you continue.',
  bullets: ['4 digits, nothing guessable', 'You will use it to sign in and approve payments', 'Nobody at WalletPesa will ever ask for it'],
  note: { title: 'You will sign in again', text: 'After you save your new PIN we take you back to the sign-in page.' },
}

/** Forced for staff and agents onboarded with a one-time PIN; also reachable as a normal PIN change. */
export default function ChangePinPage() {
  const { signOut } = useSession()
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  const f = useFormik({
    initialValues: { current: '', pin: '', pin2: '' },
    validationSchema: schema,
    onSubmit: async (v, { setFieldValue }) => {
      try {
        await api('/auth/change-pin', { method: 'POST', body: { currentPin: v.current, newPin: v.pin } })
      } catch (err) {
        reportError(err, 'PIN not changed', 'Could not change your PIN.')
        // Most likely the one-time PIN was mistyped: ask for it again, keep what was chosen.
        if (err instanceof ApiError) void setFieldValue('current', '', false)
        return
      }
      // The server ended every session on a PIN change. Clear this one too, then go to sign in.
      await signOut()
      toast.success('PIN changed', { description: 'Sign in again with your new PIN.' })
      navigate('/login', { replace: true, state: null })
    },
  })

  const rules = [...pinRules(f.values.pin), { text: 'Both entries match', ok: f.values.pin.length === 4 && f.values.pin === f.values.pin2 }]
  const submitted = f.submitCount > 0
  const current = bind(f, 'current')
  const pin1 = bind(f, 'pin')
  const pin2 = bind(f, 'pin2')
  const pinErr = f.errors.pin && isWeakPin(f.values.pin) ? WEAK_PIN_MESSAGE : f.errors.pin

  return (
    <AuthShell cta="login" side={SIDE}>
      <form onSubmit={f.handleSubmit} noValidate className="mx-auto flex w-full max-w-[420px] flex-col gap-[18px]">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[30px] font-extrabold tracking-tight">Set your new PIN</h1>
          <p className="text-[15px] text-slate-600">Enter the one-time PIN we sent you, then choose a PIN of your own.</p>
        </div>

        <PinField label="One-time PIN" {...current} autoComplete="current-password" visible={visible} onToggleVisible={() => setVisible((x) => !x)} />

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <PinField label="New PIN" {...pin1} error={pin1.error ? ' ' : ''} autoComplete="new-password" visible={visible} onToggleVisible={() => setVisible((x) => !x)} />
          <PinField label="Confirm new PIN" {...pin2} error={pin2.error ? ' ' : ''} autoComplete="new-password" visible={visible} onToggleVisible={() => setVisible((x) => !x)} />
        </div>

        <ul aria-label="PIN rules" className="m-0 flex list-none flex-col gap-1.5 rounded-xl border border-line bg-surface p-3.5 text-[13px]">
          {rules.map((r) => {
            const started = f.values.pin.length > 0 || submitted
            return <li key={r.text} className={`flex items-center gap-2 ${!started ? 'text-slate-600' : r.ok ? 'text-green-700' : 'text-red-700'}`}>
              <b aria-hidden="true" className="w-4 text-center">{r.ok ? '✓' : submitted ? '✕' : '•'}</b>{r.text}</li>
          })}
        </ul>
        <FieldError id="cp-pin-err">{submitted ? pinErr || f.errors.pin2 || '' : ''}</FieldError>

        <Button type="submit" block loading={f.isSubmitting} className="h-[52px] text-[15px] shadow-[0_10px_20px_-10px_rgba(37,99,235,0.7)]">Save new PIN</Button>
        <p className="text-center text-xs text-slate-400">WalletPesa staff will never ask for your PIN.</p>
      </form>
    </AuthShell>
  )
}
