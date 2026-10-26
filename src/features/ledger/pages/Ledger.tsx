import { useMemo, useState } from 'react'
import {
  Search,
  BookText,
  Scale,
  ArrowRightLeft,
  CircleDollarSign,
  Hash,
  CalendarClock,
  FileText,
  ArrowLeft,
} from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge from '../../../components/ui/StatusBadge'
import TypeBadge from '../../../components/ui/TypeBadge'
import DateFilter from '../../../components/ui/DateFilter'
import SortIcon, { type SortDirection } from '../../../components/ui/SortIcon'
import {
  journalEntries,
  chartOfAccounts,
  getEntryTotals,
  getAccountBalance,
  type JournalEntry,
  type PostingStatus,
  type AccountCategory,
} from '../data'

const statusVariant: Record<PostingStatus, 'positive' | 'warning'> = {
  Posted: 'positive',
  Pending: 'warning',
}

const categoryTone: Record<AccountCategory, 'blue' | 'rose' | 'purple' | 'green' | 'amber'> = {
  Asset: 'blue',
  Liability: 'rose',
  Equity: 'purple',
  Revenue: 'green',
  Expense: 'amber',
}

const categoryOrder: AccountCategory[] = ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense']

const statusOptions: Array<PostingStatus | 'All'> = ['All', 'Posted', 'Pending']

type SortKey = 'debit' | 'credit' | 'status'

const PAGE_SIZE = 10

const formatAmount = (value: number) => `TSh ${Math.round(value).toLocaleString()}`

