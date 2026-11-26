import { Landmark, Mail, ShieldCheck, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError, api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { useSession } from '../../shared/auth/context'
import { amountOf, formatTzs } from '../../shared/lib/money'
import { formatPhone, maskEmail } from '../../shared/lib/phone'
import { ErrorState, LoadingState } from '../../shared/ui/controls'
import { DetailRow } from '../../shared/ui/SidePanel'
import { Button } from '../../shared/ui/controls'
import { Modal } from '../../shared/ui/Modal'
import { toast } from '../../shared/ui/toast'
import { BankCard } from './banks'
import { DEMO_LABEL, bankName, type LinkedBank } from './bankTypes'
import { useLinkBank } from './useLinkBank'
import type { KycInfo, Profile, Wallet } from './types'

function Card({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2 rounded-[22px] border border-line bg-white p-6">
      <div className="mb-1 flex items-center justify-between gap-3"><h2 className="text-lg font-extrabold">{title}</h2>{aside}</div>
      {children}
    </section>
  )
}

/** Settings (W40): account and limits, profile, security, alerts. */
export default function SettingsPage() {
  const { session } = useSession()
  const wallet = useApi<Wallet>((signal) => api('/wallets/me', { signal }), [])
  const profile = useApi<Profile>((signal) => api('/customers/profile', { signal }), [])
  const kyc = useApi<KycInfo>((signal) => api('/kyc/status', { signal }), [])
  const banks = useApi<LinkedBank[]>((signal) => api('/banks', { signal }), [])
  const linker = useLinkBank(() => banks.reload())
  const [removing, setRemoving] = useState<LinkedBank | null>(null)
  const [busy, setBusy] = useState(false)

  async function remove(bank: LinkedBank) {
    setBusy(true)
    try { await api(`/banks/${bank.id}`, { method: 'DELETE' }); toast.success('Bank removed', { description: bankName(bank) }); setRemoving(null); banks.reload() }
    catch (err) { toast.error('Could not remove this bank', { description: err instanceof ApiError ? err.message : 'Please try again.' }) }
    finally { setBusy(false) }
  }

  if ((wallet.loading && !wallet.data) || (kyc.loading && !kyc.data)) return <LoadingState />
  if (wallet.error && !wallet.data) return <ErrorState error={wallet.error} onRetry={wallet.reload} />
  const k = kyc.data
  const used = Number(amountOf(k?.usedToday ?? 0))
  const daily = Number(amountOf(k?.dailyLimit ?? 0))
  const pct = daily > 0 ? Math.min(100, Math.round((used / daily) * 100)) : 0
  const verified = k?.status === 'VERIFIED'

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-[26px] font-extrabold tracking-tight">Settings</h1><p className="text-sm text-muted">Your account, limits and security</p></div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Account & limits" aside={k && <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${verified ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-brand-dark'}`}>{verified ? 'Verified' : 'Basic'}</span>}>
          <DetailRow label="Account number">{wallet.data?.accountNumber ?? '—'}</DetailRow>
          <DetailRow label="Phone">{profile.data ? formatPhone(profile.data.phoneNumber) : '—'}</DetailRow>
          {k && <>
            <DetailRow label="Per payment">{formatTzs(k.perPaymentLimit, { symbol: false })} TZS</DetailRow>
            <DetailRow label="Daily limit">{formatTzs(k.dailyLimit, { symbol: false })} TZS</DetailRow>
            <DetailRow label="Max balance">{formatTzs(k.maxBalance, { symbol: false })} TZS</DetailRow>
            <div className="mt-2 flex flex-col gap-1.5"><div className="flex justify-between text-sm"><span className="text-muted">Used today</span><b>{formatTzs(used, { symbol: false })} of {formatTzs(daily, { symbol: false })}</b></div>
              <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Daily limit used" className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></div></div>
            {!verified && <Link to="/app/verify" className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-[13px] font-semibold text-brand-dark no-underline"><ShieldCheck aria-hidden="true" size={16} /> Verify to raise your limits to {formatTzs(k.verified.perPayment, { symbol: false })} per payment</Link>}
          </>}
        </Card>

        <Card title="Linked banks" aside={<span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">{DEMO_LABEL}</span>}>
          {linker.launcher}
          {(banks.data ?? []).length === 0
            ? <p className="text-sm text-slate-600">No bank linked. Link one to add money from it or withdraw to it. The bank must be in your own name.</p>
            : <div className="flex flex-col gap-2">{(banks.data ?? []).map((b) => <BankCard key={b.id} bank={b} right={<button type="button" aria-label={`Remove ${bankName(b)}`} onClick={() => setRemoving(b)} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-rose-50 hover:text-rose-700"><Trash2 aria-hidden="true" size={16} /></button>} />)}</div>}
          <div><Button variant="secondary" loading={linker.busy} onClick={linker.start}><Landmark aria-hidden="true" size={16} /> Link a bank</Button></div>
        </Card>

        <Card title="Profile">
          <DetailRow label="Name">{profile.data?.fullName ?? '—'}</DetailRow>
          <DetailRow label="Phone">{profile.data ? formatPhone(profile.data.phoneNumber) : '—'}</DetailRow>
          <DetailRow label="Email">{maskEmail(session?.email)}</DetailRow>
          <p className="mt-2 text-xs text-muted">Your name and phone come from your ID and cannot be changed here. Contact support if something is wrong.</p>
        </Card>

        <Card title="Security">
          <p className="text-sm text-slate-600">Your PIN approves every payment. If you forget it, use <Link to="/forgot-pin" className="font-semibold text-brand-dark">Forgot PIN</Link> on the sign-in page; we email a code to the address on file.</p>
          <p className="text-sm text-slate-600">After a PIN reset, every other device is signed out.</p>
        </Card>

        <Card title="Alerts & preferences">
          <div className="flex items-start gap-3 rounded-xl bg-surface px-4 py-3 text-sm"><Mail aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-brand" />
            <span><b>Email alerts are on.</b><br />We email you about money in and out, withdrawals and security changes. SMS alerts come later.</span></div>
        </Card>
      </div>
      <Modal open={Boolean(removing)} radius="small" width={420} title="Remove this bank?" onClose={() => setRemoving(null)}
        footer={<><Button variant="secondary" onClick={() => setRemoving(null)}>Keep it</Button><Button loading={busy} onClick={() => removing && void remove(removing)}>Remove</Button></>}>
        <p className="pb-2 text-sm text-slate-600">{removing ? bankName(removing) : ''} will be unlinked from WalletPesa. You can link it again any time.</p>
      </Modal>
    </div>
  )
}
