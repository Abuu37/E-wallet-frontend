import { useFormik } from 'formik'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../shared/api/client'
import { useSession } from '../../shared/auth/context'
import { homePathFor } from '../../shared/auth/types'
import { toE164Tz } from '../../shared/lib/phone'
import { Button } from '../../shared/ui/controls'
import { reportError, toast } from '../../shared/ui/toast'
import { AuthShell } from './AuthShell'
import { PhoneField, PinField } from './authFields'
import { bind } from './bind'
import { signInSchema } from './schemas'

/** Wrong phone and wrong PIN look the same on purpose. */
const WRONG = 'Wrong phone number or PIN.'

export default function SignInPage() {
  const { signIn } = useSession()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }
  // Set after the server rejects the credentials, cleared as soon as the person edits either field.
  const [rejected, setRejected] = useState(false)

  const f = useFormik({
    initialValues: { phone: '', pin: '' },
    validationSchema: signInSchema,
    validateOnChange: true,
    onSubmit: async (values, { setFieldValue }) => {
      setRejected(false)
      try {
        const session = await signIn(toE164Tz(values.phone), values.pin)
        toast.success('Signed in')
        navigate(session.mustChangePin ? '/change-pin' : location.state?.from ?? homePathFor(session.roles), { replace: true })
      } catch (err) {
        void setFieldValue('pin', '', false)
        if (err instanceof ApiError && err.status === 401 && /invalid credentials/i.test(err.message)) {
          setRejected(true)
          toast.error('Could not sign in', { description: WRONG })
        } else {
          reportError(err, 'Could not sign in')
        }
      }
    },
  })

  const phone = bind(f, 'phone')
  const pin = bind(f, 'pin')

  return (
    <AuthShell cta="login" side={{
      title: 'One wallet for every payment.',
      body: 'Send money, withdraw at agents and keep every receipt, from any browser.',
      bullets: ['See the fee before you enter your PIN', 'Withdraw cash at any WalletPesa agent', 'Your PIN never leaves your hands: not agents, not staff'],
      note: { title: 'Agents and staff sign in here too', text: 'Same phone number and PIN. We open your account, agent portal or staff console for you.' },
    }}>
      <form onSubmit={f.handleSubmit} noValidate className="mx-auto flex w-full max-w-[420px] flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[30px] font-extrabold tracking-tight">Welcome back</h1>
          <p className="text-[15px] text-slate-600">Sign in with your phone number and PIN.</p>
        </div>

        <PhoneField id="si-phone" {...phone} onChange={(v) => { setRejected(false); phone.onChange(v) }} error={phone.error || (rejected ? ' ' : '')} />
        <PinField label="PIN" {...pin} onChange={(v) => { setRejected(false); pin.onChange(v) }} error={pin.error || (rejected ? WRONG : '')} autoComplete="current-password" withLock
          aside={<Link to="/forgot-pin" className="text-sm font-semibold text-brand-dark no-underline hover:underline">Forgot PIN?</Link>} />

        <Button type="submit" block loading={f.isSubmitting} className="h-[52px] text-[15px] shadow-[0_10px_20px_-10px_rgba(37,99,235,0.7)]">Log in</Button>
        <p className="text-center text-sm text-slate-600">Don&apos;t have a wallet? <Link to="/register" className="font-semibold text-brand-dark no-underline hover:underline">Register</Link></p>
        <p className="text-center text-xs text-slate-400">WalletPesa staff will never ask for your PIN.</p>
      </form>
    </AuthShell>
  )
}
