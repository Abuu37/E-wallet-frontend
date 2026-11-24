import { CheckCircle2, IdCard, ScanFace, ShieldCheck, XCircle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePlaidLink } from 'react-plaid-link'
import { ApiError, api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { formatTzs } from '../../shared/lib/money'
import { Button, ErrorState, LoadingState } from '../../shared/ui/controls'

interface Limits { perPayment: number | string; daily: number | string; maxBalance: number | string }
export interface KycStatus {
  status: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED'
  tier: 'BASIC' | 'VERIFIED'
  perPaymentLimit: number | string
  dailyLimit: number | string
  maxBalance: number | string
  basic: Limits
  verified: Limits
  sandbox: boolean
}

type Phase = 'idle' | 'opening' | 'checking' | 'timeout'
const POLL_MS = 3000
const POLL_LIMIT = 40 // about two minutes

const STEPS = [
  { icon: IdCard, title: 'Photograph your ID', sub: 'NIDA card or passport, front and back' },
  { icon: ScanFace, title: 'Take a quick selfie', sub: 'So we know it is really you' },
  { icon: ShieldCheck, title: 'Get your result', sub: 'Usually within a minute' },
]

/** Mounts only once a link token exists, opens Plaid's secure window, and reports how it ended. */
function PlaidLauncher({ token, onSuccess, onExit }: { token: string; onSuccess: () => void; onExit: (message: string | null) => void }) {
  const { open, ready } = usePlaidLink({
    token,
    onSuccess: () => onSuccess(),
    onExit: (error) => onExit(error ? 'Verification was interrupted. You can try again.' : null),
  })
  const opened = useRef(false)
  useEffect(() => {
    if (ready && !opened.current) { opened.current = true; open() }
  }, [ready, open])
  return null
}

function LimitCard({ title, limits, dark }: { title: string; limits: Limits; dark?: boolean }) {
  const rows: [string, number | string][] = [['Per payment', limits.perPayment], ['Per day', limits.daily], ['Max balance', limits.maxBalance]]
  return (
    <div className={`flex flex-col gap-2 rounded-[18px] p-3.5 ${dark ? 'bg-ink text-white' : 'border border-line'}`}>
      <span className={`text-[13px] font-extrabold ${dark ? 'text-accent' : 'text-slate-600'}`}>{title}</span>
      {rows.map(([label, value]) => (
        <div key={label} className="flex flex-col">
          <span className={`text-[13px] ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
          <span className="text-lg font-extrabold">{formatTzs(value, { symbol: false })}</span>
        </div>
      ))}
    </div>
  )
}

export default function VerifyIdentityPage() {
  const status = useApi<KycStatus>((signal) => api('/kyc/status', { signal }), [])
  const [phase, setPhase] = useState<Phase>('idle')
  const [token, setToken] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const polls = useRef(0)

  const finish = useCallback(() => { setToken(null); status.reload() }, [status])

  async function start() {
    setMessage(null); setPhase('opening')
    try {
      const { linkToken } = await api<{ linkToken: string }>('/kyc/plaid/link-token', { method: 'POST' })
      setToken(linkToken)
    } catch (err) {
      setPhase('idle')
      setMessage(err instanceof ApiError ? err.message : 'Could not start verification.')
    }
  }

  // After Plaid's window closes successfully, ask the server to read the result, then keep checking while it is pending.
  async function onLinkSuccess() {
    setToken(null); setPhase('checking'); polls.current = 0
    try {
      const result = await api<KycStatus>('/kyc/plaid/complete', { method: 'POST' })
      if (result.status !== 'PENDING') { setPhase('idle'); status.reload() }
    } catch (err) {
      setPhase('idle')
      setMessage(err instanceof ApiError ? err.message : 'Could not check your verification.')
    }
  }

  useEffect(() => {
    if (phase !== 'checking') return
    const timer = window.setInterval(async () => {
      polls.current += 1
      try {
        const latest = await api<KycStatus>('/kyc/status')
        if (latest.status === 'VERIFIED' || latest.status === 'FAILED') { setPhase('idle'); status.reload() }
        else if (polls.current >= POLL_LIMIT) { setPhase('timeout') }
      } catch { /* keep trying until the limit */ }
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [phase, status])

  if (status.loading && !status.data) return <LoadingState />
  if (status.error && !status.data) return <ErrorState error={status.error} onRetry={status.reload} />
  const s = status.data!
  const multiple = Math.round(Number(s.verified.perPayment) / Number(s.basic.perPayment))

  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 tabular-nums">
      {token && <PlaidLauncher token={token} onSuccess={() => void onLinkSuccess()} onExit={(m) => { finish(); setPhase('idle'); setMessage(m) }} />}

      <div className="flex items-center justify-between">
        <Link to="/app" className="text-sm font-bold text-brand-dark">← Home</Link>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">Demo · Plaid Sandbox</span>
      </div>

      {s.status === 'VERIFIED' ? (
        <section aria-label="Verified" className="flex flex-col items-start gap-3 rounded-3xl bg-teal-50 p-6">
          <CheckCircle2 aria-hidden="true" className="text-teal-700" size={36} />
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight">You are verified.</h1>
          <p className="text-[15px] text-slate-700">Your limits are now: {formatTzs(s.perPaymentLimit)} per payment, {formatTzs(s.dailyLimit)} per day, and a balance of up to {formatTzs(s.maxBalance)}.</p>
          <Link to="/app" className="inline-flex h-12 items-center rounded-full bg-brand px-6 font-bold text-white hover:bg-brand-dark">Back to my wallet</Link>
        </section>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <h1 className="text-[28px] font-extrabold leading-[1.1] tracking-tight">Verify once.<br />Send up to {multiple}× more.</h1>
            <p className="text-[15px] leading-relaxed text-slate-600">Takes about 2 minutes with your ID and a selfie.</p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <LimitCard title="Basic · now" limits={s.basic} />
            <LimitCard title="Verified" limits={s.verified} dark />
          </div>

          <ol className="m-0 flex list-none flex-col p-0">
            {STEPS.map(({ icon: Icon, title, sub }) => (
              <li key={title} className="flex items-center gap-3.5 border-t border-slate-100 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand-dark"><Icon aria-hidden="true" size={20} /></span>
                <span className="flex flex-col"><b className="text-[15px]">{title}</b><span className="text-[13px] text-slate-600">{sub}</span></span>
              </li>
            ))}
          </ol>

          {s.status === 'FAILED' && phase === 'idle' && (
            <div role="alert" className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-900">
              <XCircle aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
              <span><b>We could not verify you.</b> Your limits have not changed. Check your details match your ID and try again.</span>
            </div>
          )}
          {phase === 'checking' && (
            <div role="status" aria-live="polite" className="rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-brand-dark">Checking your ID… this usually takes under a minute.</div>
          )}
          {phase === 'timeout' && (
            <div role="status" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">This is taking longer than usual. Your result will appear here when it is ready; you can leave this page and come back.</div>
          )}
          {message && <p role="alert" className="text-center text-sm font-medium text-[#BE123C]">{message}</p>}

          <div className="mt-2 flex flex-col gap-2.5">
            <p className="text-center text-xs leading-relaxed text-slate-600">Verification runs in Plaid&apos;s secure window. WalletPesa stores your result, not your photos.</p>
            <Button block loading={phase === 'opening' || phase === 'checking'} disabled={phase === 'timeout'} onClick={() => void start()} className="h-[54px] rounded-[14px] text-base">
              {s.status === 'FAILED' ? 'Try again' : 'Start verification'}
            </Button>
            <Link to="/app" className="py-2 text-center text-sm font-bold text-brand-dark">Not now</Link>
          </div>
        </>
      )}
    </div>
  )
}
