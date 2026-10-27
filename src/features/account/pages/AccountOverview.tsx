import { Link } from 'react-router-dom'
import { Wallet, Landmark, ChevronRight, ArrowDownRight, ArrowUpRight, Send } from 'lucide-react'
import StatusBadge from '../../../components/ui/StatusBadge'
import TypeBadge from '../../../components/ui/TypeBadge'
import { getCurrentCustomer } from '../../auth/session'
import { getCustomerBalance } from '../../ledger/data'
import { getCustomerTransactions } from '../../customers/status'
import { formatTxDateTime, type TxType } from '../../transactions/data'

const currency = (value: number) => `TSh ${Math.round(value).toLocaleString()}`

const txStatusVariant = {
  Successful: 'positive',
  Pending: 'warning',
  Failed: 'negative',
} as const

const txTypeTone: Record<TxType, 'blue' | 'green' | 'rose' | 'orange' | 'amber'> = {
  W2W: 'blue',
  'Cash In': 'green',
  'Cash Out': 'rose',
  W2B: 'rose',
  'Loan Disbursement': 'orange',
  'Loan Repayment': 'amber',
}

const txTypeIcon: Record<TxType, typeof Send> = {
  W2W: Send,
  'Cash In': ArrowDownRight,
  'Cash Out': ArrowUpRight,
  W2B: Landmark,
  'Loan Disbursement': Landmark,
  'Loan Repayment': Landmark,
}

const txIconBg: Record<TxType, string> = {
  W2W: 'bg-blue-50 text-blue-600',
  'Cash In': 'bg-green-50 text-green-600',
  'Cash Out': 'bg-rose-50 text-rose-600',
  W2B: 'bg-rose-50 text-rose-600',
  'Loan Disbursement': 'bg-orange-50 text-orange-600',
  'Loan Repayment': 'bg-amber-50 text-amber-600',
}

export default function AccountOverview() {
  const { customer } = getCurrentCustomer()
  const balance = getCustomerBalance(customer)
  const recent = [...getCustomerTransactions(customer)]
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-lg shadow-brand/20">
        <p className="flex items-center gap-1.5 text-sm text-white/70">
          <Wallet size={14} /> Wallet Balance
        </p>
        <p className="mt-1 text-3xl font-extrabold">{currency(balance)}</p>
        <p className="mt-1 text-xs text-white/60">{customer.phone}</p>
      </div>

      <div>
        <h2 className="text-sm font-bold text-ink">Quick Actions</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            to="/account/withdraw"
            className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-line transition-shadow hover:shadow-md"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Landmark size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">Withdraw Money</p>
              <p className="text-xs text-muted">Via cashier or to your bank</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-muted" />
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        <div className="px-5 py-4">
          <h2 className="text-sm font-bold text-ink">Recent Activity</h2>
        </div>
        <div className="divide-y divide-line">
          {recent.length === 0 && (
            <p className="px-5 py-6 text-center text-sm text-muted">No transactions yet.</p>
          )}
          {recent.map((tx) => {
            const Icon = txTypeIcon[tx.type]
            return (
              <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${txIconBg[tx.type]}`}
                >
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <TypeBadge tone={txTypeTone[tx.type]} label={tx.type} />
                  </div>
                  <p className="mt-1 text-xs text-muted">{formatTxDateTime(tx)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-ink">{currency(tx.amount)}</p>
                  <StatusBadge status={txStatusVariant[tx.status]} label={tx.status} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
