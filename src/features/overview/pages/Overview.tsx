import { useMemo, useState } from 'react'
import TypeBadge from '../../../components/ui/TypeBadge'
import {
  UserCog,
  Users,
  Wallet,
  ArrowLeftRight,
  Building2,
  Landmark,
  Scale,
  Banknote,
  HandCoins,
  BadgeCheck,
  AlertTriangle,
  Download,
  Eye,
  User,
  CreditCard,
  Tag,
  Globe,
  Percent,
  Send,
  Receipt,
  RotateCcw,
  CalendarDays,
  ArrowDownRight,
  ArrowUpRight,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge from '../../../components/ui/StatusBadge'
import Drawer from '../../../components/ui/Drawer'
import {
  overviewStats,
  volumeByRange,
  volume30Day,
  transactionByType,
  loanOverview,
  type VolumeRange,
} from '../data'
import { transactions, getAmountTone, formatTxDateTime } from '../../transactions/data'
import { chartOfAccounts, getAccountBalance, TRUST_ACCOUNT_BALANCE } from '../../ledger/data'
import { maskAccount } from '../../../utils/mask'

const txStatusVariant = {
  Successful: 'positive',
  Pending: 'warning',
  Failed: 'negative',
} as const

const RECENT_TRANSACTIONS_PAGE_SIZE = 10

const rangeOptions: { value: VolumeRange | 'custom'; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: '30day', label: '30-day' },
  { value: 'custom', label: 'Custom range' },
]

