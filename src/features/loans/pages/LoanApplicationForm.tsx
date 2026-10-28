import { useEffect, useRef, useState } from 'react'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import {
  ArrowLeft,
  HandCoins,
  User,
  Phone,
  Mail,
  MapPin,
  Wallet,
  Clock,
  CalendarRange,
  CalendarClock,
  CalendarDays,
  Percent,
  Check,
  Info,
  FileText,
  AlertTriangle,
  Upload,
  FileCheck2,
  X,
  ShieldAlert,
  Users,
  Smartphone,
  Landmark,
  Hash,
  UserCheck,
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

const formatAmount = (value: number) => `TSh ${Math.round(value).toLocaleString()}`

const lifespanLabel = (months: number) => (months === 12 ? '1 year' : months === 1 ? '1 month' : `${months} months`)

const getInputClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-surface py-2.5 pl-10 pr-3.5 text-sm outline-none ring-1 transition-colors focus:border-brand ${
    hasError ? 'border-red-400 ring-red-300' : 'border-transparent ring-line'
  }`
const getSelectClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-surface py-2.5 pl-3.5 pr-3.5 text-sm outline-none ring-1 transition-colors focus:border-brand ${
    hasError ? 'border-red-400 ring-red-300' : 'border-transparent ring-line'
  }`
const errorClass = 'mt-1 text-[11px] text-red-600'

const mobileProviders = ['Tigo Pesa', 'M-Pesa', 'Airtel Money'] as const

type MobileProvider = (typeof mobileProviders)[number]
type DisbursementMethod = 'mobile' | 'bank'

function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null
  const birthDate = new Date(dateOfBirth)
  if (Number.isNaN(birthDate.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate())
  if (!hasHadBirthdayThisYear) age -= 1
  return age
}

const maxDateOfBirth = (() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 18)
  return date.toISOString().slice(0, 10)
})()

