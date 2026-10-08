import { useMemo, useState } from 'react'
import {
  UserCog,
  Users,
  Wallet,
  ArrowLeftRight,
  Clock,
  Landmark,
  PiggyBank,
  UserPlus,
  HandCoins,
  BadgeCheck,
  AlertTriangle,
  Banknote,
  Download,
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
import {
  overviewStats,
  volumeByRange,
  volume30Day,
  transactionByType,
  walletOverview,
  loanOverview,
  recentOverviewTransactions,
  type VolumeRange,
} from '../data'

const statusVariant = {
  Successful: 'positive',
  Pending: 'warning',
  Failed: 'negative',
  Reversed: 'neutral',
} as const

const rangeOptions: { value: VolumeRange | 'custom'; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: '30day', label: '30-day' },
  { value: 'custom', label: 'Custom range' },
]

function currency(value: number) {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function number(value: number) {
  return value.toLocaleString()
}

// Keeps the country code and last 4 digits visible — the rest is masked for display security.
function maskAccount(account: string) {
  const countryCode = account.match(/^\+\d+/)?.[0] ?? ''
  const digits = account.replace(/\D/g, '')
  return `${countryCode} **** **** ${digits.slice(-4)}`.trim()
}

function escapeCsvCell(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function exportTransactionsCsv(rows: typeof recentOverviewTransactions) {
  const header = ['ID', 'Customer', 'Type', 'Account Number', 'Amount', 'Status']
  const lines = [header, ...rows.map((tx) => [tx.id, tx.customer, tx.type, tx.account, tx.amount.toFixed(2), tx.status])]
  const csv = lines.map((line) => line.map(escapeCsvCell).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `recent-transactions-${new Date().toISOString().slice(0, 10)}.csv`
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
        <span
          className={`shrink-0 text-xs font-semibold ${isUp ? 'text-green-700' : 'text-red-700'}`}
        >
          {isUp ? '+' : ''}
          {delta}%
        </span>
      )}
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

  const recentTransactions = recentOverviewTransactions

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatCard
          icon={UserCog}
          tone="brand"
          label="Total Cashiers"
          value={String(overviewStats.totalCashiers)}
          delta={overviewStats.totalCashiersDelta}
        />
        <StatCard
          icon={Users}
          tone="accent"
          label="Total Customers"
          value={number(overviewStats.totalCustomers)}
          delta={overviewStats.totalCustomersDelta}
        />
        <StatCard
          icon={Wallet}
          tone="positive"
          label="Total Wallet Balance"
          value={currency(overviewStats.totalWalletBalance)}
          delta={overviewStats.totalWalletBalanceDelta}
        />
        <StatCard
          icon={ArrowLeftRight}
          tone="brand"
          label="Total Transactions"
          value={number(overviewStats.totalTransactions)}
          delta={overviewStats.totalTransactionsDelta}
        />
        <StatCard
          icon={Clock}
          tone="accent"
          label="Today's Transactions"
          value={number(overviewStats.todaysTransactions)}
          delta={overviewStats.todaysTransactionsDelta}
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
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                  minTickGap={16}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#475569' }}
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
          <div className="mt-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transactionByType}
                  dataKey="value"
                  nameKey="type"
                  innerRadius={50}
                  outerRadius={75}
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
          <h2 className="text-base font-bold text-ink">Wallet overview</h2>
          <div className="mt-1 divide-y divide-line">
            <PanelRow
              icon={PiggyBank}
              label="Total Active Wallets"
              value={number(walletOverview.activeWallets)}
              delta={walletOverview.activeWalletsDelta}
            />
            <PanelRow
              icon={Landmark}
              label="Total Cashier Float"
              value={currency(walletOverview.cashierFloat)}
              delta={walletOverview.cashierFloatDelta}
            />
            <PanelRow
              icon={UserPlus}
              label="New Wallets"
              value={number(walletOverview.newWallets)}
              delta={walletOverview.newWalletsDelta}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
          <h2 className="text-base font-bold text-ink">Loan overview</h2>
          <div className="mt-1 divide-y divide-line">
            <PanelRow
              icon={BadgeCheck}
              label="Active Loans"
              value={number(loanOverview.activeLoans)}
              delta={loanOverview.activeLoansDelta}
            />
            <PanelRow
              icon={HandCoins}
              label="Repayment Loans"
              value={number(loanOverview.repaymentLoans)}
              delta={loanOverview.repaymentLoansDelta}
            />
            <PanelRow
              icon={AlertTriangle}
              label="Overdue Loans"
              value={number(loanOverview.overdueLoans)}
              delta={loanOverview.overdueLoansDelta}
            />
            <PanelRow
              icon={Banknote}
              label="Disbursement"
              value={currency(loanOverview.disbursed)}
              delta={loanOverview.disbursedDelta}
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-base font-bold text-ink">Recent transactions</h2>
          <button
            type="button"
            onClick={() => exportTransactionsCsv(recentTransactions)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-brand ring-1 ring-line transition-colors hover:bg-surface"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">ID</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Account Number</th>
                <th className="px-6 py-3 font-semibold">Amount</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentTransactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="px-6 py-3.5 font-mono text-xs text-muted">{tx.id}</td>
                  <td className="px-6 py-3.5 font-medium text-ink">{tx.customer}</td>
                  <td className="px-6 py-3.5 text-ink/70">{tx.type}</td>
                  <td className="px-6 py-3.5 font-mono text-ink/70">{maskAccount(tx.account)}</td>
                  <td className="px-6 py-3.5 font-semibold text-ink">{currency(tx.amount)}</td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={statusVariant[tx.status]} label={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
