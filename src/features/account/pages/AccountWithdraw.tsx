import { useState, type FormEvent } from 'react'
import { UserCog, Landmark, CheckCircle2, AlertCircle, Wallet, CreditCard } from 'lucide-react'
import StatusBadge from '../../../components/ui/StatusBadge'
import { getCurrentCustomer } from '../../auth/session'
import { getCustomerBalance } from '../../ledger/data'
import type { Transaction } from '../../transactions/data'

const currency = (value: number) => `TSh ${Math.round(value).toLocaleString()}`

const bankOptions = ['NMB Bank', 'CRDB Bank', 'NBC Bank', 'Stanbic Bank', 'Equity Bank']

const fieldClass =
  'mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand'

export default function AccountWithdraw() {
  const { customer } = getCurrentCustomer()
  const balance = getCustomerBalance(customer)

  const [amount, setAmount] = useState('')
  const [bankName, setBankName] = useState(bankOptions[0])
  const [accountNumber, setAccountNumber] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<Transaction[]>([])

  const submitWithdrawal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setFormError('Enter a valid amount.')
      return
    }
    if (value > balance) {
      setFormError(`That's more than your current balance of ${currency(balance)}.`)
      return
    }
    if (!accountNumber.trim()) {
      setFormError('Enter the destination bank account number.')
      return
    }

    const request: Transaction = {
      id: `TXN-REQ-${submitted.length + 1}`,
      customer: customer.name,
      phone: customer.phone,
      type: 'W2B',
      channel: 'Web App',
      amount: value,
      fee: 0,
      status: 'Pending',
      date: new Date().toISOString().slice(0, 10),
      time: new Date().toTimeString().slice(0, 5),
      recipientName: bankName,
      recipientAccount: accountNumber.trim(),
      customerId: customer.id,
    }

    setSubmitted((prev) => [request, ...prev])
    setAmount('')
    setAccountNumber('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-ink">Withdraw Money</h1>
        <p className="mt-1 text-sm text-muted">Two ways to get your money out of WalletPesa.</p>
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <UserCog size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">Via a Cashier (Cash Out)</h2>
            <p className="text-xs text-muted">Get cash in hand, right now</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-surface p-4">
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Wallet size={14} /> Available to withdraw
          </p>
          <p className="mt-1 text-2xl font-extrabold text-ink">{currency(balance)}</p>
        </div>
        <p className="mt-4 text-sm text-ink/80">
          Visit any WalletPesa agent and tell them how much cash you want. They'll complete it
          immediately — there's nothing to apply for in advance, as long as the amount doesn't
          exceed your wallet balance above.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Landmark size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">To Your Bank Account (W2B)</h2>
            <p className="text-xs text-muted">Send it straight to your bank — no cashier needed</p>
          </div>
        </div>

        <form className="mt-4 space-y-4" onSubmit={submitWithdrawal}>
          <div>
            <label className="text-xs font-medium text-muted">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="e.g. 20000"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted">Bank</label>
            <select value={bankName} onChange={(event) => setBankName(event.target.value)} className={fieldClass}>
              {bankOptions.map((bank) => (
                <option key={bank} value={bank}>
                  {bank}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted">
              Account Number <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <CreditCard size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
                placeholder="e.g. 0142220099881"
                className={`${fieldClass} mt-0 pl-10`}
              />
            </div>
          </div>

          {formError && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
              <AlertCircle size={14} />
              {formError}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
          >
            Request Withdrawal
          </button>
          <p className="text-center text-xs text-muted">
            Your request is reviewed and typically settles within a business day.
          </p>
        </form>
      </div>

      {submitted.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
          <div className="px-5 py-4">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-ink">
              <CheckCircle2 size={16} className="text-green-600" />
              Submitted this session
            </h2>
          </div>
          <div className="divide-y divide-line">
            {submitted.map((request) => (
              <div key={request.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">
                    {currency(request.amount)} → {request.recipientName}
                  </p>
                  <p className="truncate text-xs text-muted">{request.recipientAccount}</p>
                </div>
                <StatusBadge status="warning" label={request.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
