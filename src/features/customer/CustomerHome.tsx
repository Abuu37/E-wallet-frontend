import { ArrowDownLeft, ArrowUpRight, Plus, Send } from 'lucide-react'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { formatDateTime } from '../../shared/lib/dates'
import { formatTzs } from '../../shared/lib/money'
import { maskPhone } from '../../shared/lib/phone'
import { EmptyState, ErrorState, LoadingState } from '../../shared/ui/controls'

interface Wallet { accountNumber: string; balance: number | string; currency: string; status: string }
interface Profile {
  fullName: string
  phoneNumber: string
  transactions: { reference: string; type: string; direction: string; amount: number | string; fee: number | string | null; status: string; createdAt: string }[]
}

const SOON = [
  { label: 'Send', icon: Send }, { label: 'Add money', icon: Plus }, { label: 'Withdraw', icon: ArrowUpRight },
]

function maskAccount(n: string) { return `•••• ${n.slice(-4)}` }

export default function CustomerHome() {
  const wallet = useApi<Wallet>((signal) => api('/wallets/me', { signal }), [], 30_000)
  const profile = useApi<Profile>((signal) => api('/customers/profile', { signal }), [])

  if ((wallet.loading && !wallet.data) || (profile.loading && !profile.data)) return <LoadingState label="Loading your wallet…" />
  if (wallet.error && !wallet.data) return <ErrorState error={wallet.error} onRetry={wallet.reload} />

  const first = profile.data?.fullName?.split(' ')[0]
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold tracking-tight">{first ? `Karibu, ${first}` : 'Karibu'}</h1>

      <section aria-label="Balance" className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-700 p-6 text-white">
        <p className="text-sm font-semibold text-slate-300">Available balance</p>
        <p className="mt-1 text-4xl font-extrabold tabular-nums tracking-tight">{formatTzs(wallet.data?.balance)}</p>
        <p className="mt-4 text-xs text-slate-300">
          Wallet {wallet.data ? maskAccount(wallet.data.accountNumber) : '—'} · {profile.data ? maskPhone(profile.data.phoneNumber) : ''}
        </p>
      </section>

      <div className="grid grid-cols-3 gap-3" aria-label="Actions">
        {SOON.map(({ label, icon: Icon }) => (
          <button key={label} type="button" disabled title="Coming soon" className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-white p-4 text-sm font-bold text-slate-400">
            <Icon aria-hidden="true" size={22} /> {label}<span className="text-[11px] font-semibold">Coming soon</span>
          </button>
        ))}
      </div>

      <section aria-label="Recent activity" className="rounded-2xl border border-line bg-white p-5">
        <h2 className="mb-2 text-base font-extrabold">Recent activity</h2>
        {profile.error && !profile.data ? <ErrorState error={profile.error} onRetry={profile.reload} />
          : !profile.data || profile.data.transactions.length === 0 ? <EmptyState title="No transactions yet" description="Cash in at an agent to get started." /> : (
            <ul className="divide-y divide-line">
              {profile.data.transactions.slice(0, 10).map((t) => {
                const incoming = t.direction === 'IN' || t.direction === 'CREDIT'
                return (
                  <li key={t.reference} className="flex items-center gap-3 py-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${incoming ? 'bg-green-50 text-[#16A34A]' : 'bg-rose-50 text-[#E11D48]'}`}>
                      {incoming ? <ArrowDownLeft aria-hidden="true" size={18} /> : <ArrowUpRight aria-hidden="true" size={18} />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col"><b className="truncate text-sm">{t.type}</b><span className="text-xs text-muted">{formatDateTime(t.createdAt)} · {t.status}</span></span>
                    <b className={`text-sm tabular-nums ${incoming ? 'text-[#16A34A]' : 'text-[#E11D48]'}`}>{incoming ? '+' : '-'}{formatTzs(t.amount, { symbol: false })}</b>
                  </li>
                )
              })}
            </ul>
          )}
      </section>
    </div>
  )
}
