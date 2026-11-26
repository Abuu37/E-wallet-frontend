import { ArrowDownLeft, ArrowUpRight, Landmark, MapPin, Send, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { formatDate, formatTime } from '../../shared/lib/dates'
import { amountOf, formatTzs } from '../../shared/lib/money'
import { maskPhone } from '../../shared/lib/phone'
import { EmptyState, ErrorState, LoadingState } from '../../shared/ui/controls'
import { typeLabel, type KycInfo, type MyTransactionList, type Profile, type Wallet } from './types'

const pct = (used: number, limit: number) => (limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0)

/** Dashboard (W14) and the empty state for a brand-new wallet (W15). */
export default function CustomerHome() {
  const wallet = useApi<Wallet>((signal) => api('/wallets/me', { signal }), [], 30_000)
  const profile = useApi<Profile>((signal) => api('/customers/profile', { signal }), [])
  const kyc = useApi<KycInfo>((signal) => api('/kyc/status', { signal }), [], 60_000)
  const recent = useApi<MyTransactionList>((signal) => api('/transactions/me', { query: { size: 6 }, signal }), [], 30_000)

  if ((wallet.loading && !wallet.data) || (recent.loading && !recent.data)) return <LoadingState label="Loading your wallet…" />
  if (wallet.error && !wallet.data) return <ErrorState error={wallet.error} onRetry={wallet.reload} />

  const first = profile.data?.fullName?.split(' ')[0]
  const [whole] = formatTzs(wallet.data?.balance, { symbol: false }).split('.')
  const verified = kyc.data?.status === 'VERIFIED'
  const items = recent.data?.items ?? []
  const used = Number(amountOf(kyc.data?.usedToday ?? 0))
  const daily = Number(amountOf(kyc.data?.dailyLimit ?? 0))

  return (
    <div className="flex flex-col gap-5 tabular-nums">
      <h1 className="text-[28px] font-extrabold tracking-tight">{first ? `Habari, ${first}` : 'Habari'}</h1>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section aria-label="Main wallet" className="relative flex flex-col gap-5 overflow-hidden rounded-[28px] bg-ink p-7 text-white shadow-[0_18px_40px_rgba(37,99,235,0.25)]">
          <span aria-hidden="true" className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-brand opacity-20" />
          <div className="relative flex items-center justify-between text-sm font-bold text-slate-400">
            <span>Main wallet · {profile.data ? maskPhone(profile.data.phoneNumber) : '—'}</span>
            {kyc.data && <Link to="/app/verify" className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-ink no-underline">{verified ? 'Verified' : 'Basic · verify'}</Link>}
          </div>
          <span className="relative text-5xl font-extrabold leading-none tracking-tight sm:text-[56px]">{whole} <span className="text-[17px] font-semibold tracking-normal text-slate-400">TZS</span></span>
          <div className="relative flex flex-wrap gap-2.5">
            <Link to="/app/send" className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-5 font-bold text-white no-underline hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"><Send aria-hidden="true" size={18} /> Send</Link>
            <Link to="/app/withdraw" className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-600 px-5 font-bold text-white no-underline hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"><ArrowUpRight aria-hidden="true" size={18} /> Withdraw</Link>
            <span className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-700 px-5 font-bold text-slate-500" title="Coming soon"><Landmark aria-hidden="true" size={18} /> Add money<span className="text-[11px] font-semibold">soon</span></span>
          </div>
        </section>

        <section aria-label="Daily limit" className="flex flex-col gap-3 rounded-[22px] border border-line bg-white p-5">
          <h2 className="text-lg font-extrabold">Daily limit</h2>
          {kyc.data ? (
            <>
              <div className="flex items-baseline justify-between text-sm"><span className="text-muted">Used today</span><b>{formatTzs(used, { symbol: false })} of {formatTzs(daily, { symbol: false })} TZS</b></div>
              <div role="progressbar" aria-valuenow={pct(used, daily)} aria-valuemin={0} aria-valuemax={100} aria-label="Daily limit used" className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${pct(used, daily) >= 90 ? 'bg-orange-500' : 'bg-brand'}`} style={{ width: `${pct(used, daily)}%` }} />
              </div>
              <p className="text-xs text-muted">Up to {formatTzs(kyc.data.perPaymentLimit, { symbol: false })} per payment · wallet holds up to {formatTzs(kyc.data.maxBalance, { symbol: false })}</p>
              {!verified && (
                <Link to="/app/verify" className="mt-1 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-[13px] font-semibold text-brand-dark no-underline">
                  <ShieldCheck aria-hidden="true" size={16} /> Verify to send up to {formatTzs(kyc.data.verified.perPayment, { symbol: false })} per payment
                </Link>
              )}
            </>
          ) : <LoadingState label="Loading limits…" />}
        </section>
      </div>

      <section aria-label="Recent activity" className="rounded-[22px] border border-line bg-white p-5">
        <div className="mb-1 flex items-baseline justify-between"><h2 className="text-lg font-extrabold">Recent transactions</h2>{items.length > 0 && <Link to="/app/transactions" className="text-sm font-semibold text-brand-dark no-underline hover:underline">See all</Link>}</div>
        {recent.error && !recent.data ? <ErrorState error={recent.error} onRetry={recent.reload} />
          : items.length === 0 ? (
            <EmptyState title="Your wallet is ready" description="Nothing here yet. Add money by cashing in at an agent, then send to anyone with a WalletPesa number."
              action={<Link to="/app/agents" className="mt-1 inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-bold text-white no-underline hover:bg-brand-dark"><MapPin aria-hidden="true" size={16} /> Find an agent</Link>} />
          ) : (
            <ul>
              {items.map((t) => (
                <li key={t.referenceNo} className="flex items-center gap-3.5 border-t border-slate-100 py-3 first:border-0">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.direction === 'IN' ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-ink'}`}>
                    {t.direction === 'IN' ? <ArrowDownLeft aria-hidden="true" size={18} /> : <ArrowUpRight aria-hidden="true" size={18} />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col"><b className="truncate text-[15px]">{typeLabel(t)}{t.counterpartyName ? ` · ${t.counterpartyName}` : ''}</b>
                    <span className="text-[13px] text-slate-600">{formatDate(t.createdAt)} {formatTime(t.createdAt)} · {t.status.charAt(0) + t.status.slice(1).toLowerCase()}</span></span>
                  <b className={`text-base ${t.direction === 'IN' ? 'text-teal-700' : 'text-ink'}`}>{t.direction === 'IN' ? '+' : '−'}{formatTzs(t.amount, { symbol: false })}</b>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  )
}
