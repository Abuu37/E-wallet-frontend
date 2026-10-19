import { Landmark, ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import StatusBadge from '../../../components/ui/StatusBadge'
import { floatManagement, settlements, type FloatAccountStatus } from '../../financial/data'

const floatStatusVariant: Record<FloatAccountStatus, 'positive' | 'warning' | 'negative'> = {
  Available: 'positive',
  Processing: 'warning',
  Blocked: 'negative',
}

const settlementStatusVariant = {
  Settled: 'positive',
  Pending: 'warning',
  Failed: 'negative',
} as const

function currency(value: number) {
  return `TSh ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function MainWallet() {
  const mainWallet = floatManagement.find((account) => account.label === 'Main Wallet')

  // Settlements are listed newest-first; reverse so the chart reads left-to-right over time.
  const trend = [...settlements].reverse()

  const totalCredits = settlements
    .filter((item) => item.direction === 'Credit')
    .reduce((sum, item) => sum + item.amount, 0)
  const totalDebits = settlements
    .filter((item) => item.direction === 'Debit')
    .reduce((sum, item) => sum + item.amount, 0)
  const netMovement = totalCredits - totalDebits

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Main Wallet</h1>
        <p className="mt-1 text-sm text-muted">
          The operator's central float account — it backs every customer and cashier wallet balance
          in the system and settles against it daily.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-line">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
            <Landmark size={14} /> Main Wallet Balance
          </p>
          <p className="mt-2 text-3xl font-extrabold text-ink">{currency(mainWallet?.value ?? 0)}</p>
          <div className="mt-3 flex items-center gap-2">
            {mainWallet?.delta !== undefined && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                  mainWallet.delta >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {mainWallet.delta >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(mainWallet.delta)}%
              </span>
            )}
            {mainWallet && (
              <StatusBadge status={floatStatusVariant[mainWallet.status]} label={mainWallet.status} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:col-span-2">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-5 ring-1 ring-line">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <ArrowDownRight size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted">Total Credits</p>
              <p className="truncate text-lg font-bold text-ink">{currency(totalCredits)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-5 ring-1 ring-line">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
              <ArrowUpRight size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted">Total Debits</p>
              <p className="truncate text-lg font-bold text-ink">{currency(totalDebits)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-5 ring-1 ring-line">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Scale size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted">Net Movement</p>
              <p className={`truncate text-lg font-bold ${netMovement < 0 ? 'text-red-600' : 'text-ink'}`}>
                {currency(netMovement)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <h2 className="text-base font-bold text-ink">Balance Trend</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ left: 0, right: 10, top: 10 }}>
              <defs>
                <linearGradient id="mainWalletFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-blue)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--color-chart-blue)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: '#475569' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#475569' }}
                axisLine={false}
                tickLine={false}
                width={64}
                tickFormatter={(value) => `TSh ${Number(value).toLocaleString()}`}
              />
              <Tooltip
                cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px -5px rgba(11,18,32,0.1)',
                }}
                formatter={(value) => [`TSh ${Number(value).toLocaleString()}`, 'Balance']}
              />
              <Area
                type="monotone"
                dataKey="balance"
                name="Balance"
                stroke="var(--color-chart-blue)"
                strokeWidth={2}
                fill="url(#mainWalletFill)"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <div className="px-6 py-5">
          <h2 className="text-base font-bold text-ink">Settlement Ledger</h2>
          <p className="mt-1 text-xs text-muted">Every credit and debit posted against the Main Wallet.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Settlement ID</th>
                <th className="px-6 py-3 font-semibold">Description</th>
                <th className="px-6 py-3 text-right font-semibold">Amount</th>
                <th className="px-6 py-3 text-right font-semibold">Balance</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Officer</th>
                <th className="px-6 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {settlements.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-3.5 font-mono text-xs text-muted">{item.id}</td>
                  <td className="px-6 py-3.5 text-ink/70">{item.description}</td>
                  <td
                    className={`px-6 py-3.5 text-right font-semibold ${
                      item.direction === 'Credit' ? 'text-green-700' : 'text-red-600'
                    }`}
                  >
                    {item.direction === 'Credit' ? '+' : '-'}
                    {currency(item.amount)}
                  </td>
                  <td className="px-6 py-3.5 text-right font-semibold text-ink">
                    {currency(item.balance)}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={settlementStatusVariant[item.status]} label={item.status} />
                  </td>
                  <td className="px-6 py-3.5 text-ink/70">{item.officer ?? '—'}</td>
                  <td className="px-6 py-3.5 text-ink/70">{item.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
