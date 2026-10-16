import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Banknote,
  HandCoins,
  Wallet,
  AlertTriangle,
  Download,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Eye,
  ArrowLeftRight,
  User,
  CreditCard,
  Tag,
  Globe,
  Percent,
  Send,
  Landmark,
  UserCog,
  Receipt,
  RotateCcw,
  Clock,
  Lock,
  FileText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge from '../../../components/ui/StatusBadge'
import TypeBadge from '../../../components/ui/TypeBadge'
import Drawer from '../../../components/ui/Drawer'
import { loanOverview, overviewStats } from '../../overview/data'
import { transactions } from '../../transactions/data'
import { maskAccount } from '../../../utils/mask'
import { financialStats, cashFlowDaily, floatManagement } from '../data'

const txStatusVariant = {
  Successful: 'positive',
  Pending: 'warning',
  Failed: 'negative',
} as const

const typeTone = {
  'Wallet Transfer': 'blue',
  'Bank Transfer': 'green',
  'Cashier Topup': 'purple',
  Withdraw: 'rose',
} as const

const quickActions = [
  { label: 'Transfer Funds', icon: ArrowLeftRight, tone: 'bg-purple-100 text-purple-600' },
  { label: 'Loan Management', icon: HandCoins, tone: 'bg-orange-100 text-orange-600' },
  { label: 'View Reports', icon: FileText, tone: 'bg-ink text-white' },
] as const

const floatIcon = {
  'Main Wallet': Wallet,
  'Cashier Floats': UserCog,
  'Pending Settlements': Clock,
  'Blocked Funds': Lock,
} as const

const floatStatusVariant = {
  Available: 'positive',
  Processing: 'warning',
  Blocked: 'negative',
} as const

const RECENT_TRANSACTIONS_PAGE_SIZE = 10

// Draw order: back → front. Legend reverses this to lead with the primary series.
const cashFlowSeries = [
  { key: 'balance', name: 'Balance', color: 'var(--color-muted)' },
  { key: 'withdrawals', name: 'Withdrawals', color: 'var(--color-chart-red)' },
  { key: 'loans', name: 'Loans', color: 'var(--color-chart-amber)' },
  { key: 'deposits', name: 'Deposits', color: 'var(--color-chart-green)' },
] as const

function currency(value: number) {
  return `TSh ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDisplayDate(value: string) {
  const [year, month, day] = value.split('-')
  return `${day} ${SHORT_MONTHS[Number(month) - 1]} ${year}`
}

function number(value: number) {
  return value.toLocaleString()
}

function escapeCsvCell(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// Cashiers use their float account code (e.g. "FA-384021"), not a phone number, so only
// mask values that actually look like a phone number; masking a float code would just
// mangle it into something unrecognizable.
function displayAccount(value: string) {
  return value.startsWith('+') ? maskAccount(value) : value
}

// Cashier Topup is filed under the receiving customer's own wallet, so the usual
// customer→recipient direction is reversed: the cashier is the source, not the destination.
function getTxFlow(tx: (typeof transactions)[number]) {
  if (tx.type === 'Cashier Topup') {
    return {
      fromName: tx.recipientName ?? tx.customer,
      fromAccount: tx.recipientAccount ?? tx.phone,
      toName: tx.customer,
    }
  }
  return {
    fromName: tx.customer,
    fromAccount: tx.phone,
    toName: tx.recipientName ?? 'N/A',
  }
}

function exportTransactionsCsv(rows: typeof transactions) {
  const header = [
    'Transaction ID',
    'From',
    'Account',
    'Type',
    'To',
    'Channel',
    'Amount',
    'Fee',
    'Status',
    'Date',
  ]
  const lines = [
    header,
    ...rows.map((row) => {
      const { fromName, fromAccount, toName } = getTxFlow(row)
      return [
        row.id,
        fromName,
        fromAccount,
        row.type,
        toName,
        row.channel,
        row.amount.toFixed(2),
        row.fee.toFixed(2),
        row.status,
        row.date,
      ]
    }),
  ]
  const csv = lines.map((line) => line.map(escapeCsvCell).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `recent-financial-transactions-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

interface PanelRowProps {
  icon: LucideIcon
  label: string
  value: string
  delta?: number
}

function PanelRow({ icon: Icon, label, value, delta }: PanelRowProps) {
  const isUp = delta !== undefined && delta >= 0

  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon size={18} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-muted">{label}</p>
        <p className="text-lg font-bold text-ink">{value}</p>
      </div>
      {delta !== undefined && (
        <span className={`shrink-0 text-xs font-semibold ${isUp ? 'text-green-700' : 'text-red-700'}`}>
          {isUp ? '+' : ''}
          {delta}%
        </span>
      )}
    </div>
  )
}