function currency(value: number) {
  return `TSh ${Math.round(value).toLocaleString()}`
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

// Types where the recorded counterparty is actually the source of funds (money flows
// INTO the customer's wallet), so the usual customer→recipient direction is reversed.
const incomingTypes = new Set(['Cash In', 'Loan Disbursement'])

function getTxFlow(tx: (typeof transactions)[number]) {
  if (incomingTypes.has(tx.type)) {
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

function exportTransactionsCsv(rows: typeof transactions) {
  const header = ['Transaction ID', 'From', 'Account', 'Type', 'To', 'Amount', 'Status', 'Date']
  const lines = [
    header,
    ...rows.map((row) => {
      const { fromName, fromAccount, toName } = getTxFlow(row)
      return [row.id, fromName, fromAccount, row.type, toName, row.amount.toFixed(2), row.status, row.date]
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

function RangeTabs({
  value,
  onChange,
}: {
  value: VolumeRange | 'custom'
  onChange: (next: VolumeRange | 'custom') => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-xl bg-surface p-1 ring-1 ring-line">
      {rangeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === option.value
              ? 'bg-white text-brand shadow-sm ring-1 ring-line'
              : 'text-muted hover:text-ink'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

interface PanelRowProps {
  icon: LucideIcon
  label: string
  value: string
}

function PanelRow({ icon: Icon, label, value }: PanelRowProps) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon size={18} />
      </span>
      <p className="min-w-0 flex-1 truncate text-sm text-muted">{label}</p>
      <p className="shrink-0 text-lg font-bold text-ink">{value}</p>
    </div>
  )
}

export default function Overview() {
  const [range, setRange] = useState<VolumeRange | 'custom'>('30day')
  const [customStart, setCustomStart] = useState(volume30Day[0].date)
  const [customEnd, setCustomEnd] = useState(volume30Day[volume30Day.length - 1].date)

  const volumeData = useMemo(() => {
    if (range === 'custom') {
      const filtered = volume30Day.filter((point) => point.date >= customStart && point.date <= customEnd)
      return filtered.length >= 2 ? filtered : volume30Day
    }
    return volumeByRange[range]
  }, [range, customStart, customEnd])

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

  const totalTypeShare = transactionByType.reduce((sum, entry) => sum + entry.value, 0)

  // Same figures as the Company Wallet screen — see features/wallets/pages/CompanyWallet.tsx.
  const balanceOf = (accountId: string) => {
    const account = chartOfAccounts.find((item) => item.id === accountId)
    return account ? getAccountBalance(account) : 0
  }
  const emoneyLiabilities =
    balanceOf('2000') + balanceOf('2005') + balanceOf('2010') + balanceOf('2020')
  const companyEquity = balanceOf('4000') - balanceOf('5000')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          A snapshot of platform activity across wallets, customers, and transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={UserCog}
          tone="brand"
          label="Total Cashiers"
          value={String(overviewStats.totalCashiers)}
        />
        <StatCard
          icon={Users}
          tone="accent"
          label="Total Customers"
          value={number(overviewStats.totalCustomers)}
        />
        <StatCard
          icon={Wallet}
          tone="brand"
          label="Total Wallet Balance"
          value={currency(overviewStats.totalWalletBalance)}
        />
        <StatCard
          icon={ArrowLeftRight}
          tone="brand"
          label="Total Transactions"
          value={number(overviewStats.totalTransactions)}
        />
        <StatCard
          icon={Building2}
          tone="positive"
          label="Company Equity"
          value={currency(companyEquity)}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5 xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-ink">Transaction volume</h2>
              <p className="text-xs text-muted">Number of transactions over time</p>
            </div>
            <RangeTabs value={range} onChange={setRange} />
          </div>

          {range === 'custom' && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
              <label className="flex items-center gap-1.5">
                From
                <input
                  type="date"
                  value={customStart}
                  min={volume30Day[0].date}
                  max={customEnd}
                  onChange={(event) => setCustomStart(event.target.value)}
                  className="rounded-lg border border-line px-2 py-1 text-xs text-ink"
                />
              </label>
              <label className="flex items-center gap-1.5">
                To
                <input
                  type="date"
                  value={customEnd}
                  min={customStart}
                  max={volume30Day[volume30Day.length - 1].date}
                  onChange={(event) => setCustomEnd(event.target.value)}
                  className="rounded-lg border border-line px-2 py-1 text-xs text-ink"
                />
              </label>
            </div>
          )}

          <div className="mt-4 h-80 sm:h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volumeData} margin={{ left: 0, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#cbd5e1" strokeDasharray="4 4" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  minTickGap={16}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#334155' }}
                  axisLine={false}
                  tickLine={false}
                  width={56}
                  tickFormatter={(value) => Number(value).toLocaleString()}
                />
                <Tooltip
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(11,18,32,0.1)',
                  }}
                  formatter={(value) => [`${Number(value).toLocaleString()}`, 'Transactions']}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#volumeFill)"
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
          <h2 className="text-base font-bold text-ink">Transactions by type</h2>
          <div className="relative mt-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 16, bottom: 16 }}>
                <Pie
                  data={transactionByType}
                  dataKey="value"
                  nameKey="type"
                  innerRadius={42}
                  outerRadius={64}
                  paddingAngle={2}
                  label={({ value }) => `${value}%`}
                  labelLine={false}
                >
                  {transactionByType.map((entry) => (
                    <Cell key={entry.type} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(11,18,32,0.1)',
                  }}
                  formatter={(value, name) => [`${value}%`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="text-xl font-extrabold text-ink">{totalTypeShare}%</p>
            </div>
          </div>
          <div className="mt-2 space-y-2">
            {transactionByType.map((entry) => (
              <div key={entry.type} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink/80">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.type}
                </span>
                <span className="font-semibold text-ink">{entry.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
          <h2 className="text-base font-bold text-ink">Company Wallet</h2>
          <div className="mt-1 divide-y divide-line">
            <PanelRow
              icon={Landmark}
              label="Trust Account Balance"
              value={currency(TRUST_ACCOUNT_BALANCE)}
            />
            <PanelRow icon={Scale} label="Liabilities" value={currency(emoneyLiabilities)} />
            <PanelRow icon={Banknote} label="Equity" value={currency(companyEquity)} />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
          <h2 className="text-base font-bold text-ink">Loan overview</h2>
          <div className="mt-1 divide-y divide-line">
            <PanelRow
              icon={BadgeCheck}
              label="Active Loans"
              value={number(loanOverview.activeLoans)}
            />
            <PanelRow
              icon={HandCoins}
              label="Paid Loans"
              value={number(loanOverview.repaymentLoans)}
            />
            <PanelRow
              icon={AlertTriangle}
              label="Overdue Loans"
              value={number(loanOverview.overdueLoans)}
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
                    <td className="px-6 py-3.5 text-ink/70">{formatTxDateTime(tx)}</td>
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
                <p className="text-xs text-muted">Transaction ID</p>
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
                  <p className={`shrink-0 text-sm font-semibold ${getAmountTone(selectedTx.type)}`}>
                    {currency(selectedTx.amount)}
                  </p>
                </div>
                {selectedTx.recipientName &&
                  (() => {
                    const RecipientIcon = txTypeIcon[selectedTx.type]
                    return (
                      <div className="flex items-center justify-between gap-3 p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                            <RecipientIcon size={16} />
                          </span>
                          <p className="text-xs text-muted">{recipientLabel[selectedTx.type]}</p>
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
                    )
                  })()}
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Tag size={16} />
                    </span>
                    <p className="text-xs text-muted">Transaction Type</p>
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
                    <p className="text-xs text-muted">Date &amp; Time</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{formatTxDateTime(selectedTx)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
