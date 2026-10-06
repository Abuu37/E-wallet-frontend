import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import { transactions, type TxStatus } from '../data'

const statusVariant = {
  Completed: 'positive',
  Pending: 'warning',
  Failed: 'negative',
} as const

const statusOptions: Array<TxStatus | 'All'> = ['All', 'Completed', 'Pending', 'Failed']

const PAGE_SIZE = 6

export default function Transactions() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<TxStatus | 'All'>('All')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesQuery =
        tx.customer.toLowerCase().includes(query.toLowerCase()) ||
        tx.id.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === 'All' || tx.status === status
      return matchesQuery && matchesStatus
    })
  }, [query, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="space-y-5">
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

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as TxStatus | 'All')
            setPage(1)
          }}
          className="w-full rounded-full border border-transparent bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand sm:w-48"
        >
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {option === 'All' ? 'All statuses' : option}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-ink/5 ring-1 ring-line">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Transaction ID</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Amount</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-6 py-3.5 font-mono text-xs text-muted">{tx.id}</td>
                  <td className="px-6 py-3.5 font-medium text-ink">{tx.customer}</td>
                  <td className="px-6 py-3.5 text-ink/70">{tx.type}</td>
                  <td className="px-6 py-3.5 font-semibold text-ink">
                    ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={statusVariant[tx.status]} label={tx.status} />
                  </td>
                  <td className="px-6 py-3.5 text-ink/70">{tx.date}</td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted">
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
    </div>
  )
}
