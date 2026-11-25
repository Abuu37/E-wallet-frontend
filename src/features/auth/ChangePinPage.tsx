import { ChevronLeft } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { useSession } from '../../shared/auth/context'
import { isWeakPin } from '../../shared/lib/pin'
import { Button } from '../../shared/ui/controls'
import { PinPad } from '../../shared/ui/PinPad'
import { reportError, toast } from '../../shared/ui/toast'

type Phase = 'current' | 'create' | 'confirm'
const ORDER: Phase[] = ['current', 'create', 'confirm']

// Copy follows the app boards A06 "Create PIN" and A07 "Confirm PIN"; the first step is ours (the one-time PIN).
const COPY: Record<Phase, { title: string; body: string; pad: string }> = {
  current: { title: 'Enter your one-time PIN', body: 'Use the PIN we sent you. You will replace it in the next step.', pad: 'Enter your one-time PIN' },
  create: { title: 'Create a 4-digit PIN', body: 'You will use it to sign in and approve payments.', pad: 'Create a 4-digit PIN' },
  confirm: { title: 'Type it again', body: 'Just to be sure.', pad: 'Type the new PIN again' },
}

/** Forced for staff and agents onboarded with a one-time PIN; also reachable as a normal PIN change. */
export default function ChangePinPage() {
  const { endSession } = useSession()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('current')
  const [current, setCurrent] = useState('')
  const [created, setCreated] = useState('')
  const [again, setAgain] = useState('')
  const [hint, setHint] = useState<{ text: string; bad: boolean } | null>(null)
  const [shake, setShake] = useState(0)
  const [busy, setBusy] = useState(false)

  const idx = ORDER.indexOf(phase)
  const value = phase === 'current' ? current : phase === 'create' ? created : again
  const ready = phase === 'confirm' && again.length === 4 && again === created

  function fail(text: string) { setHint({ text, bad: true }); setShake((n) => n + 1) }

  function onPin(v: string) {
    setHint(null)
    if (phase === 'current') {
      setCurrent(v)
      if (v.length === 4) setPhase('create')
    } else if (phase === 'create') {
      if (v.length === 4 && isWeakPin(v)) { setCreated(''); fail('Too easy to guess. Try another.'); return }
      setCreated(v)
      if (v.length === 4) setPhase('confirm')
    } else {
      setAgain(v)
      if (v.length === 4 && v !== created) { setCreated(''); setAgain(''); setPhase('create'); fail('PINs didn’t match. Start again.') }
    }
  }

  function back() {
    setHint(null)
    if (phase === 'confirm') { setAgain(''); setCreated(''); setPhase('create') }
    else if (phase === 'create') { setCreated(''); setCurrent(''); setPhase('current') }
  }

  async function submit() {
    if (!ready || busy) return
    setBusy(true)
    try {
      await api('/auth/change-pin', { method: 'POST', body: { currentPin: current, newPin: created } })
      // The server revoked every session on a PIN change; sign in again with the new PIN.
      endSession()
      toast.success('PIN changed', { description: 'Sign in again with your new PIN.' })
      navigate('/login', { replace: true })
    } catch (err) {
      reportError(err, 'PIN not changed', 'Could not change your PIN.')
      // Most likely the one-time PIN was mistyped: start over from the first step.
      setCurrent(''); setCreated(''); setAgain(''); setPhase('current')
    } finally { setBusy(false) }
  }

  const copy = COPY[phase]
  const shown = hint ?? { text: ready ? 'Strong PIN. Tap Change PIN.' : phase === 'create' ? 'Avoid repeats and sequences like 1234.' : '', bad: false }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px),linear-gradient(160deg,#2563EB,#1D4ED8)] bg-[length:22px_22px,auto] px-4 py-8 text-ink">
      <div className="flex w-full max-w-[430px] flex-col gap-5 rounded-3xl bg-white p-6 shadow-[0_40px_80px_-30px_rgba(11,18,32,0.55)] sm:p-8">
        <div className="flex items-center justify-between">
          {idx > 0 ? (
            <button type="button" onClick={back} aria-label="Back" disabled={busy}
              className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-slate-100 text-ink hover:bg-slate-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
              <ChevronLeft aria-hidden="true" size={20} strokeWidth={2.2} />
            </button>
          ) : <span className="h-11 w-11" aria-hidden="true" />}
          <span className="text-[13px] font-bold text-slate-600">Step {idx + 1} of 3</span>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">{ORDER.map((p, i) => <span key={p} className={`h-1 flex-1 rounded ${i <= idx ? 'bg-brand' : 'bg-line'}`} />)}</div>

        <div className="flex flex-col gap-2">
          <h1 className="text-[30px] font-extrabold leading-tight tracking-tight">{copy.title}</h1>
          <p className="text-[15px] leading-normal text-slate-600">{copy.body}</p>
          {phase === 'current' && <p className="text-[13px] text-muted">You must set a new PIN before you continue.</p>}
        </div>

        <div key={shake} className={shake ? 'animate-[otp-shake_.4s] motion-reduce:animate-none' : ''}>
          <PinPad value={value} onChange={onPin} label={copy.pad} disabled={busy} />
        </div>
        <p role="status" aria-live="polite" className={`min-h-[18px] text-center text-[13px] ${shown.bad ? 'text-[#B91C1C]' : ready ? 'text-teal-700' : 'text-slate-600'}`}>{shown.text}</p>

        <Button block loading={busy} disabled={!ready} onClick={() => void submit()}
          className={`h-[54px] rounded-[14px] text-base ${ready ? '' : '!bg-slate-200 !text-slate-500'}`}>Change PIN</Button>
      </div>
    </main>
  )
}
