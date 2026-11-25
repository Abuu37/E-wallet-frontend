import { Check, Copy, Minus } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { useSession } from '../../shared/auth/context'
import { useT } from '../../shared/i18n'
import { formatDate } from '../../shared/lib/dates'
import { isWeakPin } from '../../shared/lib/pin'
import { maskEmail, maskPhone } from '../../shared/lib/phone'
import { reportError, toast } from '../../shared/ui/toast'
import { Button, ComingSoon, ErrorState, LoadingState } from '../../shared/ui/controls'
import { PageHeader } from '../../shared/ui/console'
import { DetailRow, StatusBadge } from '../../shared/ui/SidePanel'
import type { AgentOverview } from './AgentHome'

interface Profile {
  agentNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  email: string
  phone: string
  gender: string | null
  dateOfBirth: string | null
  regionName: string | null
  districtName: string | null
  floatAccount: { accountNumber: string } | null
  commissionAccount: { accountNumber: string } | null
  status: string
}

type Tab = 'profile' | 'security' | 'notifications' | 'language'
const TABS: [Tab, string][] = [['profile', 'Business profile'], ['security', 'PIN and devices'], ['notifications', 'Notifications'], ['language', 'Language']]
const masked = (n: string | undefined | null) => (n ? `•••• ${n.slice(-4)}` : '—')

function Card({ title, children }: { title: string; children: ReactNode }) {
  return <section aria-label={title} className="rounded-[20px] border border-line bg-white p-5"><h2 className="mb-1 text-base font-extrabold">{title}</h2>{children}</section>
}

export default function AgentSettings() {
  const [tab, setTab] = useState<Tab>('profile')
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <PageHeader title="Settings" subtitle="Your agent account, PIN, alerts and language." />
      <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="flex gap-2 overflow-x-auto md:flex-col">
          {TABS.map(([key, label]) => (
            <button key={key} type="button" aria-current={tab === key ? 'page' : undefined} onClick={() => setTab(key)}
              className={`min-h-11 whitespace-nowrap rounded-xl px-4 text-left text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${tab === key ? 'bg-ink text-white' : 'border border-line bg-white hover:bg-slate-50'}`}>{label}</button>
          ))}
        </nav>
        <div className="flex min-w-0 flex-col gap-4">
          {tab === 'profile' && <ProfileTab />}
          {tab === 'security' && <SecurityTab />}
          {tab === 'notifications' && <ComingSoon title="Notification settings" description="Choose which alerts reach you by SMS once SMS alerts launch. Until then you see everything on your dashboard." />}
          {tab === 'language' && <LanguageTab />}
        </div>
      </div>
    </div>
  )
}

