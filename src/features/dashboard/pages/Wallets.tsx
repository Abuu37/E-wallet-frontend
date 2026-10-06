import { useMemo, useState } from 'react'
import { Search, Wallet as WalletIcon, CircleCheck, Lock, ShieldAlert } from 'lucide-react'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import Drawer from '../components/Drawer'
import { wallets as initialWallets, type Wallet, type WalletStatus } from '../data'

const statusVariant = {
  Active: 'positive',
  Frozen: 'warning',
  Blocked: 'negative',
} as const

const statusOptions: Array<WalletStatus | 'All'> = ['All', 'Active', 'Frozen', 'Blocked']
const instrumentOptions = ['All', 'Virtual Wallet', 'Physical Card'] as const

const PAGE_SIZE = 6

const formatAmount = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`

export default function Wallets() {
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<WalletStatus | 'All'>('All')
  const [instrument, setInstrument] = useState<(typeof instrumentOptions)[number]>('All')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filtered = useMemo(() => {
    return wallets.filter((wallet) => {
      const matchesQuery =
        wallet.holder.toLowerCase().includes(query.toLowerCase()) ||
        wallet.id.toLowerCase().includes(query.toLowerCase()) ||
        wallet.phone.includes(query)
      const matchesStatus = status === 'All' || wallet.status === status
      const matchesInstrument = instrument === 'All' || wallet.instrument === instrument
      return matchesQuery && matchesStatus && matchesInstrument
    })
  }, [wallets, query, status, instrument])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selected: Wallet | null = wallets.find((wallet) => wallet.id === selectedId) ?? null

  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  const activeCount = wallets.filter((wallet) => wallet.status === 'Active').length
  const frozenCount = wallets.filter((wallet) => wallet.status === 'Frozen').length
  const blockedCount = wallets.filter((wallet) => wallet.status === 'Blocked').length

  const openWallet = (id: string) => {
    setSelectedId(id)
    setDrawerOpen(true)
  }

  const toggleFreeze = () => {
    if (!selected || selected.status === 'Blocked') return
    const nextStatus: WalletStatus = selected.status === 'Active' ? 'Frozen' : 'Active'
    setWallets((prev) =>
      prev.map((wallet) => (wallet.id === selected.id ? { ...wallet, status: nextStatus } : wallet)),
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={WalletIcon}
          label="Total balance held"
          value={formatAmount(totalBalance)}
          delta={0}
          deltaLabel={`Across ${wallets.length} wallets`}
        />
        <StatCard
          icon={CircleCheck}
          label="Active"
          value={String(activeCount)}
          delta={0}
          deltaLabel="Free to send & spend"
        />
        <StatCard
          icon={Lock}
          label="Frozen"
          value={String(frozenCount)}
          delta={0}
          deltaLabel="Paused by an admin"
        />
        <StatCard
          icon={ShieldAlert}
          label="Blocked"
          value={String(blockedCount)}
          delta={0}
          deltaLabel="Held by compliance"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setPage(1)
            }}
            placeholder="Search by holder, ID or phone..."
            className="w-full rounded-full border border-transparent bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as WalletStatus | 'All')
              setPage(1)
            }}
            className="rounded-full border border-transparent bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All statuses' : option}
              </option>
            ))}
          </select>

          <select
            value={instrument}
            onChange={(event) => {
              setInstrument(event.target.value as (typeof instrumentOptions)[number])
              setPage(1)
            }}
            className="rounded-full border border-transparent bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          >
            {instrumentOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All instruments' : option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-ink/5 ring-1 ring-line">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Wallet</th>
                <th className="px-6 py-3 font-semibold">Holder</th>
                <th className="px-6 py-3 font-semibold">Instrument</th>
                <th className="px-6 py-3 text-right font-semibold">Balance</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Last activity</th>
                <th className="px-6 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map((wallet) => (
                <tr key={wallet.id}>
                  <td className="px-6 py-3.5 font-mono text-xs text-muted">{wallet.id}</td>
                  <td className="px-6 py-3.5 font-medium text-ink">{wallet.holder}</td>
                  <td className="px-6 py-3.5 text-ink/70">{wallet.instrument}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-ink">
                    {formatAmount(wallet.balance)}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={statusVariant[wallet.status]} label={wallet.status} />
                  </td>
                  <td className="px-6 py-3.5 text-ink/70">{wallet.lastActivity}</td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => openWallet(wallet.id)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:border-brand"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted">
                    No wallets match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-line px-6 py-4 text-sm text-muted">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-full border border-line px-3 py-1.5 font-medium text-ink/80 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink/80"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="rounded-full border border-line px-3 py-1.5 font-medium text-ink/80 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink/80"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Wallet detail"
        footer={
          selected?.status === 'Blocked' ? (
            <button
              type="button"
              className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink"
            >
              Contact Compliance
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleFreeze}
                className={`flex-1 rounded-full border py-2.5 text-sm font-semibold ${
                  selected?.status === 'Active'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-green-200 bg-green-50 text-green-700'
                }`}
              >
                {selected?.status === 'Active' ? 'Freeze wallet' : 'Unfreeze wallet'}
              </button>
              <button
                type="button"
                className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink"
              >
                Full history
              </button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="font-mono text-xs text-muted">{selected.id}</p>
              <p className="mt-1 text-3xl font-extrabold text-ink">{formatAmount(selected.balance)}</p>
              <div className="mt-2">
                <StatusBadge status={statusVariant[selected.status]} label={selected.status} />
              </div>
            </div>

            <div className="space-y-3 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Holder</span>
                <span className="font-semibold text-ink">{selected.holder}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Phone</span>
                <span className="font-semibold text-ink">{selected.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Instrument</span>
                <span className="font-semibold text-ink">{selected.instrument}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Currency</span>
                <span className="font-semibold text-ink">{selected.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Opened</span>
                <span className="font-semibold text-ink">{selected.opened}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Last activity</span>
                <span className="font-semibold text-ink">{selected.lastActivity}</span>
              </div>
            </div>

            {selected.instrument === 'Physical Card' ? (
              <div className="border-t border-line pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Linked card</p>
                <div className="mt-3 rounded-2xl bg-ink p-4 text-white">
                  <p className="font-mono text-sm tracking-widest">{selected.cardNumber}</p>
                  <div className="mt-3 flex justify-between text-xs text-white/60">
                    <span>{selected.holder}</span>
                    <span>{selected.cardExpiry}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t border-line pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Linked card</p>
                <p className="mt-2 text-sm text-muted">No physical card issued for this wallet yet.</p>
              </div>
            )}

            <div className="border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recent activity</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink">Send Money</span>
                  <span className="text-muted">-$45.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink">Wallet top-up</span>
                  <span className="text-muted">+$200.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink">Pay Bills</span>
                  <span className="text-muted">-$18.50</span>
                </div>
              </div>
            </div>

            {selected.status === 'Blocked' && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">Blocked by Compliance</p>
                <p className="mt-1 text-xs leading-relaxed text-red-700/80">
                  This wallet is held under an active compliance case and cannot be unblocked from
                  here. Contact the compliance team to review.
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
