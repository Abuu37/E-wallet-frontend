import { useRef, useState } from 'react'
import {
  ArrowLeft,
  HandCoins,
  User,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  Wallet,
  Clock,
  CalendarRange,
  CalendarClock,
  Percent,
  Check,
  Info,
  FileText,
  AlertTriangle,
  Upload,
  FileCheck2,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Modal from '../../../components/ui/Modal'

interface LoanTier {
  key: 'short' | 'middle' | 'long'
  label: string
  icon: LucideIcon
  tone: string
  amount: number
  lifespanMonths: number
  interestRate: number
}

const loanTiers: LoanTier[] = [
  {
    key: 'short',
    label: 'Short Term Loan',
    icon: Clock,
    tone: 'bg-blue-50 text-blue-600',
    amount: 1000000,
    lifespanMonths: 1,
    interestRate: 15,
  },
  {
    key: 'middle',
    label: 'Middle Term Loan',
    icon: CalendarClock,
    tone: 'bg-purple-50 text-purple-600',
    amount: 10000000,
    lifespanMonths: 6,
    interestRate: 30,
  },
  {
    key: 'long',
    label: 'Long Term Loan',
    icon: CalendarRange,
    tone: 'bg-orange-50 text-orange-600',
    amount: 30000000,
    lifespanMonths: 12,
    interestRate: 45,
  },
]

const formatAmount = (value: number) => `TSh ${value.toLocaleString()}`

const lifespanLabel = (months: number) => (months === 12 ? '1 year' : months === 1 ? '1 month' : `${months} months`)

const inputClass =
  'w-full rounded-xl border border-transparent bg-surface py-2.5 pl-10 pr-3.5 text-sm outline-none ring-1 ring-line focus:border-brand'

export interface LoanApplicationResult {
  fullName: string
  phone: string
  email: string
  job: string
  jobIdDocument: File | null
  live: string
  incomeSource: string
  tier: LoanTier
}

interface LoanApplicationFormProps {
  onCancel: () => void
  onSubmit: (application: LoanApplicationResult) => void
}

export default function LoanApplicationForm({ onCancel, onSubmit }: LoanApplicationFormProps) {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [job, setJob] = useState('')
  const [jobIdDocument, setJobIdDocument] = useState<File | null>(null)
  const jobIdInputRef = useRef<HTMLInputElement>(null)
  const [live, setLive] = useState('')
  const [incomeSource, setIncomeSource] = useState('')
  const [tierKey, setTierKey] = useState<LoanTier['key']>('short')
  const [termsOpen, setTermsOpen] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)

  const selectedTier = loanTiers.find((tier) => tier.key === tierKey) ?? loanTiers[0]
  const canSubmit =
    fullName.trim() !== '' &&
    phone.trim() !== '' &&
    job.trim() !== '' &&
    jobIdDocument !== null &&
    incomeSource.trim() !== '' &&
    termsAccepted

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      job: job.trim(),
      jobIdDocument,
      live: live.trim(),
      incomeSource: incomeSource.trim(),
      tier: selectedTier,
    })
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={onCancel}
        className="group inline-flex items-center gap-1.5 overflow-hidden rounded-full px-3 py-1.5 text-sm font-semibold text-brand transition-colors duration-300 ease-out hover:bg-brand hover:text-white"
      >
        <ArrowLeft
          size={14}
          className="transition-transform duration-300 ease-out group-hover:-translate-x-1"
        />
        Back
      </button>

      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <HandCoins size={20} />
        </span>
        <div>
          <h1 className="text-xl font-extrabold text-ink">Apply for Loan</h1>
          <p className="text-sm text-muted">
            Capture the applicant&apos;s details and select a loan type to submit an application.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 ring-1 ring-line">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <User size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">Personal Information</h2>
            <p className="text-xs text-muted">Enter the applicant&apos;s personal and employment details.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="e.g. Asha Juma"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="e.g. +255 712 345 678"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Email Address</label>
            <div className="relative mt-1">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="e.g. asha.juma@example.com"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Job / Occupation <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Briefcase
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="text"
                value={job}
                onChange={(event) => setJob(event.target.value)}
                placeholder="e.g. Shop Owner"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Job Identity Card / TIN Certificate <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                ref={jobIdInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => setJobIdDocument(event.target.files?.[0] ?? null)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => jobIdInputRef.current?.click()}
                className={`flex w-full items-center gap-2 rounded-xl border border-dashed px-3.5 py-2.5 text-left text-sm transition-colors ${
                  jobIdDocument
                    ? 'border-brand/40 bg-brand/5 text-ink'
                    : 'border-line bg-surface text-muted hover:border-brand/40'
                }`}
              >
                {jobIdDocument ? (
                  <FileCheck2 size={16} className="shrink-0 text-brand" />
                ) : (
                  <Upload size={16} className="shrink-0" />
                )}
                <span className="min-w-0 flex-1 truncate">
                  {jobIdDocument ? jobIdDocument.name : 'Upload job ID card or TIN certificate'}
                </span>
              </button>
              {jobIdDocument && (
                <button
                  type="button"
                  onClick={() => setJobIdDocument(null)}
                  aria-label="Remove file"
                  className="shrink-0 text-muted transition-colors hover:text-red-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <p className="mt-1 text-[11px] text-muted">Accepted formats: JPG, PNG, or PDF.</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Place of Residence</label>
            <div className="relative mt-1">
              <MapPin size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={live}
                onChange={(event) => setLive(event.target.value)}
                placeholder="e.g. Kariakoo, Dar es Salaam"
                className={inputClass}
              />
            </div>
          </div>
          <div className="sm:col-span-3">
            <label className="text-xs font-medium text-muted">
              Source of Income <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Wallet size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={incomeSource}
                onChange={(event) => setIncomeSource(event.target.value)}
                placeholder="e.g. Retail business income"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 ring-1 ring-line">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <HandCoins size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">Loan Type</h2>
            <p className="text-xs text-muted">Select the loan tier that fits the applicant&apos;s needs.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {loanTiers.map((tier) => {
            const checked = tier.key === tierKey
            return (
              <button
                key={tier.key}
                type="button"
                onClick={() => setTierKey(tier.key)}
                className={`relative flex flex-col gap-3 rounded-xl p-4 text-left transition-colors ring-1 ${
                  checked ? 'bg-brand/5 ring-brand/30' : 'ring-line hover:bg-surface'
                }`}
              >
                <span
                  className={`absolute right-4 top-4 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    checked ? 'bg-brand text-white' : 'bg-white ring-1 ring-line'
                  }`}
                >
                  {checked && <Check size={12} />}
                </span>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tier.tone}`}>
                  <tier.icon size={18} />
                </span>
                <p className="text-sm font-bold text-ink">{tier.label}</p>
                <div className="space-y-1.5 text-xs text-muted">
                  <p className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Wallet size={12} /> Amount
                    </span>
                    <span className="font-semibold text-ink">{formatAmount(tier.amount)}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} /> Life span
                    </span>
                    <span className="font-semibold text-ink">{lifespanLabel(tier.lifespanMonths)}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Percent size={12} /> Interest
                    </span>
                    <span className="font-semibold text-ink">{tier.interestRate}%</span>
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
          <Info size={14} className="mt-0.5 shrink-0" />
          <p>
            The loan will be disbursed today for {formatAmount(selectedTier.amount)} at{' '}
            {selectedTier.interestRate}% interest, due in {lifespanLabel(selectedTier.lifespanMonths)}.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer items-start gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(event) => setTermsAccepted(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-brand focus:ring-brand"
          />
          <span>
            I agree to the{' '}
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                setTermsOpen(true)
              }}
              className="font-semibold text-brand hover:underline"
            >
              Terms and Conditions
            </button>
          </span>
        </label>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-red-600 hover:text-red-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <HandCoins size={16} />
            Apply Loan
          </button>
        </div>
      </div>

      <Modal
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        title={
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <FileText size={16} />
            </span>
            Loan Terms and Conditions
          </>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setTermsOpen(false)}
              className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                setTermsAccepted(true)
                setTermsOpen(false)
              }}
              className="flex-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
            >
              I agree
            </button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-ink/80">
          <p>
            These terms govern the loan product applied for through WalletPesa. By submitting an
            application, the applicant agrees to the following conditions.
          </p>
          <div>
            <p className="font-semibold text-ink">1. Interest and repayment</p>
            <p className="mt-1 text-ink/70">
              Interest is fixed for the selected loan tier and accrues from the disbursement date.
              The full principal and interest are due on or before the loan&apos;s due date.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink">2. Late payment</p>
            <p className="mt-1 text-ink/70">
              Loans not repaid by the due date are marked Overdue and may incur additional penalty
              charges as outlined in the Fees module.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink">3. Default</p>
            <p className="mt-1 text-ink/70">
              Loans left unpaid for an extended period may be marked as Defaulted and referred to
              collections, which may affect the applicant&apos;s eligibility for future loans.
            </p>
          </div>
          <div>
            <p className="font-semibold text-ink">4. Data use</p>
            <p className="mt-1 text-ink/70">
              Personal and employment information provided in this application is used solely to
              assess loan eligibility and manage the loan account.
            </p>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
            <p>These terms are illustrative and shown for demonstration purposes only.</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