function ProfileTab() {
  const profile = useApi<Profile>((signal) => api('/agents/profile', { signal }), [])
  const overview = useApi<AgentOverview>((signal) => api('/agent/dashboard/overview', { signal }), [])
  const [copied, setCopied] = useState(false)
  if ((profile.loading && !profile.data) || (overview.loading && !overview.data)) return <LoadingState />
  if (profile.error && !profile.data) return <ErrorState error={profile.error} onRetry={profile.reload} />
  const p = profile.data!

  async function copy() {
    try { await navigator.clipboard.writeText(p.agentNumber); setCopied(true); window.setTimeout(() => setCopied(false), 1800) } catch { toast.error('Could not copy') }
  }

  return (
    <>
      <section aria-label="Agent number" className="flex flex-wrap items-center gap-4 rounded-[20px] bg-ink p-5 text-white">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm font-bold text-slate-400">Your agent number</span>
          <b className="font-mono text-3xl tracking-wider">{p.agentNumber}</b>
          <span className="text-[13px] text-slate-400">Customers will use this to find you when customer withdrawals launch. They approve with their own PIN, never yours.</span>
        </div>
        <Button variant="secondary" onClick={() => void copy()}>{copied ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}{copied ? 'Copied' : 'Copy'}</Button>
      </section>

      <Card title="Business">
        <DetailRow label="Business name">{overview.data?.agentProfile.businessName ?? '—'}</DetailRow>
        <DetailRow label="Status"><StatusBadge status={p.status} /></DetailRow>
      </Card>
      <Card title="Owner">
        <DetailRow label="Name">{[p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ')}</DetailRow>
        <DetailRow label="Phone">{maskPhone(p.phone)}</DetailRow>
        <DetailRow label="Email">{maskEmail(p.email)}</DetailRow>
        <DetailRow label="Gender">{p.gender ? p.gender.charAt(0) + p.gender.slice(1).toLowerCase() : '—'}</DetailRow>
        <DetailRow label="Date of birth">{formatDate(p.dateOfBirth)}</DetailRow>
      </Card>
      <Card title="Location and accounts">
        <DetailRow label="Region">{p.regionName ?? '—'}</DetailRow>
        <DetailRow label="District">{p.districtName ?? '—'}</DetailRow>
        <DetailRow label="Float account">{masked(p.floatAccount?.accountNumber)}</DetailRow>
        <DetailRow label="Commission account">{masked(p.commissionAccount?.accountNumber)}</DetailRow>
      </Card>
      <p className="rounded-2xl bg-surface p-4 text-sm text-slate-700">These details come from your onboarding. To change your business name, TIN, location or phone, contact WalletPesa support. A staff member updates them and the change is recorded in the audit log.</p>
    </>
  )
}

function SecurityTab() {
  const { endSession } = useSession()
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 4)
  const rules: [string, boolean | null][] = [
    ['4 digits', next.length === 0 ? null : /^[0-9]{4}$/.test(next)],
    ['Not repeated or in a sequence (1111, 1234, 4321)', next.length < 4 ? null : !isWeakPin(next)],
    ['Different from your current PIN', next.length < 4 || current.length < 4 ? null : next !== current],
    ['Both new PINs match', again.length === 0 ? null : again === next],
  ]
  const ready = /^[0-9]{4}$/.test(current) && rules.every(([, ok]) => ok === true)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!ready || busy) return
    setBusy(true); setError(null)
    try {
      await api('/auth/change-pin', { method: 'POST', body: { currentPin: current, newPin: next } })
      // The server signs every device out when the PIN changes.
      endSession()
      toast.success('PIN changed', { description: 'Sign in again with your new PIN.' })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(reportError(err, 'PIN not changed', 'Could not change your PIN.'))
      setCurrent('')
    } finally { setBusy(false) }
  }

  const INPUT = 'h-[52px] w-full rounded-[14px] border border-slate-300 px-4 text-xl font-bold tracking-[0.4em] focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200'
  return (
    <>
      <form onSubmit={submit} noValidate aria-label="Change PIN" className="flex flex-col gap-4 rounded-[20px] border border-line bg-white p-6">
        <div><h2 className="text-lg font-extrabold">Change PIN</h2><span className="text-sm text-slate-600">Your PIN approves every cash-in you make. Never share it, not even with WalletPesa staff.</span></div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([['pc-cur', 'Current PIN', current, setCurrent, 'current-password'], ['pc-p1', 'New PIN', next, setNext, 'new-password'], ['pc-p2', 'Type it again', again, setAgain, 'new-password']] as const).map(([id, label, value, set, auto]) => (
            <div key={id} className="flex flex-col gap-1.5"><label htmlFor={id} className="text-sm font-semibold">{label}</label>
              <input id={id} type="password" inputMode="numeric" autoComplete={auto} maxLength={4} value={value} onChange={(e) => set(digits(e.target.value))} placeholder="••••" className={INPUT} /></div>
          ))}
        </div>
        <ul aria-label="PIN rules" className="flex flex-col gap-1.5 text-sm">
          {rules.map(([text, ok]) => (
            <li key={text} className={`flex items-center gap-2 ${ok === false ? 'font-semibold text-[#B91C1C]' : ok ? 'text-teal-700' : 'text-slate-600'}`}>
              <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">{ok ? <Check size={13} /> : ok === false ? <span className="text-xs font-bold">!</span> : <Minus size={13} />}</span>{text}
            </li>
          ))}
        </ul>
        {error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={busy} disabled={!ready}>Change PIN</Button>
          <span className="text-[13px] text-slate-600">Other devices are signed out when you change it. Forgot it? Use Forgot PIN on the sign-in page.</span>
        </div>
      </form>
      <ComingSoon title="Signed-in devices" description="A list of the devices signed in to your account, with a button to sign them out, is coming soon. Changing your PIN signs out every device now." />
    </>
  )
}

function LanguageTab() {
  const { locale, setLocale } = useT()
  const options = [['en', 'English', 'Your cash-in is complete.'], ['sw', 'Kiswahili', 'Uwekaji wako umekamilika.']] as const
  return (
    <Card title="Language">
      <p className="mb-3 text-sm text-slate-600">For this portal. SMS language will follow when SMS alerts launch.</p>
      <div role="radiogroup" aria-label="Language" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map(([code, name, sample]) => (
          <button key={code} type="button" role="radio" aria-checked={locale === code} onClick={() => setLocale(code)}
            className={`flex flex-col gap-1 rounded-2xl border p-4 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${locale === code ? 'border-brand bg-blue-50' : 'border-line hover:bg-slate-50'}`}>
            <b className="text-base">{name}</b><span className="text-sm text-slate-600">{sample}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}
