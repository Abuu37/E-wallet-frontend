import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Search,
  ArrowLeftRight,
  CircleCheck,
  Clock,
  XCircle,
  CalendarDays,
  MoreVertical,
  Eye,
  Trash2,
  Hash,
  User,
  UserCog,
  CreditCard,
  Tag,
  Globe,
  Percent,
  Receipt,
  RotateCcw,
  Wallet,
  Send,
  HandCoins,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge from '../../../components/ui/StatusBadge'
import TypeBadge from '../../../components/ui/TypeBadge'
import Drawer from '../../../components/ui/Drawer'
import Modal from '../../../components/ui/Modal'
import DateFilter from '../../../components/ui/DateFilter'
import SortIcon, { type SortDirection } from '../../../components/ui/SortIcon'
import {
  transactions as initialTransactions,
  getAmountTone,
  getTxFromTo,
  formatTxDateTime,
  isCashierServed,
  getCashierId,
  getRecognizedFee,
  getCommission,
  getNetRevenue,
  type Transaction,
  type TxStatus,
  type TxType,
  type TxChannel,
} from '../data'
import { maskAccount } from '../../../utils/mask'

const statusVariant = {
  Successful: 'positive',
  Pending: 'warning',
  Failed: 'negative',
} as const

const typeTone = {
  W2W: 'blue',
  'Cash In': 'green',
  'Cash Out': 'rose',
  'Loan Disbursement': 'orange',
  'Loan Repayment': 'amber',
} as const

const txTypeIcon = {
  W2W: Send,
  'Cash In': ArrowDownRight,
  'Cash Out': ArrowUpRight,
  'Loan Disbursement': HandCoins,
  'Loan Repayment': HandCoins,
} as const

const recipientLabel = {
  W2W: 'Recipient wallet',
  'Cash In': 'Served by (cashier)',
  'Cash Out': 'Served by (cashier)',
  'Loan Disbursement': 'Loan account',
  'Loan Repayment': 'Loan account',
} as const

const statusOptions: Array<TxStatus | 'All'> = ['All', 'Successful', 'Pending', 'Failed']
const typeOptions: Array<TxType | 'All'> = [
  'All',
  'W2W',
  'Cash In',
  'Cash Out',
  'Loan Disbursement',
  'Loan Repayment',
]
const channelOptions: Array<TxChannel | 'All'> = ['All', 'Web App', 'USSD', 'Agent']

type TxSortKey = 'type' | 'status' | 'amount'

const PAGE_SIZE = 10

const formatAmount = (value: number) => `TSh ${Math.round(value).toLocaleString()}`

