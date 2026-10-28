import { Link } from 'react-router-dom'
import { Landmark, Scale, HandCoins, Banknote, ShieldCheck, ChevronRight } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import TypeBadge from '../../../components/ui/TypeBadge'
import StatusBadge from '../../../components/ui/StatusBadge'
import {
  chartOfAccounts,
  getAccountBalance,
  getTax,
  TRUST_ACCOUNT_BALANCE,
  RECONCILED_AT,
} from '../../ledger/data'
import {
  transactions,
  getRecognizedFee,
  getCommission,
  type TxType,
} from '../../transactions/data'
import { reconciliationRuns } from '../../reconciliation/data'

const typeOrder: TxType[] = ['Cash In', 'Cash Out', 'W2B', 'W2W', 'Loan Disbursement', 'Loan Repayment']

const typeTone: Record<TxType, 'green' | 'rose' | 'blue' | 'orange' | 'amber'> = {
  'Cash In': 'green',
  'Cash Out': 'rose',
  W2B: 'rose',
  W2W: 'blue',
  'Loan Disbursement': 'orange',
  'Loan Repayment': 'amber',
}

const currency = (value: number) => `TSh ${Math.round(value).toLocaleString()}`

const reconciliationStatusVariant = {
  Balanced: 'positive',
  Open: 'negative',
  Investigating: 'warning',
  Resolved: 'info',
  'Written Off': 'neutral',
} as const

const balanceOf = (accountId: string) => {
  const account = chartOfAccounts.find((item) => item.id === accountId)
  return account ? getAccountBalance(account) : 0
}

export default function CompanyWallet() {
  // E-money Liabilities: every wallet the company owes money through, plus tax withheld
  // on someone else's behalf (TRA's, not the company's).
  const emoneyLiabilities =
    balanceOf('2000') + balanceOf('2005') + balanceOf('2010') + balanceOf('2020')

  // Equity: accumulated Net Revenue the company has earned and not paid out — the only
  // source of "the company's own money" we model (no capital injections or withdrawals).
  const feeIncome = balanceOf('4000')
  const commissionExpense = balanceOf('5000')
  const equity = feeIncome - commissionExpense

  const commissionPayable = balanceOf('2010')

  const lastReconciliation = [...reconciliationRuns]
    .filter((run) => run.scope === 'Company')
    .sort((a, b) => b.asOf.localeCompare(a.asOf))[0]

  const byType = typeOrder.map((type) => {
    const rows = transactions.filter((tx) => tx.type === type && tx.status !== 'Failed')
    const count = rows.length
    const volume = rows.reduce((sum, tx) => sum + tx.amount, 0)
    const fees = rows.reduce((sum, tx) => sum + getRecognizedFee(tx), 0)
    const commission = rows.reduce((sum, tx) => sum + getCommission(tx), 0)
    const tax = rows.reduce((sum, tx) => sum + getTax(tx), 0)
    const net = fees - tax - commission
    return { type, count, volume, fees, commission, tax, net }
  })

  const totals = byType.reduce(
    (sum, row) => ({
      count: sum.count + row.count,
      volume: sum.volume + row.volume,
      fees: sum.fees + row.fees,
      commission: sum.commission + row.commission,
      tax: sum.tax + row.tax,
      net: sum.net + row.net,
    }),
    { count: 0, volume: 0, fees: 0, commission: 0, tax: 0, net: 0 },
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Company Wallet</h1>
        <p className="mt-1 text-sm text-muted">
          The operator's trust account — proof that every shilling of e-money in the system is
          actually backed by real money in the bank.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          icon={Landmark}
          tone="brand"
          label="Trust Account Balance"
          value={currency(TRUST_ACCOUNT_BALANCE)}
          deltaLabel={`Last reconciled: ${RECONCILED_AT}`}
        />
        <StatCard
          icon={Scale}
          tone="accent"
          label="E-money Liabilities"
          value={currency(emoneyLiabilities)}
          deltaLabel="Customers + cashiers + commissions + tax"
        />
        <StatCard
          icon={Banknote}
          tone="accent"
          label="Equity (Retained Earnings)"
          value={currency(equity)}
          deltaLabel="Net revenue earned, not yet paid out"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <StatCard
          icon={HandCoins}
          tone="warning"
          label="Commission Payable"
          value={currency(commissionPayable)}
          deltaLabel="Owed to cashiers, not yet settled"
        />

        <Link
          to="/dashboard/reconciliation"
          className="flex items-center gap-3 rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
            <ShieldCheck size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink/80">Last Reconciliation</p>
            {lastReconciliation ? (
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-bold text-ink">{currency(lastReconciliation.difference)}</span>
                <StatusBadge
                  status={reconciliationStatusVariant[lastReconciliation.status]}
                  label={lastReconciliation.status}
                />
              </div>
            ) : (
              <p className="mt-1 text-sm font-bold text-ink">No runs yet</p>
            )}
          </div>
          <ChevronRight size={18} className="shrink-0 text-muted" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <div className="px-6 py-5">
          <h2 className="text-base font-bold text-ink">Revenue by Transaction Type</h2>
          <p className="mt-1 text-xs text-muted">
            Where the company's money actually comes from — and what it costs to earn it.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 text-right font-semibold">Count</th>
                <th className="px-6 py-3 text-right font-semibold">Volume</th>
                <th className="px-6 py-3 text-right font-semibold">Fees Earned</th>
                <th className="px-6 py-3 text-right font-semibold">Commission Paid</th>
                <th className="px-6 py-3 text-right font-semibold">Tax</th>
                <th className="px-6 py-3 text-right font-semibold">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {byType.map((row) => (
                <tr key={row.type}>
                  <td className="px-6 py-3.5">
                    <TypeBadge tone={typeTone[row.type]} label={row.type} />
                  </td>
                  <td className="px-6 py-3.5 text-right text-ink/70">{row.count}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-ink">
                    {currency(row.volume)}
                  </td>
                  <td className="px-6 py-3.5 text-right text-ink/70">{currency(row.fees)}</td>
                  <td className="px-6 py-3.5 text-right text-ink/70">{currency(row.commission)}</td>
                  <td className="px-6 py-3.5 text-right text-ink/70">{currency(row.tax)}</td>
                  <td
                    className={`px-6 py-3.5 text-right font-semibold ${
                      row.net < 0 ? 'text-red-600' : 'text-ink'
                    }`}
                  >
                    {currency(row.net)}
                    {row.net < 0 && <span className="ml-1 text-xs font-normal text-muted">(a cost)</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-line bg-surface">
              <tr>
                <td className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted">
                  Total
                </td>
                <td className="px-6 py-3.5 text-right text-sm font-bold text-ink">{totals.count}</td>
                <td className="px-6 py-3.5 text-right text-sm font-bold text-ink">
                  {currency(totals.volume)}
                </td>
                <td className="px-6 py-3.5 text-right text-sm font-bold text-ink">
                  {currency(totals.fees)}
                </td>
                <td className="px-6 py-3.5 text-right text-sm font-bold text-ink">
                  {currency(totals.commission)}
                </td>
                <td className="px-6 py-3.5 text-right text-sm font-bold text-ink">
                  {currency(totals.tax)}
                </td>
                <td
                  className={`px-6 py-3.5 text-right text-sm font-bold ${
                    totals.net < 0 ? 'text-red-600' : 'text-ink'
                  }`}
                >
                  {currency(totals.net)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
