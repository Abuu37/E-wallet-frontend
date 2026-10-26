import { useMemo, useState } from 'react'
import {
  Search,
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Send,
  HandCoins,
  Receipt,
  RotateCcw,
  Hash,
  User,
  UserCog,
  CreditCard,
  Wallet,
  Tag,
  Globe,
  Percent,
  CalendarDays,
  Landmark,
} from 'lucide-react'
import TypeBadge from './TypeBadge'
import StatusBadge, { type StatusBadgeVariant } from './StatusBadge'
import Drawer from './Drawer'
import DateFilter from './DateFilter'
import SortIcon, { type SortDirection } from './SortIcon'
import {
  getAmountTone,
  getTxFromTo,
  formatTxDateTime,
  isCashierServed,
  getCashierId,
  type Transaction,
  type TxStatus,
  type TxType,
  type TxChannel,
} from '../../features/transactions/data'
import { maskAccount } from '../../utils/mask'

const txStatusVariant: Record<TxStatus, StatusBadgeVariant> = {
  Successful: 'positive',
  Pending: 'warning',
  Failed: 'negative',
}

const txTypeIcon: Record<TxType, typeof Send> = {
  W2W: Send,
  'Cash In': ArrowDownRight,
  'Cash Out': ArrowUpRight,
  W2B: Landmark,
  'Loan Disbursement': HandCoins,
  'Loan Repayment': HandCoins,
}

const typeTone = {
  W2W: 'blue',
  'Cash In': 'green',
  'Cash Out': 'rose',
  W2B: 'rose',
  'Loan Disbursement': 'orange',
  'Loan Repayment': 'amber',
} as const

const recipientLabel: Record<TxType, string> = {
  W2W: 'Recipient wallet',
  'Cash In': 'Served by (cashier)',
  'Cash Out': 'Served by (cashier)',
  W2B: 'Bank account',
  'Loan Disbursement': 'Loan account',
  'Loan Repayment': 'Loan account',
}

const txStatusOptions: Array<TxStatus | 'All'> = ['All', 'Successful', 'Pending', 'Failed']
const txTypeOptions: Array<TxType | 'All'> = [
  'All',
  'W2W',
  'Cash In',
  'Cash Out',
  'W2B',
  'Loan Disbursement',
  'Loan Repayment',
]
const txChannelOptions: Array<TxChannel | 'All'> = ['All', 'Web App', 'USSD', 'Agent']

const TX_PAGE_SIZE = 10

const formatAmount = (value: number) => `TSh ${Math.round(value).toLocaleString()}`

interface TransactionHistoryViewProps {
  subjectName: string
  subjectPhone: string
  statusBadge?: { variant: StatusBadgeVariant; label: string } | null
  onBack: () => void
  backAriaLabel: string
  transactions: Transaction[]
  emptyMessage: string
  /** Show the recipient/served-by row in the transaction detail drawer. */
  showRecipient?: boolean
}