export default function Ledger() {
  const [tab, setTab] = useState<'journal' | 'coa'>('journal')

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<PostingStatus | 'All'>('All')
  const [date, setDate] = useState('')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)
  const [page, setPage] = useState(1)

  const [view, setView] = useState<'list' | 'detail'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const resetToFirstPage = () => setPage(1)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return journalEntries.filter((entry) => {
      const matchesQuery =
        entry.id.toLowerCase().includes(q) ||
        entry.referenceTxnId.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q)
      const matchesStatus = status === 'All' || entry.status === status
      const matchesDate = !date || entry.timestamp.slice(0, 10) === date
      return matchesQuery && matchesStatus && matchesDate
    })
  }, [query, status, date])

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    const direction = sortDir === 'asc' ? 1 : -1
    const compare: Record<SortKey, (a: JournalEntry, b: JournalEntry) => number> = {
      debit: (a, b) => getEntryTotals(a).totalDebit - getEntryTotals(b).totalDebit,
      credit: (a, b) => getEntryTotals(a).totalCredit - getEntryTotals(b).totalCredit,
      status: (a, b) => a.status.localeCompare(b.status),
    }
    return [...filtered].sort((a, b) => compare[sortKey](a, b) * direction)
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortKey(null)
      setSortDir(null)
    }
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selected: JournalEntry | null = journalEntries.find((entry) => entry.id === selectedId) ?? null
  const selectedTotals = selected ? getEntryTotals(selected) : null

  const openEntry = (id: string) => {
    setSelectedId(id)
    setView('detail')
  }

  const backToList = () => setView('list')

  const totalEntries = journalEntries.length
  const ledgerTotals = useMemo(
    () =>
      journalEntries.reduce(
        (sum, entry) => {
          const { totalDebit, totalCredit } = getEntryTotals(entry)
          return { debit: sum.debit + totalDebit, credit: sum.credit + totalCredit }
        },
        { debit: 0, credit: 0 },
      ),
    [],
  )
  const balanceDiff = ledgerTotals.debit - ledgerTotals.credit
  const isBalanced = Math.abs(balanceDiff) < 0.01

  if (view === 'detail' && selected && selectedTotals) {
    return (
      <div className="space-y-5">
        <div className="overflow-hidden bg-white ring-1 ring-line">
          <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={backToList}
                aria-label="Back to ledger"
                className="group flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-white transition-colors hover:bg-brand/90"
              >
                <ArrowLeft size={18} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              </button>
              <div>
                <h2 className="text-base font-bold text-ink">Journal Entry Detail</h2>
                <p className="mt-0.5 text-xs text-muted">{selected.id}</p>
              </div>
            </div>
            <StatusBadge status={statusVariant[selected.status]} label={selected.status} />
          </div>

          <div className="px-6 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Overview</p>
            <div className="mt-3 divide-y divide-line rounded-xl ring-1 ring-line">
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Hash size={16} />
                  </span>
                  <p className="text-xs text-muted">Reference Transaction ID</p>
                </div>
                <p className="shrink-0 truncate font-mono text-sm font-semibold text-ink">
                  {selected.referenceTxnId}
                </p>
              </div>
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <CalendarClock size={16} />
                  </span>
                  <p className="text-xs text-muted">UTC Timestamp</p>
                </div>
                <p className="shrink-0 font-mono text-sm font-semibold text-ink">{selected.timestamp}</p>
              </div>
              <div className="flex items-center justify-between gap-3 p-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <FileText size={16} />
                  </span>
                  <p className="text-xs text-muted">Memo</p>
                </div>
                <p className="min-w-0 truncate text-right text-sm font-semibold text-ink">
                  {selected.description}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Line Items</p>
            <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-line">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">Account</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Debit</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {selected.lines.map((line, index) => (
                    <tr key={`${line.accountId}-${index}`}>
                      <td className="px-4 py-2.5">
                        <p className="text-sm font-semibold text-ink">{line.accountName}</p>
                        <p className="font-mono text-xs text-muted">{line.accountId}</p>
                      </td>
                      <td className="px-4 py-2.5 text-right text-ink">
                        {line.debit > 0 ? formatAmount(line.debit) : '—'}
                      </td>
                      <td className="px-4 py-2.5 text-right text-ink">
                        {line.credit > 0 ? formatAmount(line.credit) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-line bg-surface">
                  <tr>
                    <td className="px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
                      Total
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-bold text-ink">
                      {formatAmount(selectedTotals.totalDebit)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-bold text-ink">
                      {formatAmount(selectedTotals.totalCredit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Ledger</h1>
        <p className="mt-1 text-sm text-muted">
          Double-entry accounting records for every financial movement, fully balanced and
          auditable.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={BookText}
          tone="brand"
          label="Journal Entries"
          value={String(totalEntries)}
          delta={0}
        />
        <StatCard
          icon={ArrowRightLeft}
          tone="accent"
          label="Total Debits"
          value={formatAmount(ledgerTotals.debit)}
          delta={0}
        />
        <StatCard
          icon={CircleDollarSign}
          tone="accent"
          label="Total Credits"
          value={formatAmount(ledgerTotals.credit)}
          delta={0}
        />
        <StatCard
          icon={Scale}
          tone={isBalanced ? 'positive' : 'negative'}
          label="Balance Check"
          value={formatAmount(balanceDiff)}
          delta={0}
          deltaLabel={isBalanced ? 'Books are balanced' : 'Debits ≠ credits — investigate'}
        />
      </div>

      <div className="flex gap-2 border-b border-line">
        <button
          type="button"
          onClick={() => setTab('journal')}
          className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === 'journal' ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Journal Entries
        </button>
        <button
          type="button"
          onClick={() => setTab('coa')}
          className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
            tab === 'coa' ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink'
          }`}
        >
          Chart of Accounts
        </button>
      </div>

      {tab === 'journal' ? (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
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
                  resetToFirstPage()
                }}
                placeholder="Search journal ID, reference txn or memo..."
                className="w-full rounded-full border border-transparent bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as PostingStatus | 'All')
                  resetToFirstPage()
                }}
                className="rounded-full border border-transparent bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
              >
                {statusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'All statuses' : option}
                  </option>
                ))}
              </select>

              <DateFilter
                value={date}
                onChange={(value) => {
                  setDate(value)
                  resetToFirstPage()
                }}
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-6 py-3 font-semibold">#</th>
                    <th className="px-6 py-3 font-semibold">Journal ID</th>
                    <th className="px-6 py-3 font-semibold">Reference Txn ID</th>
                    <th className="px-6 py-3 font-semibold">Date (UTC)</th>
                    <th className="px-6 py-3 font-semibold">Description</th>
                    <th className="px-6 py-3 text-right font-semibold">
                      <button
                        type="button"
                        onClick={() => toggleSort('debit')}
                        className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                      >
                        Debit Total
                        <SortIcon direction={sortKey === 'debit' ? sortDir : null} />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right font-semibold">
                      <button
                        type="button"
                        onClick={() => toggleSort('credit')}
                        className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                      >
                        Credit Total
                        <SortIcon direction={sortKey === 'credit' ? sortDir : null} />
                      </button>
                    </th>
                    <th className="px-6 py-3 font-semibold">
                      <button
                        type="button"
                        onClick={() => toggleSort('status')}
                        className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                      >
                        Status
                        <SortIcon direction={sortKey === 'status' ? sortDir : null} />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pageItems.map((entry, index) => {
                    const { totalDebit, totalCredit } = getEntryTotals(entry)
                    return (
                      <tr
                        key={entry.id}
                        onClick={() => openEntry(entry.id)}
                        className="cursor-pointer transition-colors hover:bg-surface"
                      >
                        <td className="px-6 py-3.5 text-xs text-muted">
                          {(page - 1) * PAGE_SIZE + index + 1}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-xs font-bold text-ink">{entry.id}</td>
                        <td className="px-6 py-3.5 font-mono text-xs text-brand">{entry.referenceTxnId}</td>
                        <td className="px-6 py-3.5 text-ink/70">{entry.timestamp.replace('T', ' ')}</td>
                        <td
                          className="max-w-xs truncate px-6 py-3.5 text-ink/80"
                          title={entry.description}
                        >
                          {entry.description}
                        </td>
                        <td className="px-6 py-3.5 text-right font-semibold text-ink">
                          {formatAmount(totalDebit)}
                        </td>
                        <td className="px-6 py-3.5 text-right font-semibold text-ink">
                          {formatAmount(totalCredit)}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusBadge status={statusVariant[entry.status]} label={entry.status} />
                        </td>
                      </tr>
                    )
                  })}
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-sm text-muted">
                        No journal entries match your filters.
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
        </>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-6 py-3 font-semibold">Account ID</th>
                  <th className="px-6 py-3 font-semibold">Account Name</th>
                  <th className="px-6 py-3 font-semibold">Category</th>
                  <th className="px-6 py-3 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {categoryOrder.flatMap((category) =>
                  chartOfAccounts
                    .filter((account) => account.category === category)
                    .map((account) => (
                      <tr key={account.id}>
                        <td className="px-6 py-3.5 font-mono text-xs text-muted">{account.id}</td>
                        <td className="px-6 py-3.5 font-medium text-ink">{account.name}</td>
                        <td className="px-6 py-3.5">
                          <TypeBadge tone={categoryTone[account.category]} label={account.category} />
                        </td>
                        <td className="px-6 py-3.5 text-right font-semibold text-ink">
                          {formatAmount(getAccountBalance(account))}
                        </td>
                      </tr>
                    )),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
