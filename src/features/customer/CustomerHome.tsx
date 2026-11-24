import { ArrowDownLeft, ArrowUpRight, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { formatDateTime } from '../../shared/lib/dates'
import { formatTzs } from '../../shared/lib/money'
import { maskPhone } from '../../shared/lib/phone'
import { EmptyState, ErrorState, LoadingState } from '../../shared/ui/controls'
import type { KycStatus } from './VerifyIdentityPage'

interface Wallet { accountNumber: string; balance: number | string; currency: string; status: string }
interface Profile {
  fullName: string
  phoneNumber: string
  transactions: { reference: string; type: string; direction: string; amount: number | string; fee: number | string | null; status: string; createdAt: string }[]
}

/** Actions whose endpoints are not built yet. They are shown disabled, never faked. */
const SOON = ['Send', 'Cash out', 'Add money', 'Request']

function kycCopy(kyc: KycStatus): { title: string; sub: string } {
  switch (kyc.status) {
    case 'VERIFIED': return { title: 'Identity verified', sub: `Send up to ${formatTzs(kyc.perPaymentLimit)} per payment` }
    case 'PENDING': return { title: 'Verification in progress', sub: 'We are checking your ID. Tap to see the result.' }
    case 'FAILED': return { title: 'Verification failed. Try again', sub: 'Your limits have not changed.' }
    default: return { title: 'Verify your identity', sub: `Basic limits now. Verify to send up to ${formatTzs(kyc.verified.perPayment)} per payment` }
  }
}

export default function CustomerHome() {
  const wallet = useApi<Wallet>((signal) => api('/wallets/me', { signal }), [], 30_000)
  const profile = useApi<Profile>((signal) => api('/customers/profile', { signal }), [])
  const kyc = useApi<KycStatus>((signal) => api('/kyc/status', { signal }), [])

  if ((wallet.loading && !wallet.data) || (profile.loading && !profile.data)) return <LoadingState label="Loading your wallet…" />
  if (wallet.error && !wallet.data) return <ErrorState error={wallet.error} onRetry={wallet.reload} />

  const first = profile.data?.fullName?.split(' ')[0]
  const [whole] = formatTzs(wallet.data?.balance, { symbol: false }).split('.')
  const verified = kyc.data?.status === 'VERIFIED'
  return (
    <div className="flex flex-col gap-5 tabular-nums">
      <h1 className="text-[28px] font-extrabold tracking-tight">{first ? `Habari, ${first}` : 'Habari'}</h1>

      <section aria-label="Main wallet" className="relative flex flex-col gap-5 overflow-hidden rounded-[28px] bg-ink p-7 text-white shadow-[0_18px_40px_rgba(37,99,235,0.25)]">
        <span aria-hidden="true" className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-brand opacity-20" />
        <div className="relative flex items-center justify-between text-sm font-bold text-slate-400">
          <span>Main wallet · {profile.data ? maskPhone(profile.data.phoneNumber) : '—'}</span>
          {kyc.data && (
            <Link to="/app/verify" className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-ink no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300">
              {verified ? 'Verified' : 'Basic · verify'}
            </Link>
          )}
        </div>
        <span className="relative text-5xl font-extrabold leading-none tracking-tight sm:text-[56px]">{whole} <span className="text-[17px] font-semibold tracking-normal text-slate-400">TZS</span></span>
        <div className="relative flex flex-wrap gap-2.5">
          {SOON.map((label) => (
            <button key={label} type="button" disabled title="Coming soon" className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-700 px-5 font-bold text-slate-500">
              {label}<span className="text-[11px] font-semibold">soon</span>
            </button>
          ))}
        </div>
      </section>

      {kyc.data && (
        <Link to="/app/verify" className={`flex items-center gap-3.5 rounded-[22px] p-4 text-ink no-underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${verified ? 'bg-teal-50' : 'bg-blue-50'}`}>
          <ShieldCheck aria-hidden="true" className={verified ? 'text-teal-700' : 'text-brand-dark'} size={24} />
          <span className="flex flex-1 flex-col">
            <b className="text-[15px]">{kycCopy(kyc.data).title}</b>
            <span className="text-[13px] text-slate-700">{kycCopy(kyc.data).sub}</span>
          </span>
        </Link>
      )}

      <section aria-label="Recent activity" className="rounded-[22px] border border-line bg-white p-5">
        <h2 className="mb-1 text-lg font-extrabold">Recent</h2>
        {profile.error && !profile.data ? <ErrorState error={profile.error} onRetry={profile.reload} />
          : !profile.data || profile.data.transactions.length === 0 ? <EmptyState title="No transactions yet" description="Cash in at an agent to get started." /> : (
            <ul>
              {profile.data.transactions.slice(0, 10).map((t) => {
                const incoming = t.direction === 'IN' || t.direction === 'CREDIT'
                return (
                  <li key={t.reference} className="flex items-center gap-3.5 border-t border-slate-100 py-3 first:border-0">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${incoming ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-ink'}`}>
                      {incoming ? <ArrowDownLeft aria-hidden="true" size={18} /> : <ArrowUpRight aria-hidden="true" size={18} />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col"><b className="truncate text-[15px]">{t.type}</b><span className="text-[13px] text-slate-600">{formatDateTime(t.createdAt)} · {t.status}</span></span>
                    <b className={`text-base ${incoming ? 'text-teal-700' : 'text-ink'}`}>{incoming ? '+' : '−'}{formatTzs(t.amount, { symbol: false })}</b>
                  </li>
                )
              })}
            </ul>
          )}
      </section>
    </div>
  )
}