function FileUploadField({
  label,
  required,
  file,
  onChange,
  placeholder,
  caption,
  error,
}: {
  label: string
  required?: boolean
  file: File | null
  onChange: (file: File | null) => void
  placeholder: string
  caption: string
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div>
      <label className="text-xs font-medium text-muted">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex w-full items-center gap-2 rounded-xl border border-dashed px-3.5 py-2.5 text-left text-sm transition-colors ${
            error
              ? 'border-red-400 bg-red-50/50 text-ink'
              : file
                ? 'border-brand/40 bg-brand/5 text-ink'
                : 'border-line bg-surface text-muted hover:border-brand/40'
          }`}
        >
          {file ? (
            <FileCheck2 size={16} className="shrink-0 text-brand" />
          ) : (
            <Upload size={16} className="shrink-0" />
          )}
          <span className="min-w-0 flex-1 truncate">{file ? file.name : placeholder}</span>
        </button>
        {file && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove file"
            className="shrink-0 text-muted transition-colors hover:text-red-600"
          >
            <X size={16} />
          </button>
        )}
      </div>
      {error ? <p className={errorClass}>{error}</p> : <p className="mt-1 text-[11px] text-muted">{caption}</p>}
    </div>
  )
}

export interface LoanApplicationResult {
  fullName: string
  phone: string
  email: string
  dateOfBirth: string
  jobIdDocument: File | null
  localGovernmentLetter: File | null
  guarantorLetter: File | null
  live: string
  incomeSource: string
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  disbursement:
    | { method: 'mobile'; provider: MobileProvider; number: string }
    | { method: 'bank'; bankName: string; accountNumber: string; accountHolder: string }
  tier: LoanTier
}

interface LoanApplicationFormProps {
  onCancel: () => void
  onSubmit: (application: LoanApplicationResult) => void
}

interface LoanFormValues {
  fullName: string
  phone: string
  email: string
  dateOfBirth: string
  jobIdDocument: File | null
  localGovernmentLetter: File | null
  guarantorLetter: File | null
  live: string
  incomeSource: string
  emergencyName: string
  emergencyRelationship: string
  emergencyPhone: string
  tierKey: LoanTier['key']
  disbursementMethod: DisbursementMethod
  mobileProvider: MobileProvider
  mobileNumber: string
  bankName: string
  bankAccountNumber: string
  bankAccountHolder: string
  termsAccepted: boolean
}

const loanSchema = Yup.object({
  fullName: Yup.string().trim().required('Full name is required'),
  phone: Yup.string()
    .matches(/^\+?[0-9\s-]{7,15}$/, 'Enter a valid phone number')
    .required('Phone number is required'),
  email: Yup.string().email('Enter a valid email'),
  dateOfBirth: Yup.string()
    .required('Date of birth is required')
    .test('is-adult', 'Applicant must be at least 18 years old to apply for a loan.', (value) => {
      const age = calculateAge(value ?? '')
      return age !== null && age >= 18
    }),
  jobIdDocument: Yup.mixed().required('Job ID / TIN certificate is required'),
  localGovernmentLetter: Yup.mixed().required('Local government letter is required'),
  guarantorLetter: Yup.mixed().required('Guarantor letter is required'),
  incomeSource: Yup.string().trim().required('Source of income is required'),
  emergencyName: Yup.string().trim().required('Emergency contact name is required'),
  emergencyRelationship: Yup.string().trim().required('Relationship is required'),
  emergencyPhone: Yup.string()
    .matches(/^\+?[0-9\s-]{7,15}$/, 'Enter a valid phone number')
    .required('Emergency contact phone is required'),
  mobileNumber: Yup.string().when('disbursementMethod', {
    is: 'mobile',
    then: (schema) => schema.required('Mobile money number is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  bankName: Yup.string().when('disbursementMethod', {
    is: 'bank',
    then: (schema) => schema.required('Bank name is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  bankAccountNumber: Yup.string().when('disbursementMethod', {
    is: 'bank',
    then: (schema) => schema.required('Account number is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  bankAccountHolder: Yup.string().when('disbursementMethod', {
    is: 'bank',
    then: (schema) => schema.required('Account holder name is required'),
    otherwise: (schema) => schema.notRequired(),
  }),
  termsAccepted: Yup.boolean().oneOf([true], 'You must agree to the Terms and Conditions'),
})

export default function LoanApplicationForm({ onCancel, onSubmit }: LoanApplicationFormProps) {
  const [mobileNumberTouched, setMobileNumberTouched] = useState(false)
  const [termsOpen, setTermsOpen] = useState(false)

  const formik = useFormik<LoanFormValues>({
    initialValues: {
      fullName: '',
      phone: '',
      email: '',
      dateOfBirth: '',
      jobIdDocument: null,
      localGovernmentLetter: null,
      guarantorLetter: null,
      live: '',
      incomeSource: '',
      emergencyName: '',
      emergencyRelationship: '',
      emergencyPhone: '',
      tierKey: 'short',
      disbursementMethod: 'mobile',
      mobileProvider: mobileProviders[0],
      mobileNumber: '',
      bankName: '',
      bankAccountNumber: '',
      bankAccountHolder: '',
      termsAccepted: false,
    },
    validationSchema: loanSchema,
    onSubmit: (values) => {
      const selectedTier = loanTiers.find((tier) => tier.key === values.tierKey) ?? loanTiers[0]
      onSubmit({
        fullName: values.fullName.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        dateOfBirth: values.dateOfBirth,
        jobIdDocument: values.jobIdDocument,
        localGovernmentLetter: values.localGovernmentLetter,
        guarantorLetter: values.guarantorLetter,
        live: values.live.trim(),
        incomeSource: values.incomeSource.trim(),
        emergencyContact: {
          name: values.emergencyName.trim(),
          relationship: values.emergencyRelationship.trim(),
          phone: values.emergencyPhone.trim(),
        },
        disbursement:
          values.disbursementMethod === 'mobile'
            ? { method: 'mobile', provider: values.mobileProvider, number: values.mobileNumber.trim() }
            : {
                method: 'bank',
                bankName: values.bankName.trim(),
                accountNumber: values.bankAccountNumber.trim(),
                accountHolder: values.bankAccountHolder.trim(),
              },
        tier: selectedTier,
      })
    },
  })

  useEffect(() => {
    if (!mobileNumberTouched) {
      formik.setFieldValue('mobileNumber', formik.values.phone)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formik.values.phone, mobileNumberTouched])

  const selectedTier = loanTiers.find((tier) => tier.key === formik.values.tierKey) ?? loanTiers[0]
  const applicantAge = calculateAge(formik.values.dateOfBirth)
  const isUnderage = applicantAge !== null && applicantAge < 18

  const hasError = (field: keyof LoanFormValues) => Boolean(formik.touched[field] && formik.errors[field])
  const errorText = (field: keyof LoanFormValues) => (hasError(field) ? String(formik.errors[field]) : undefined)

  return (
    <form className="space-y-5" onSubmit={formik.handleSubmit}>
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
                name="fullName"
                value={formik.values.fullName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Asha Juma"
                className={getInputClass(hasError('fullName'))}
              />
            </div>
            {hasError('fullName') && <p className={errorClass}>{formik.errors.fullName}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                name="phone"
                value={formik.values.phone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. +255 712 345 678"
                className={getInputClass(hasError('phone'))}
              />
            </div>
            {hasError('phone') && <p className={errorClass}>{formik.errors.phone}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="date"
                name="dateOfBirth"
                value={formik.values.dateOfBirth}
                max={maxDateOfBirth}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className={getInputClass(hasError('dateOfBirth') || isUnderage)}
              />
            </div>
            {hasError('dateOfBirth') && <p className={errorClass}>{formik.errors.dateOfBirth}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Email Address</label>
            <div className="relative mt-1">
              <Mail size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. asha.juma@example.com"
                className={getInputClass(hasError('email'))}
              />
            </div>
            {hasError('email') && <p className={errorClass}>{formik.errors.email}</p>}
          </div>
          <FileUploadField
            label="Job Identity Card / TIN Certificate"
            required
            file={formik.values.jobIdDocument}
            onChange={(file) => formik.setFieldValue('jobIdDocument', file)}
            placeholder="Upload job ID card or TIN certificate"
            caption="Accepted formats: JPG, PNG, or PDF."
            error={errorText('jobIdDocument')}
          />
          <div>
            <label className="text-xs font-medium text-muted">Place of Residence</label>
            <div className="relative mt-1">
              <MapPin size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                name="live"
                value={formik.values.live}
                onChange={formik.handleChange}
                placeholder="e.g. Kariakoo, Dar es Salaam"
                className={getInputClass(false)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Source of Income <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Wallet size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                name="incomeSource"
                value={formik.values.incomeSource}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Retail business income"
                className={getInputClass(hasError('incomeSource'))}
              />
            </div>
            {hasError('incomeSource') && <p className={errorClass}>{formik.errors.incomeSource}</p>}
          </div>
          <FileUploadField
            label="Local Government Letter"
            required
            file={formik.values.localGovernmentLetter}
            onChange={(file) => formik.setFieldValue('localGovernmentLetter', file)}
            placeholder="Upload local government introduction letter"
            caption="Accepted formats: JPG, PNG, or PDF."
            error={errorText('localGovernmentLetter')}
          />
        </div>
      </div>

      <div className="bg-white p-6 ring-1 ring-line">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <ShieldAlert size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">Emergency Contact</h2>
            <p className="text-xs text-muted">
              Provide someone who can be reached if the applicant is unavailable.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted">
              Name <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                name="emergencyName"
                value={formik.values.emergencyName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Fatma Juma"
                className={getInputClass(hasError('emergencyName'))}
              />
            </div>
            {hasError('emergencyName') && <p className={errorClass}>{formik.errors.emergencyName}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Relationship <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Users size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                name="emergencyRelationship"
                value={formik.values.emergencyRelationship}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Mother, Spouse, Sibling"
                className={getInputClass(hasError('emergencyRelationship'))}
              />
            </div>
            {hasError('emergencyRelationship') && (
              <p className={errorClass}>{formik.errors.emergencyRelationship}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Phone size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                name="emergencyPhone"
                value={formik.values.emergencyPhone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. +255 713 220 904"
                className={getInputClass(hasError('emergencyPhone'))}
              />
            </div>
            {hasError('emergencyPhone') && <p className={errorClass}>{formik.errors.emergencyPhone}</p>}
          </div>
          <FileUploadField
            label="Guarantor Letter"
            required
            file={formik.values.guarantorLetter}
            onChange={(file) => formik.setFieldValue('guarantorLetter', file)}
            placeholder="Upload guarantor letter"
            caption="Accepted formats: JPG, PNG, or PDF."
            error={errorText('guarantorLetter')}
          />
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
            const checked = tier.key === formik.values.tierKey
            return (
              <button
                key={tier.key}
                type="button"
                onClick={() => formik.setFieldValue('tierKey', tier.key)}
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

      <div className="bg-white p-6 ring-1 ring-line">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Landmark size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">Disbursement Details</h2>
            <p className="text-xs text-muted">Choose where the loan funds should be sent.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(
            [
              { key: 'mobile' as const, label: 'Mobile Money', icon: Smartphone },
              { key: 'bank' as const, label: 'Bank Account', icon: Landmark },
            ]
          ).map((method) => {
            const checked = method.key === formik.values.disbursementMethod
            return (
              <button
                key={method.key}
                type="button"
                onClick={() => formik.setFieldValue('disbursementMethod', method.key)}
                className={`relative flex items-center gap-3 rounded-xl p-4 text-left transition-colors ring-1 ${
                  checked ? 'bg-brand/5 ring-brand/30' : 'ring-line hover:bg-surface'
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <method.icon size={18} />
                </span>
                <p className="text-sm font-bold text-ink">{method.label}</p>
                <span
                  className={`absolute right-4 top-4 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                    checked ? 'bg-brand text-white' : 'bg-white ring-1 ring-line'
                  }`}
                >
                  {checked && <Check size={12} />}
                </span>
              </button>
            )
          })}
        </div>

        {formik.values.disbursementMethod === 'mobile' ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted">
                Mobile Money Provider <span className="text-red-500">*</span>
              </label>
              <select
                name="mobileProvider"
                value={formik.values.mobileProvider}
                onChange={formik.handleChange}
                className={`mt-1 ${getSelectClass(false)}`}
              >
                {mobileProviders.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted">
                Mobile Money Number <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <Smartphone
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="text"
                  name="mobileNumber"
                  value={formik.values.mobileNumber}
                  onChange={(event) => {
                    setMobileNumberTouched(true)
                    formik.handleChange(event)
                  }}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. +255 712 345 678"
                  className={getInputClass(hasError('mobileNumber'))}
                />
              </div>
              {hasError('mobileNumber') ? (
                <p className={errorClass}>{formik.errors.mobileNumber}</p>
              ) : (
                <p className="mt-1 text-[11px] text-muted">Defaults to the applicant&apos;s phone number.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-muted">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <Landmark
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="text"
                  name="bankName"
                  value={formik.values.bankName}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. CRDB Bank"
                  className={getInputClass(hasError('bankName'))}
                />
              </div>
              {hasError('bankName') && <p className={errorClass}>{formik.errors.bankName}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">
                Account Number <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <Hash size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  name="bankAccountNumber"
                  value={formik.values.bankAccountNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. 0150123456789"
                  className={getInputClass(hasError('bankAccountNumber'))}
                />
              </div>
              {hasError('bankAccountNumber') && <p className={errorClass}>{formik.errors.bankAccountNumber}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-muted">
                Account Holder Name <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <UserCheck
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="text"
                  name="bankAccountHolder"
                  value={formik.values.bankAccountHolder}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. Asha Juma"
                  className={getInputClass(hasError('bankAccountHolder'))}
                />
              </div>
              {hasError('bankAccountHolder') && <p className={errorClass}>{formik.errors.bankAccountHolder}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <label className="flex cursor-pointer items-start gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={formik.values.termsAccepted}
              onChange={(event) => formik.setFieldValue('termsAccepted', event.target.checked)}
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
          {hasError('termsAccepted') && <p className={errorClass}>{formik.errors.termsAccepted}</p>}
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-line px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-red-600 hover:text-red-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
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
                formik.setFieldValue('termsAccepted', true)
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
    </form>
  )
}
