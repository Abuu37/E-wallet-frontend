import {
  Wallet,
  Users,
  ArrowLeftRight,
  TrendingUp,
} from 'lucide-react'
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
import StatCard from '../components/StatCard'
import StatusBadge from '../components/StatusBadge'
import { transactions, customers, revenueTrend, transactionBreakdown } from '../data'

const statusVariant = {
  Completed: 'positive',
  Pending: 'warning',
  Failed: 'negative',
} as const

export default function Dashboard() {
  const recentTransactions = transactions.slice(0, 6)
  const recentCustomers = customers.slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Wallet} label="Total Balance" value="$128,430.00" delta={12.5} />
        <StatCard icon={Users} label="Active Users" value="12,480" delta={4.2} />
        <StatCard icon={ArrowLeftRight} label="Transactions Today" value="1,284" delta={-2.1} />
        <StatCard icon={TrendingUp} label="Revenue (MTD)" value="$24,500" delta={8.7} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-xl shadow-ink/5 ring-1 ring-line xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-ink">Revenue trend</h2>
            <span className="text-xs text-muted">Last 30 days</span>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 25px -5px rgba(11,18,32,0.1)',
                  }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl shadow-ink/5 ring-1 ring-line">
          <h2 className="text-base font-bold text-ink">Transactions by type</h2>
          <div className="mt-2 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transactionBreakdown}
                  dataKey="value"
                  nameKey="type"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  label={({ value }) => `${value}%`}
                  labelLine={false}
                >
                  {transactionBreakdown.map((entry) => (
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
            {transactionBreakdown.map((entry) => (
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

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-ink/5 ring-1 ring-line xl:col-span-2">
          <div className="flex items-center justify-between px-6 py-5">
            <h2 className="text-base font-bold text-ink">Recent transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-6 py-3 font-semibold">Customer</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">Amount</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="px-6 py-3.5 font-medium text-ink">{tx.customer}</td>
                    <td className="px-6 py-3.5 text-ink/70">{tx.type}</td>
                    <td className="px-6 py-3.5 font-semibold text-ink">
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={statusVariant[tx.status]} label={tx.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-xl shadow-ink/5 ring-1 ring-line">
          <h2 className="text-base font-bold text-ink">Recent customers</h2>
          <div className="mt-4 space-y-4">
            {recentCustomers.map((customer) => (
              <div key={customer.id} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                  {customer.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{customer.name}</p>
                  <p className="truncate text-xs text-muted">{customer.email}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-ink">
                  ${customer.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