export default function TransactionHistoryView({
  subjectName,
  subjectPhone,
  statusBadge,
  onBack,
  backAriaLabel,
  transactions,
  emptyMessage,
  showRecipient = false,
}: TransactionHistoryViewProps) {
  const [txQuery, setTxQuery] = useState('')
  const [txStatus, setTxStatus] = useState<TxStatus | 'All'>('All')
  const [txType, setTxType] = useState<TxType | 'All'>('All')
  const [txChannel, setTxChannel] = useState<TxChannel | 'All'>('All')
  const [txDate, setTxDate] = useState('')
  const [sortKey, setSortKey] = useState<'type' | 'status' | 'amount' | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)
  const [txPage, setTxPage] = useState(1)
  const [txDetailId, setTxDetailId] = useState<string | null>(null)
  const [txDetailOpen, setTxDetailOpen] = useState(false)

  const selectedTxDetail = useMemo(
    () => (txDetailId ? transactions.find((tx) => tx.id === txDetailId) ?? null : null),
    [txDetailId, transactions],
  )

  const openTxDetail = (id: string) => {
    setTxDetailId(id)
    setTxDetailOpen(true)
  }

  const txSummary = useMemo(
    () => ({
      total: transactions.length,
      successful: transactions.filter((tx) => tx.status === 'Successful').length,
      pending: transactions.filter((tx) => tx.status === 'Pending').length,
      failed: transactions.filter((tx) => tx.status === 'Failed').length,
      cashIn: transactions.filter((tx) => tx.type === 'Cash In').reduce((sum, tx) => sum + tx.amount, 0),
      cashOut: transactions.filter((tx) => tx.type === 'Cash Out').reduce((sum, tx) => sum + tx.amount, 0),
    }),
    [transactions],
  )

  const filteredTx = useMemo(() => {
    const q = txQuery.toLowerCase()
    return transactions.filter((tx) => {
      const matchesQuery = tx.id.toLowerCase().includes(q) || tx.type.toLowerCase().includes(q)
      const matchesStatus = txStatus === 'All' || tx.status === txStatus
      const matchesType = txType === 'All' || tx.type === txType
      const matchesChannel = txChannel === 'All' || tx.channel === txChannel
      const matchesDate = !txDate || tx.date === txDate
      return matchesQuery && matchesStatus && matchesType && matchesChannel && matchesDate
    })
  }, [transactions, txQuery, txStatus, txType, txChannel, txDate])

  const sortedTx = useMemo(() => {
    const list = [...filteredTx]
    if (!sortKey || !sortDir) {
      // Default: most recent transaction first.
      return list.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
    }
    const compare: Record<typeof sortKey, (a: Transaction, b: Transaction) => number> = {
      type: (a, b) => a.type.localeCompare(b.type),
      status: (a, b) => a.status.localeCompare(b.status),
      amount: (a, b) => a.amount - b.amount,
    }
    const direction = sortDir === 'asc' ? 1 : -1
    return list.sort((a, b) => compare[sortKey](a, b) * direction)
  }, [filteredTx, sortKey, sortDir])

  const toggleSort = (key: 'type' | 'status' | 'amount') => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortKey(null)
      setSortDir(null)
    }
    setTxPage(1)
  }

  const txTotalPages = Math.max(1, Math.ceil(sortedTx.length / TX_PAGE_SIZE))
  const txPageItems = sortedTx.slice((txPage - 1) * TX_PAGE_SIZE, txPage * TX_PAGE_SIZE)

  return (
    <div className="space-y-5">
      <div className="overflow-hidden bg-white ring-1 ring-line">
        <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label={backAriaLabel}
              className="group flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-white transition-colors hover:bg-brand/90"
            >
              <ArrowLeft size={18} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            </button>
            <div>
              <h2 className="text-base font-bold text-ink">Transaction History</h2>
              <p className="mt-0.5 text-xs text-muted">
                {subjectName} · {subjectPhone}
              </p>
            </div>
          </div>
          {statusBadge && <StatusBadge status={statusBadge.variant} label={statusBadge.label} />}
        </div>

        <div className="grid grid-cols-2 divide-x divide-y divide-line border-b border-line sm:grid-cols-3 lg:grid-cols-6 sm:divide-y-0">
          <div className="px-6 py-5">
            <p className="text-xs text-muted">Total Transactions</p>
            <p className="mt-1 text-2xl font-extrabold text-ink">{txSummary.total}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs text-muted">Successful</p>
            <p className="mt-1 text-2xl font-extrabold text-green-700">{txSummary.successful}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs text-muted">Pending</p>
            <p className="mt-1 text-2xl font-extrabold text-amber-600">{txSummary.pending}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs text-muted">Failed</p>
            <p className="mt-1 text-2xl font-extrabold text-red-600">{txSummary.failed}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs text-muted">Total Cash In</p>
            <p className="mt-1 text-2xl font-extrabold text-green-700">{formatAmount(txSummary.cashIn)}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs text-muted">Total Cash Out</p>
            <p className="mt-1 text-2xl font-extrabold text-red-600">{formatAmount(txSummary.cashOut)}</p>
          </div>
        </div>

        <div className="px-6 pt-5">
          <p className="text-sm font-semibold text-ink">Transaction Records</p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:max-w-xs">
              <Search
                size={16}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="search"
                value={txQuery}
                onChange={(event) => {
                  setTxQuery(event.target.value)
                  setTxPage(1)
                }}
                placeholder="Search transaction ID or type..."
                className="w-full rounded-full border border-transparent bg-surface py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
              />
            </div>

            <select
              value={txType}
              onChange={(event) => {
                setTxType(event.target.value as TxType | 'All')
                setTxPage(1)
              }}
              className="rounded-full border border-transparent bg-surface px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
            >
              {txTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All types' : option}
                </option>
              ))}
            </select>

            <select
              value={txStatus}
              onChange={(event) => {
                setTxStatus(event.target.value as TxStatus | 'All')
                setTxPage(1)
              }}
              className="rounded-full border border-transparent bg-surface px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
            >
              {txStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All statuses' : option}
                </option>
              ))}
            </select>

            <select
              value={txChannel}
              onChange={(event) => {
                setTxChannel(event.target.value as TxChannel | 'All')
                setTxPage(1)
              }}
              className="rounded-full border border-transparent bg-surface px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
            >
              {txChannelOptions.map((option) => (
                <option key={option} value={option}>
                  {option === 'All' ? 'All channels' : option}
                </option>
              ))}
            </select>

            <DateFilter
              value={txDate}
              onChange={(value) => {
                setTxDate(value)
                setTxPage(1)
              }}
              variant="surface"
            />
          </div>
        </div>

        <div className="overflow-x-auto px-6">
          {txPageItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              {transactions.length === 0 ? emptyMessage : 'No transactions match your filters.'}
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="whitespace-nowrap py-3 pr-4 font-semibold">#</th>
                  <th className="whitespace-nowrap py-3 pr-4 font-semibold">Transaction ID</th>
                  <th className="whitespace-nowrap py-3 pr-4 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort('type')}
                      className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                    >
                      Transaction Type
                      <SortIcon direction={sortKey === 'type' ? sortDir : null} />
                    </button>
                  </th>
                  <th className="whitespace-nowrap py-3 pr-4 font-semibold">From</th>
                  <th className="whitespace-nowrap py-3 pr-4 font-semibold">To</th>
                  <th className="whitespace-nowrap py-3 pr-4 font-semibold">Account Number</th>
                  <th className="whitespace-nowrap py-3 pr-4 font-semibold">Channel</th>
                  <th className="whitespace-nowrap py-3 pr-4 font-semibold">Date</th>
                  <th className="whitespace-nowrap py-3 pr-4 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort('status')}
                      className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                    >
                      Status
                      <SortIcon direction={sortKey === 'status' ? sortDir : null} />
                    </button>
                  </th>
                  <th className="whitespace-nowrap py-3 text-right font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort('amount')}
                      className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                    >
                      Amount
                      <SortIcon direction={sortKey === 'amount' ? sortDir : null} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {txPageItems.map((tx, index) => {
                  const { from, to } = getTxFromTo(tx)
                  return (
                    <tr
                      key={tx.id}
                      onClick={() => openTxDetail(tx.id)}
                      className="cursor-pointer transition-colors hover:bg-surface"
                    >
                      <td className="whitespace-nowrap py-3.5 pr-4 text-xs text-muted">
                        {(txPage - 1) * TX_PAGE_SIZE + index + 1}
                      </td>
                      <td className="whitespace-nowrap py-3.5 pr-4 font-mono text-xs font-bold text-ink">
                        {tx.id}
                      </td>
                      <td className="whitespace-nowrap py-3.5 pr-4">
                        <TypeBadge tone={typeTone[tx.type]} label={tx.type} />
                      </td>
                      <td className="max-w-40 truncate py-3.5 pr-4 text-ink/80">{from}</td>
                      <td className="max-w-40 truncate py-3.5 pr-4 text-ink/80">{to}</td>
                      <td className="whitespace-nowrap py-3.5 pr-4 font-mono text-ink/70">
                        {maskAccount(tx.phone)}
                      </td>
                      <td className="whitespace-nowrap py-3.5 pr-4 text-ink/70">{tx.channel}</td>
                      <td className="whitespace-nowrap py-3.5 pr-4 text-ink/70">{formatTxDateTime(tx)}</td>
                      <td className="whitespace-nowrap py-3.5 pr-4">
                        <StatusBadge status={txStatusVariant[tx.status]} label={tx.status} />
                      </td>
                      <td className="whitespace-nowrap py-3.5 text-right font-semibold text-ink">
                        {formatAmount(tx.amount)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-line px-6 py-4 text-sm text-muted">
          <span>
            Page {txPage} of {txTotalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={txPage === 1}
              onClick={() => setTxPage((prev) => Math.max(1, prev - 1))}
              className="rounded-full border border-line px-3 py-1.5 font-medium
               text-ink/80 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40
                disabled:hover:border-line disabled:hover:text-ink/80"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={txPage === txTotalPages}
              onClick={() => setTxPage((prev) => Math.min(txTotalPages, prev + 1))}
              className="rounded-full border border-line px-3 py-1.5 font-medium
               text-ink/80 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40
                disabled:hover:border-line disabled:hover:text-ink/80"
            >
              Next
            </button>      
          </div>
        </div>
      </div>

      <Drawer
        open={txDetailOpen}
        onClose={() => setTxDetailOpen(false)}
        title="Transaction detail"
        footer={
          selectedTxDetail ? (
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
        {selectedTxDetail && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <ArrowLeftRight size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">Transaction ID</p>
                <p className="truncate font-mono text-base font-bold text-ink">{selectedTxDetail.id}</p>
              </div>
              <StatusBadge status={txStatusVariant[selectedTxDetail.status]} label={selectedTxDetail.status} />
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
                  <p className="min-w-0 truncate text-sm font-semibold text-ink">{selectedTxDetail.customer}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CreditCard size={16} />
                    </span>
                    <p className="text-xs text-muted">Account Number</p>
                  </div>
                  <p className="shrink-0 truncate font-mono text-sm font-semibold text-ink">
                    {selectedTxDetail.phone}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Wallet size={16} />
                    </span>
                    <p className="text-xs text-muted">Amount</p>
                  </div>
                  <p className={`shrink-0 text-sm font-semibold ${getAmountTone(selectedTxDetail.type)}`}>
                    {formatAmount(selectedTxDetail.amount)}
                  </p>
                </div>
                {showRecipient &&
                  selectedTxDetail.recipientName &&
                  !isCashierServed(selectedTxDetail) &&
                  (() => {
                    const RecipientIcon = txTypeIcon[selectedTxDetail.type]
                    return (
                      <div className="flex items-center justify-between gap-3 p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                            <RecipientIcon size={16} />
                          </span>
                          <p className="text-xs text-muted">{recipientLabel[selectedTxDetail.type]}</p>
                        </div>
                        <div className="min-w-0 shrink-0 text-right">
                          <p className="truncate text-sm font-semibold text-ink">
                            {selectedTxDetail.recipientName}
                          </p>
                          <p className="truncate font-mono text-xs text-muted">
                            {selectedTxDetail.recipientAccount}
                          </p>
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
                  <TypeBadge tone={typeTone[selectedTxDetail.type]} label={selectedTxDetail.type} />
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Globe size={16} />
                    </span>
                    <p className="text-xs text-muted">Channel</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{selectedTxDetail.channel}</p>
                </div>
                {isCashierServed(selectedTxDetail) && (
                  <>
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <Hash size={16} />
                        </span>
                        <p className="text-xs text-muted">Cashier ID</p>
                      </div>
                      <p className="shrink-0 truncate font-mono text-sm font-semibold text-ink">
                        {getCashierId(selectedTxDetail.recipientName)}
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
                        {selectedTxDetail.recipientName}
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
                    {selectedTxDetail.fee > 0 ? formatAmount(selectedTxDetail.fee) : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CalendarDays size={16} />
                    </span>
                    <p className="text-xs text-muted">Date &amp; Time</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{formatTxDateTime(selectedTxDetail)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
