import { useMemo, useState } from 'react'
import { Search, Wallet, CircleCheck, Clock, CircleAlert } from 'lucide-react'
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import Drawer from '../components/Drawer'
import { transactions, type Transaction, type TxStatus, type TxChannel } from '../data'

const statusVariant = {
  Completed: 'positive',
  Pending: 'warning',
  Failed: 'negative',
} as const

const statusOptions: Array<TxStatus | 'All'> = ['All', 'Completed', 'Pending', 'Failed']
const channelOptions: Array<TxChannel | 'All'> = ['All', 'App', 'USSD', 'Agent']

const PAGE_SIZE = 6

const formatAmount = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`

export default function Transactions() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<TxStatus | 'All'>('All')
  const [channel, setChannel] = useState<TxChannel | 'All'>('All')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesQuery =
        tx.customer.toLowerCase().includes(query.toLowerCase()) ||
        tx.id.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === 'All' || tx.status === status
      const matchesChannel = channel === 'All' || tx.channel === channel
      return matchesQuery && matchesStatus && matchesChannel
    })
  }, [query, status, channel])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selected: Transaction | null = transactions.find((tx) => tx.id === selectedId) ?? null

  const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0)
  const completedCount = transactions.filter((tx) => tx.status === 'Completed').length
  const pendingCount = transactions.filter((tx) => tx.status === 'Pending').length
  const failedCount = transactions.filter((tx) => tx.status === 'Failed').length

  const openTransaction = (id: string) => {
    setSelectedId(id)
    setDrawerOpen(true)
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} label="Total volume" value={formatAmount(totalVolume)} delta={12.4} />
        <StatCard icon={CircleCheck} label="Completed" value={String(completedCount)} delta={3.1} />
        <StatCard icon={Clock} label="Pending" value={String(pendingCount)} delta={-1.8} />
        <StatCard icon={CircleAlert} label="Failed" value={String(failedCount)} delta={-0.4} />
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
            placeholder="Search by customer or ID..."
            className="w-full rounded-full border border-transparent bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          />
        </div>

        <div className="flex gap-3">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as TxStatus | 'All')
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
            value={channel}
            onChange={(event) => {
              setChannel(event.target.value as TxChannel | 'All')
              setPage(1)
            }}
            className="rounded-full border border-transparent bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          >
            {channelOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All channels' : option}
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
                <th className="px-6 py-3 font-semibold">Transaction ID</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Channel</th>
                <th className="px-6 py-3 text-right font-semibold">Amount</th>
                <th className="px-6 py-3 text-right font-semibold">Fee</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-6 py-3.5 font-mono text-xs text-muted">{tx.id}</td>
                  <td className="px-6 py-3.5 font-medium text-ink">{tx.customer}</td>
                  <td className="px-6 py-3.5 text-ink/70">{tx.type}</td>
                  <td className="px-6 py-3.5 text-ink/70">{tx.channel}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-ink">
                    {formatAmount(tx.amount)}
                  </td>
                  <td className="px-6 py-3.5 text-right text-ink/70">
                    {tx.fee > 0 ? formatAmount(tx.fee) : '—'}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={statusVariant[tx.status]} label={tx.status} />
                  </td>
                  <td className="px-6 py-3.5 text-ink/70">{tx.date}</td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => openTransaction(tx.id)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:border-brand"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-sm text-muted">
                    No transactions match your filters.
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
        title="Transaction detail"
        footer={
          <>
            <button
              type="button"
              className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink"
            >
              Receipt
            </button>
            <button
              type="button"
              className="flex-1 rounded-full border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700"
            >
              Reverse
            </button>
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div>
              <p className="font-mono text-xs text-muted">{selected.id}</p>
              <p className="mt-1 text-3xl font-extrabold text-ink">{formatAmount(selected.amount)}</p>
              <div className="mt-2">
                <StatusBadge status={statusVariant[selected.status]} label={selected.status} />
              </div>
            </div>

            <div className="space-y-3 border-t border-line pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Customer</span>
                <span className="font-semibold text-ink">{selected.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Phone</span>
                <span className="font-semibold text-ink">{selected.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Type</span>
                <span className="font-semibold text-ink">{selected.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Channel</span>
                <span className="font-semibold text-ink">{selected.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Fee</span>
                <span className="font-semibold text-ink">
                  {selected.fee > 0 ? formatAmount(selected.fee) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Date</span>
                <span className="font-semibold text-ink">{selected.date}</span>
              </div>
            </div>

            <div className="border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Ledger entries</p>
              <div className="mt-3 space-y-2 rounded-xl bg-surface p-4 font-mono text-xs text-ink/80">
                <div className="flex justify-between">
                  <span>Debit · {selected.customer} wallet</span>
                  <span>-{formatAmount(selected.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Credit · Fee income account</span>
                  <span>+{selected.fee > 0 ? formatAmount(selected.fee) : '$0.00'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
