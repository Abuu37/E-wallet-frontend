import { useFormik } from 'formik'
import * as Yup from 'yup'
import { Landmark, Wallet, FileText } from 'lucide-react'
import type { AgentSummary } from '../types'

const getInputClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-surface py-2.5 pl-10 pr-3.5 text-sm outline-none ring-1 transition-colors focus:border-brand ${
    hasError ? 'border-red-400 ring-red-300' : 'border-transparent ring-line'
  }`
const errorClass = 'mt-1 text-xs font-medium text-red-600'

const formatAmount = (value: number) => `TSh ${Math.round(value).toLocaleString()}`

interface AgentTopUpFormProps {
  agent: AgentSummary
  companyWalletBalance: number
  isSubmitting?: boolean
  onSubmit: (amount: number, description: string) => void
  onCancel: () => void
}

export default function AgentTopUpForm({
  agent,
  companyWalletBalance,
  isSubmitting = false,
  onSubmit,
  onCancel,
}: AgentTopUpFormProps) {
  const topUpSchema = Yup.object({
    amount: Yup.number()
      .typeError('Enter a valid amount')
      .moreThan(0, 'Amount must be greater than zero')
      .max(companyWalletBalance, 'Amount exceeds the Company Wallet balance')
      .required('Float amount is required'),
    description: Yup.string().trim().required('Description is required'),
  })

  const formik = useFormik({
    initialValues: { amount: '', description: '' },
    validationSchema: topUpSchema,
    onSubmit: (values) => {
      onSubmit(Number(values.amount), values.description.trim())
    },
  })

  const hasError = (field: 'amount' | 'description') =>
    Boolean(formik.touched[field] && formik.errors[field])

  const balanceAfterTransfer = companyWalletBalance - (Number(formik.values.amount) || 0)

  return (
    <form className="space-y-4" onSubmit={formik.handleSubmit}>
      <p className="text-sm text-muted">
        Top up <span className="font-semibold text-ink">{agent.fullName}</span>'s float from the
        Company Wallet.
      </p>

      <div>
        <label className="text-xs font-medium text-muted">Funding Source</label>
        <div className="relative mt-1">
          <Landmark
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <div className={`${getInputClass(false)} flex items-center justify-between pl-10`}>
            <span className="font-semibold text-ink">Company Wallet</span>
            <span className="font-mono text-ink/70">{formatAmount(companyWalletBalance)}</span>
          </div>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted">
          Float Amount <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1">
          <Wallet
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            name="amount"
            value={formik.values.amount}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="e.g. 50000"
            className={`${getInputClass(hasError('amount'))} font-mono`}
          />
        </div>
        {hasError('amount') ? (
          <p className={errorClass}>{formik.errors.amount}</p>
        ) : (
          <p className="mt-1 text-xs text-muted">
            Company Wallet balance after transfer: {formatAmount(balanceAfterTransfer)}
          </p>
        )}
      </div>

      <div>
        <label className="text-xs font-medium text-muted">
          Description <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1">
          <FileText
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            name="description"
            value={formik.values.description}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            placeholder="e.g. Weekly float top-up"
            className={getInputClass(hasError('description'))}
          />
        </div>
        {hasError('description') && <p className={errorClass}>{formik.errors.description}</p>}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-red-600 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Transferring...' : 'Transfer Float'}
        </button>
      </div>
    </form>
  )
}
