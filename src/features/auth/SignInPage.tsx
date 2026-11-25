import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../shared/api/client'
import { useSession } from '../../shared/auth/context'
import { homePathFor } from '../../shared/auth/types'
import { isTzMobile, tzDigits, toE164Tz } from '../../shared/lib/phone'
import { Button } from '../../shared/ui/controls'
import { toast } from '../../shared/ui/toast'
import { AuthShell } from './AuthShell'
import { PhoneField, PinField } from './authFields'

/** What the person sees for a rejected sign-in. Wrong phone and wrong PIN look the same on purpose. */
function messageFor(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401 && /invalid credentials/i.test(err.message)) return 'Wrong phone number or PIN.'
    return err.message
  }
  return 'Could not sign in. Please try again.'
}

export default function SignInPage() {
  const { signIn } = useSession()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [shown, setShown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const phoneErr = !shown ? '' : !tzDigits(phone) ? 'Enter your phone number' : !isTzMobile(phone) ? 'Use a Tanzanian mobile number: 9 digits starting with 6 or 7' : ''
  const pinErr = !shown ? '' : !pin ? 'Enter your PIN' : pin.length !== 4 ? 'Your PIN has 4 digits' : ''

  async function submit(e: FormEvent) {
    e.preventDefault()
    setShown(true)
    if (busy || !isTzMobile(phone) || pin.length !== 4) return
    setBusy(true)
    setError(null)
    try {
      const session = await signIn(toE164Tz(phone), pin)
      toast.success('Signed in')
      navigate(session.mustChangePin ? '/change-pin' : location.state?.from ?? homePathFor(session.roles), { replace: true })
    } catch (err) {
      setPin('')
      setShown(false)
      const msg = messageFor(err)
      setError(msg)
      toast.error('Could not sign in', { description: msg })
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell cta="login" side={{
      title: 'One wallet for every payment.',
      body: 'Send money, withdraw at agents and keep every receipt, from any browser.',
      bullets: ['See the fee before you enter your PIN', 'Withdraw cash at any WalletPesa agent', 'Your PIN never leaves your hands: not agents, not staff'],
      note: { title: 'Agents and staff sign in here too', text: 'Same phone number and PIN. We open your account, agent portal or staff console for you.' },
    }}>
      <form onSubmit={submit} noValidate className="mx-auto flex w-full max-w-[420px] flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-[30px] font-extrabold tracking-tight">Welcome back</h1>
          <p className="text-[15px] text-slate-600">Sign in with your phone number and PIN.</p>
        </div>

        {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-semibold leading-normal text-red-800">{error}</div>}

        <PhoneField id="si-phone" value={phone} onChange={(v) => { setPhone(v); setError(null) }} error={phoneErr || (error ? ' ' : '')} />
        <PinField label="PIN" value={pin} onChange={(v) => { setPin(v); setError(null) }} error={pinErr || (error ? ' ' : '')} autoComplete="current-password" withLock
          aside={<Link to="/forgot-pin" className="text-sm font-semibold text-brand-dark no-underline hover:underline">Forgot PIN?</Link>} />

        <Button type="submit" block loading={busy} className="h-[52px] text-[15px] shadow-[0_10px_20px_-10px_rgba(37,99,235,0.7)]">Log in</Button>
        <p className="text-center text-sm text-slate-600">Don&apos;t have a wallet? <Link to="/register" className="font-semibold text-brand-dark no-underline hover:underline">Register</Link></p>
        <p className="text-center text-xs text-slate-400">WalletPesa staff will never ask for your PIN.</p>
      </form>
    </AuthShell>
  )
}
