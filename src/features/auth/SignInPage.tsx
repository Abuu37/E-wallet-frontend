import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '../../shared/api/client'
import { useSession } from '../../shared/auth/context'
import { homePathFor } from '../../shared/auth/types'
import { useT } from '../../shared/i18n'
import { toE164Tz } from '../../shared/lib/phone'
import { Button } from '../../shared/ui/controls'
import { PinPad } from '../../shared/ui/PinPad'

export default function SignInPage() {
  const { signIn } = useSession()
  const { t } = useT()
  const navigate = useNavigate()
  const location = useLocation() as { state?: { from?: string } }

  const [phone, setPhone] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const phoneDigits = phone.replace(/\D/g, '')
  const ready = phoneDigits.length >= 9 && pin.length === 4

  async function submit(e?: FormEvent) {
    e?.preventDefault()
    if (!ready || busy) return
    setBusy(true)
    setError(null)
    try {
      const session = await signIn(toE164Tz(phone), pin)
      navigate(session.mustChangePin ? '/change-pin' : location.state?.from ?? homePathFor(session.roles), { replace: true })
    } catch (err) {
      setPin('')
      setError(err instanceof ApiError ? err.message : 'Could not sign in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-ink text-white">
      <form onSubmit={submit} className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-6 pb-7 pt-16">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-[26px] font-extrabold tracking-tight">{t('auth.welcomeBack')}</h1>
          <p className="text-sm text-slate-400">Sign in with your phone number and PIN.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="si-phone" className="text-sm font-semibold">{t('auth.phone')}</label>
          <div className="flex gap-2">
            <span className="flex h-12 items-center rounded-xl border border-slate-600 px-3.5 font-bold">+255</span>
            <input
              id="si-phone"
              inputMode="tel"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="712 345 678"
              className="h-12 min-w-0 flex-1 rounded-xl border border-slate-600 bg-[#111A2E] px-3.5 text-base font-semibold text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
            />
          </div>
        </div>

        <p role="alert" aria-live="assertive" className="min-h-[20px] text-center text-sm text-orange-300">{error}</p>

        <div className="mt-auto flex flex-col gap-4">
          <PinPad tone="dark" value={pin} onChange={setPin} label={t('auth.enterPin')} disabled={busy} />
          <Button type="submit" block loading={busy} disabled={!ready}>{t('auth.signIn')}</Button>
          <div className="flex justify-between text-sm font-bold">
            <Link to="/forgot-pin" className="text-blue-300 hover:text-white">{t('auth.forgotPin')}</Link>
            <Link to="/register" className="text-blue-300 hover:text-white">{t('auth.noWallet')}</Link>
          </div>
        </div>
      </form>
    </main>
  )
}