interface ActionMenuState {
  id: string
  top: number
  left: number
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<TxStatus | 'All'>('All')
  const [type, setType] = useState<TxType | 'All'>('All')
  const [channel, setChannel] = useState<TxChannel | 'All'>('All')
  const [date, setDate] = useState('')
  const [sortKey, setSortKey] = useState<TxSortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null)
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return transactions.filter((tx) => {
      const matchesQuery =
        tx.customer.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q) ||
        tx.type.toLowerCase().includes(q)
      const matchesStatus = status === 'All' || tx.status === status
      const matchesType = type === 'All' || tx.type === type
      const matchesChannel = channel === 'All' || tx.channel === channel
      const matchesDate = !date || tx.date === date
      return matchesQuery && matchesStatus && matchesType && matchesChannel && matchesDate
    })
  }, [transactions, query, status, type, channel, date])

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) {
      // Default: most recent transaction first.
      return [...filtered].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
    }
    const direction = sortDir === 'asc' ? 1 : -1
    const compare: Record<TxSortKey, (a: Transaction, b: Transaction) => number> = {
      type: (a, b) => a.type.localeCompare(b.type),
      status: (a, b) => a.status.localeCompare(b.status),
      amount: (a, b) => a.amount - b.amount,
    }
    return [...filtered].sort((a, b) => compare[sortKey](a, b) * direction)
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key: TxSortKey) => {
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

  const selected: Transaction | null = transactions.find((tx) => tx.id === selectedId) ?? null

  const successfulCount = transactions.filter((tx) => tx.status === 'Successful').length
  const pendingCount = transactions.filter((tx) => tx.status === 'Pending').length
  const failedCount = transactions.filter((tx) => tx.status === 'Failed').length

  const totalVolume = transactions
    .filter((tx) => tx.status === 'Successful')
    .reduce((sum, tx) => sum + tx.amount, 0)

  const resetToFirstPage = () => setPage(1)

  const closeActionMenu = () => setActionMenu(null)

  const toggleActionMenu = (id: string) => {
    if (actionMenu?.id === id) {
      closeActionMenu()
      return
    }
    const button = menuButtonRefs.current[id]
    if (!button) return
    const rect = button.getBoundingClientRect()
    setActionMenu({ id, top: rect.bottom + 6, left: rect.right - 160 })
  }

  const openTransaction = (id: string) => {
    setSelectedId(id)
    setDrawerOpen(true)
    closeActionMenu()
  }

  const requestDelete = (id: string) => {
    const tx = transactions.find((item) => item.id === id)
    if (!tx) return
    setDeleteTarget(tx)
    closeActionMenu()
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setTransactions((prev) => prev.filter((tx) => tx.id !== deleteTarget.id))
    if (selectedId === deleteTarget.id) {
      setDrawerOpen(false)
    }
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Transactions</h1>
        <p className="mt-1 text-sm text-muted">
          Monitor and manage wallet, bank, and cashier transactions across the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          tone="brand"
          label="Transaction Volume"
          value={formatAmount(totalVolume)}
        />
        <StatCard
          icon={CircleCheck}
          tone="positive"
          label="Successful Transactions"
          value={String(successfulCount)}
        />
        <StatCard
          icon={Clock}
          tone="warning"
          label="Pending Transactions"
          value={String(pendingCount)}
        />
        <StatCard
          icon={XCircle}
          tone="negative"
          label="Failed Transactions"
          value={String(failedCount)}
        />
      </div>

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
            placeholder="Search by transaction ID, customer or type..."
            className="w-full rounded-full border border-transparent bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as TxStatus | 'All')
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

          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value as TxType | 'All')
              resetToFirstPage()
            }}
            className="rounded-full border border-transparent bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          >
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All types' : option}
              </option>
            ))}
          </select>

          <select
            value={channel}
            onChange={(event) => {
              setChannel(event.target.value as TxChannel | 'All')
              resetToFirstPage()
            }}
            className="rounded-full border border-transparent bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          >
            {channelOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All channels' : option}
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
                <th className="px-6 py-3 font-semibold">Transaction ID</th>
                <th className="px-6 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('type')}
                    className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                  >
                    Transaction Type
                    <SortIcon direction={sortKey === 'type' ? sortDir : null} />
                  </button>
                </th>
                <th className="px-6 py-3 font-semibold">From</th>
                <th className="px-6 py-3 font-semibold">To</th>
                <th className="px-6 py-3 font-semibold">Account Number</th>
                <th className="px-6 py-3 font-semibold">Channel</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 text-right font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('amount')}
                    className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                  >
                    Amount
                    <SortIcon direction={sortKey === 'amount' ? sortDir : null} />
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
                <th className="px-6 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map((tx, index) => {
                const { from, to } = getTxFromTo(tx)
                return (
                  <tr
                    key={tx.id}
                    onClick={() => openTransaction(tx.id)}
                    className="cursor-pointer transition-colors hover:bg-surface"
                  >
                    <td className="px-6 py-3.5 text-xs text-muted">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-muted">{tx.id}</td>
                    <td className="px-6 py-3.5">
                      <TypeBadge tone={typeTone[tx.type]} label={tx.type} />
                    </td>
                    <td className="max-w-40 truncate px-6 py-3.5 text-ink/80">{from}</td>
                    <td className="max-w-40 truncate px-6 py-3.5 text-ink/80">{to}</td>
                    <td className="px-6 py-3.5 font-mono text-ink/70">{maskAccount(tx.phone)}</td>
                    <td className="px-6 py-3.5 text-ink/70">{tx.channel}</td>
                    <td className="px-6 py-3.5 text-ink/70">{formatTxDateTime(tx)}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-ink">
                      {formatAmount(tx.amount)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={statusVariant[tx.status]} label={tx.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        ref={(node) => {
                          menuButtonRefs.current[tx.id] = node
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleActionMenu(tx.id)
                        }}
                        aria-label="Row actions"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink/80 transition-colors hover:border-brand hover:bg-brand hover:text-white"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-sm text-muted">
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

      <AnimatePresence>
        {actionMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeActionMenu} />
            <motion.div
              key="action-menu"
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="fixed z-50 w-40 origin-top-right overflow-hidden rounded-xl bg-white py-1 shadow-xl ring-1 ring-line"
              style={{ top: actionMenu.top, left: actionMenu.left }}
            >
              <button
                type="button"
                onClick={() => openTransaction(actionMenu.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-brand hover:text-white"
              >
                <Eye size={14} /> View
              </button>
              <button
                type="button"
                onClick={() => requestDelete(actionMenu.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white"
              >
                <Trash2 size={14} /> Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Transaction detail"
        footer={
          selected ? (
            <>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
              >
                <Receipt size={16} /> Receipt
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700"
              >
                <RotateCcw size={16} /> Reverse
              </button>
            </>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <ArrowLeftRight size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">Transaction ID</p>
                <p className="truncate font-mono text-base font-bold text-ink">{selected.id}</p>
              </div>
              <StatusBadge status={statusVariant[selected.status]} label={selected.status} />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Overview</p>
              <div className="mt-3 divide-y divide-line rounded-xl ring-1 ring-line">
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <User size={16} />
                    </span>
                    <p className="text-xs text-muted">Customer</p>
                  </div>
                  <p className="min-w-0 truncate text-sm font-semibold text-ink">{selected.customer}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CreditCard size={16} />
                    </span>
                    <p className="text-xs text-muted">Account Number</p>
                  </div>
                  <p className="shrink-0 truncate font-mono text-sm font-semibold text-ink">
                    {selected.phone}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Wallet size={16} />
                    </span>
                    <p className="text-xs text-muted">Amount</p>
                  </div>
                  <p className={`shrink-0 text-sm font-semibold ${getAmountTone(selected.type)}`}>
                    {formatAmount(selected.amount)}
                  </p>
                </div>
                {selected.recipientName &&
                  !isCashierServed(selected) &&
                  (() => {
                    const RecipientIcon = txTypeIcon[selected.type]
                    return (
                      <div className="flex items-center justify-between gap-3 p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                            <RecipientIcon size={16} />
                          </span>
                          <p className="text-xs text-muted">{recipientLabel[selected.type]}</p>
                        </div>
                        <div className="min-w-0 shrink-0 text-right">
                          <p className="truncate text-sm font-semibold text-ink">{selected.recipientName}</p>
                          <p className="truncate font-mono text-xs text-muted">{selected.recipientAccount}</p>
                        </div>
                      </div>
                    )
                  })()}
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Tag size={16} />
                    </span>
                    <p className="text-xs text-muted">Transaction Type</p>
                  </div>
                  <TypeBadge tone={typeTone[selected.type]} label={selected.type} />
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Globe size={16} />
                    </span>
                    <p className="text-xs text-muted">Channel</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{selected.channel}</p>
                </div>
                {isCashierServed(selected) && (
                  <>
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <Hash size={16} />
                        </span>
                        <p className="text-xs text-muted">Cashier ID</p>
                      </div>
                      <p className="shrink-0 truncate font-mono text-sm font-semibold text-ink">
                        {getCashierId(selected.recipientName)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <UserCog size={16} />
                        </span>
                        <p className="text-xs text-muted">Cashier Name</p>
                      </div>
                      <p className="min-w-0 truncate text-sm font-semibold text-ink">
                        {selected.recipientName}
                      </p>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Percent size={16} />
                    </span>
                    <p className="text-xs text-muted">Fee</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">
                    {formatAmount(getRecognizedFee(selected))}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <HandCoins size={16} />
                    </span>
                    <p className="text-xs text-muted">Commission</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">
                    {formatAmount(getCommission(selected))}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Receipt size={16} />
                    </span>
                    <p className="text-xs text-muted">Net Revenue</p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold ${
                      getNetRevenue(selected) < 0 ? 'text-red-600' : 'text-ink'
                    }`}
                  >
                    {formatAmount(getNetRevenue(selected))}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CalendarDays size={16} />
                    </span>
                    <p className="text-xs text-muted">Date &amp; Time</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{formatTxDateTime(selected)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={16} />
            </span>
            Delete transaction
          </>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-ink/80">
          Are you sure you want to delete transaction{' '}
          <span className="font-mono font-semibold text-ink">{deleteTarget?.id}</span>? This action cannot be
          undone.
        </p>
      </Modal>
    </div>
  )
}
