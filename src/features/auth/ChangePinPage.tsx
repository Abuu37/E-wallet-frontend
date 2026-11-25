import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, api } from '../../shared/api/client'
import { useSession } from '../../shared/auth/context'
import { isWeakPin, WEAK_PIN_MESSAGE } from '../../shared/lib/pin'
import { Button } from '../../shared/ui/controls'
import { PinPad } from '../../shared/ui/PinPad'
import { toast } from '../../shared/ui/toast'

type Phase = 'current' | 'new' | 'again'

const COPY: Record<Phase, string> = {
  current: 'Enter your current (one-time) PIN',
  new: 'Choose a new 4-digit PIN',
  again: 'Type the new PIN again',
}

/** Forced for staff and agents onboarded with a one-time PIN; also reachable as a normal PIN change. */
export default function ChangePinPage() {
  const { endSession } = useSession()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('current')
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const value = phase === 'current' ? current : phase === 'new' ? next : again
  const set = phase === 'current' ? setCurrent : phase === 'new' ? setNext : setAgain
  const weak = phase === 'new' && next.length === 4 && isWeakPin(next)
  const mismatch = phase === 'again' && again.length === 4 && again !== next

  function advance(v: string) {
    set(v)
    setError(null)
    if (v.length !== 4) return
    if (phase === 'current') setPhase('new')
    else if (phase === 'new' && !isWeakPin(v)) setPhase('again')
  }

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await api('/auth/change-pin', { method: 'POST', body: { currentPin: current, newPin: next } })
      // The server revoked every session on a PIN change; sign in again with the new PIN.
      endSession()
      toast.success('PIN changed', { description: 'Sign in again with your new PIN.' })
      navigate('/login', { replace: true })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not change your PIN.'
      setError(msg)
      toast.error('PIN not changed', { description: msg })
      setCurrent(''); setNext(''); setAgain(''); setPhase('current')
    } finally { setBusy(false) }
  }

  return (
    <main className="min-h-screen bg-white text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-6 pb-7 pt-14">
        <h1 className="text-[28px] font-extrabold tracking-tight">Change your PIN</h1>
        <p className="text-[15px] text-slate-600">You must set a new PIN before you continue.</p>
        <PinPad value={value} onChange={advance} label={COPY[phase]} disabled={busy} />
        <p role="status" aria-live="polite" className={`min-h-[18px] text-center text-[13px] ${weak || mismatch ? 'text-[#B91C1C]' : 'text-slate-600'}`}>
          {weak ? WEAK_PIN_MESSAGE : mismatch ? 'The PINs do not match.' : COPY[phase]}
        </p>
        {error && <p role="alert" className="text-center text-sm font-medium text-[#BE123C]">{error}</p>}
        {(weak || mismatch) && <Button type="button" variant="ghost" onClick={() => { setNext(''); setAgain(''); setPhase('new') }}>Choose again</Button>}
        <Button className="mt-auto" block loading={busy} disabled={phase !== 'again' || again !== next || again.length !== 4} onClick={() => void submit()}>
          Change PIN
        </Button>
      </div>
    </main>
  )
}