export default function Financial() {
  const [dateRange, setDateRange] = useState({ start: '2026-10-01', end: '2026-10-31' })
  const [draftRange, setDraftRange] = useState(dateRange)
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const filteredCashFlow = useMemo(
    () => cashFlowDaily.filter((point) => point.date >= dateRange.start && point.date <= dateRange.end),
    [dateRange],
  )

  const [recentPage, setRecentPage] = useState(1)
  const recentTotalPages = Math.max(1, Math.ceil(transactions.length / RECENT_TRANSACTIONS_PAGE_SIZE))
  const recentTransactions = transactions.slice(
    (recentPage - 1) * RECENT_TRANSACTIONS_PAGE_SIZE,
    recentPage * RECENT_TRANSACTIONS_PAGE_SIZE,
  )

  const [selectedTxId, setSelectedTxId] = useState<string | null>(null)
  const [txDrawerOpen, setTxDrawerOpen] = useState(false)
  const selectedTx = transactions.find((tx) => tx.id === selectedTxId) ?? null

  const openTxDetail = (id: string) => {
    setSelectedTxId(id)
    setTxDrawerOpen(true)
  }

  const openDatePicker = () => {
    setDraftRange(dateRange)
    setDatePickerOpen(true)
  }

  const applyDateRange = () => {
    if (draftRange.start > draftRange.end) return
    setDateRange(draftRange)
    setDatePickerOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Financial Management</h1>
          <p className="mt-1 text-sm text-muted">
            Monitor financial activities, manage float, and track platform settlements.
          </p>
        </div>

        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => (datePickerOpen ? setDatePickerOpen(false) : openDatePicker())}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-line transition-colors hover:border-brand"
          >
            <CalendarDays size={16} className="text-muted" />
            {formatDisplayDate(dateRange.start)} to {formatDisplayDate(dateRange.end)}
            <ChevronDown
              size={16}
              className={`text-muted transition-transform duration-200 ${datePickerOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {datePickerOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDatePickerOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-line bg-white p-4 shadow-xl shadow-ink/10"
                >
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted">From</label>
                      <input
                        type="date"
                        value={draftRange.start}
                        max={draftRange.end}
                        onChange={(event) =>
                          setDraftRange((prev) => ({ ...prev, start: event.target.value }))
                        }
                        className="mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted">To</label>
                      <input
                        type="date"
                        value={draftRange.end}
                        min={draftRange.start}
                        onChange={(event) =>
                          setDraftRange((prev) => ({ ...prev, end: event.target.value }))
                        }
                        className="mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyDateRange}
                      className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          tone="brand"
          label="Total Balance (System)"
          value={currency(overviewStats.totalWalletBalance)}
          delta={overviewStats.totalWalletBalanceDelta}
          deltaLabel="Across all wallets"
        />
        <StatCard
          icon={ArrowDownRight}
          tone="positive"
          label="Total Deposits"
          value={currency(financialStats.totalDeposits)}
          delta={financialStats.totalDepositsDelta}
          deltaLabel="This period"
        />
        <StatCard
          icon={ArrowUpRight}
          tone="accent"
          label="Total Withdrawals"
          value={currency(financialStats.totalWithdrawals)}
          delta={financialStats.totalWithdrawalsDelta}
          deltaLabel="This period"
        />
        <StatCard
          icon={Banknote}
          tone="warning"
          label="Total Fees"
          value={currency(financialStats.totalRevenue)}
          delta={financialStats.totalRevenueDelta}
          deltaLabel="This period"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-bold text-ink">Cash Flow Overview</h2>
            <div className="flex flex-wrap items-center gap-4">
              {[...cashFlowSeries].reverse().map((series) => (
                <span key={series.key} className="flex items-center gap-1.5 text-xs font-medium text-ink/70">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: series.color }} />
                  {series.name}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredCashFlow} margin={{ left: 0, right: 10, top: 10 }}>
                <defs>
                  {cashFlowSeries.map((series) => (
                    <linearGradient key={series.key} id={`${series.key}Fill`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={series.color} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={series.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tickFormatter={(value) => `TSh ${Number(value).toLocaleString()}`}
                />
                <Tooltip
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(11,18,32,0.1)',
                  }}
                  formatter={(value, name) => [`TSh ${Number(value).toLocaleString()}`, name]}
                />
                {cashFlowSeries.map((series) => (
                  <Area
                    key={series.key}
                    type="monotone"
                    dataKey={series.key}
                    name={series.name}
                    stroke={series.color}
                    strokeWidth={2}
                    fill={`url(#${series.key}Fill)`}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
          <h2 className="text-base font-bold text-ink">Float Management</h2>
          <div className="mt-1 divide-y divide-line">
            {floatManagement.map((account) => {
              const Icon = floatIcon[account.label]
              return (
                <div key={account.label} className="flex items-center gap-3 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-muted">{account.label}</p>
                    <p className="text-sm font-bold text-ink">{currency(account.value)}</p>
                  </div>
                  <StatusBadge status={floatStatusVariant[account.status]} label={account.status} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
          <h2 className="text-base font-bold text-ink">Quick Actions</h2>
          <div className="mt-3 divide-y divide-line">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:rounded-xl hover:bg-surface"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.tone}`}
                >
                  <action.icon size={18} />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{action.label}</span>
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
          <h2 className="text-base font-bold text-ink">Loan Summary</h2>
          <div className="mt-1 divide-y divide-line">
            <PanelRow
              icon={HandCoins}
              label="Total Loans Disbursed"
              value={currency(loanOverview.disbursed)}
              delta={loanOverview.disbursedDelta}
            />
            <PanelRow
              icon={Wallet}
              label="Outstanding Principal"
              value={currency(financialStats.outstanding)}
              delta={financialStats.outstandingDelta}
            />
            <PanelRow
              icon={AlertTriangle}
              label="Overdue Loans"
              value={number(loanOverview.overdueLoans)}
              delta={loanOverview.overdueLoansDelta}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-base font-bold text-ink">Recent Financial Transactions</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => exportTransactionsCsv(transactions)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-brand ring-1 ring-line transition-colors hover:bg-surface"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-6 py-3 font-semibold">Transaction ID</th>
                <th className="px-6 py-3 font-semibold">From</th>
                <th className="px-6 py-3 font-semibold">Account</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">To</th>
                <th className="px-6 py-3 text-right font-semibold">Amount</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentTransactions.map((tx, index) => {
                const { fromName, fromAccount, toName } = getTxFlow(tx)
                return (
                  <tr key={tx.id}>
                    <td className="px-6 py-3.5 text-xs text-muted">
                      {(recentPage - 1) * RECENT_TRANSACTIONS_PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-muted">{tx.id}</td>
                    <td className="px-6 py-3.5 font-medium text-ink">{fromName}</td>
                    <td className="px-6 py-3.5 font-mono text-ink/70">{displayAccount(fromAccount)}</td>
                    <td className="px-6 py-3.5">
                      <TypeBadge tone={typeTone[tx.type]} label={tx.type} />
                    </td>
                    <td className="px-6 py-3.5 text-ink/70">{toName}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-ink">
                      {currency(tx.amount)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={txStatusVariant[tx.status]} label={tx.status} />
                    </td>
                    <td className="px-6 py-3.5 text-ink/70">{tx.date}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openTxDetail(tx.id)}
                        aria-label="View transaction"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink/80 transition-colors hover:border-brand hover:bg-brand hover:text-white"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-line px-6 py-4 text-sm text-muted">
          <span>
            Page {recentPage} of {recentTotalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={recentPage === 1}
              onClick={() => setRecentPage((prev) => Math.max(1, prev - 1))}
              className="rounded-full border border-line px-3 py-1.5 font-medium text-ink/80 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink/80"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={recentPage === recentTotalPages}
              onClick={() => setRecentPage((prev) => Math.min(recentTotalPages, prev + 1))}
              className="rounded-full border border-line px-3 py-1.5 font-medium text-ink/80 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink/80"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Drawer
        open={txDrawerOpen}
        onClose={() => setTxDrawerOpen(false)}
        title="Transaction detail"
        footer={
          selectedTx ? (
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
        {selectedTx && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <ArrowLeftRight size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-base font-bold text-ink">{selectedTx.id}</p>
              </div>
              <StatusBadge status={txStatusVariant[selectedTx.status]} label={selectedTx.status} />
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
                  <p className="min-w-0 truncate text-sm font-semibold text-ink">{selectedTx.customer}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CreditCard size={16} />
                    </span>
                    <p className="text-xs text-muted">Account Number</p>
                  </div>
                  <p className="shrink-0 truncate font-mono text-sm font-semibold text-ink">
                    {selectedTx.phone}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Wallet size={16} />
                    </span>
                    <p className="text-xs text-muted">Amount</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{currency(selectedTx.amount)}</p>
                </div>
                {(selectedTx.type === 'Wallet Transfer' ||
                  selectedTx.type === 'Bank Transfer' ||
                  selectedTx.type === 'Cashier Topup') &&
                  selectedTx.recipientName && (
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          {selectedTx.type === 'Wallet Transfer' ? (
                            <Send size={16} />
                          ) : selectedTx.type === 'Bank Transfer' ? (
                            <Landmark size={16} />
                          ) : (
                            <UserCog size={16} />
                          )}
                        </span>
                        <p className="text-xs text-muted">
                          {selectedTx.type === 'Wallet Transfer'
                            ? 'Recipient wallet'
                            : selectedTx.type === 'Bank Transfer'
                              ? 'Recipient bank'
                              : 'Topped up by (cashier)'}
                        </p>
                      </div>
                      <div className="min-w-0 shrink-0 text-right">
                        <p className="truncate text-sm font-semibold text-ink">
                          {selectedTx.recipientName}
                        </p>
                        <p className="truncate font-mono text-xs text-muted">
                          {selectedTx.recipientAccount}
                        </p>
                      </div>
                    </div>
                  )}
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Tag size={16} />
                    </span>
                    <p className="text-xs text-muted">Type</p>
                  </div>
                  <TypeBadge tone={typeTone[selectedTx.type]} label={selectedTx.type} />
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Globe size={16} />
                    </span>
                    <p className="text-xs text-muted">Channel</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{selectedTx.channel}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Percent size={16} />
                    </span>
                    <p className="text-xs text-muted">Fee</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">
                    {selectedTx.fee > 0 ? currency(selectedTx.fee) : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CalendarDays size={16} />
                    </span>
                    <p className="text-xs text-muted">Date</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{selectedTx.date}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-line pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Ledger entries</p>
              <div className="mt-3 divide-y divide-line rounded-xl ring-1 ring-line">
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
                      <ArrowUpRight size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">Debit</p>
                      <p className="truncate text-xs text-muted">{selectedTx.customer} wallet</p>
                    </div>
                  </div>
                  <p className="shrink-0 font-mono text-sm font-semibold text-red-600">
                    -{currency(selectedTx.amount)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                      <ArrowDownRight size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">Credit</p>
                      <p className="truncate text-xs text-muted">Fee income account</p>
                    </div>
                  </div>
                  <p className="shrink-0 font-mono text-sm font-semibold text-green-700">
                    +{selectedTx.fee > 0 ? currency(selectedTx.fee) : 'TSh 0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
