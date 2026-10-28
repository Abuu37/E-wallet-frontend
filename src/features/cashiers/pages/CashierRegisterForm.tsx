import { useFormik } from 'formik'
import * as Yup from 'yup'
import {
  ArrowLeft,
  Users,
  User,
  Phone,
  Mail,
  CalendarDays,
  MapPin,
  Briefcase,
  Landmark,
  Shield,
  CheckCircle2,
  Check,
  Plus,
} from 'lucide-react'
import { useState } from 'react'
import { branchOptions, type Cashier, type CashierGender, type CashierPermissions } from '../data'

const genderOptions: CashierGender[] = ['Female', 'Male', 'Other']

const permissionItems: Array<{ key: keyof CashierPermissions; label: string; description: string }> = [
  { key: 'customerDeposits', label: 'Customer Deposits', description: 'Allow customer deposit operations' },
  { key: 'internalTransfers', label: 'Internal Transfers', description: 'Allow transfers between wallets' },
  {
    key: 'customerWithdrawals',
    label: 'Customer Withdrawals',
    description: 'Allow customer withdrawal operations',
  },
  { key: 'checkBalance', label: 'Check Balance', description: 'Allow balance inquiries' },
]

const defaultPermissions: CashierPermissions = {
  customerDeposits: true,
  customerWithdrawals: true,
  internalTransfers: true,
  checkBalance: true,
}

const getInputClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-surface py-2.5 pl-10 pr-3.5 text-sm outline-none ring-1 transition-colors focus:border-brand ${
    hasError ? 'border-red-400 ring-red-300' : 'border-transparent ring-line'
  }`
const getPlainInputClass = (hasError: boolean) =>
  `w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 transition-colors focus:border-brand ${
    hasError ? 'border-red-400 ring-red-300' : 'border-transparent ring-line'
  }`
const errorClass = 'mt-1 text-xs font-medium text-red-600'

interface CashierFormValues {
  name: string
  phone: string
  email: string
  gender: CashierGender
  dateOfBirth: string
  address: string
  branch: string
  floatAccount: string
}

const usernameFrom = (name: string) => name.trim().toLowerCase().replace(/\s+/g, '')

interface CashierRegisterFormProps {
  mode: 'create' | 'edit'
  initialCashier?: Cashier
  defaultCashierId: string
  onCancel: () => void
  onSubmit: (cashier: Cashier) => void
}

export default function CashierRegisterForm({
  mode,
  initialCashier,
  defaultCashierId,
  onCancel,
  onSubmit,
}: CashierRegisterFormProps) {
  const terminal = initialCashier?.terminal ?? ''
  const [permissions, setPermissions] = useState<CashierPermissions>(
    initialCashier?.permissions ?? defaultPermissions,
  )

  const togglePermission = (key: keyof CashierPermissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const cashierSchema = Yup.object({
    name: Yup.string().trim().required('Full name is required'),
    phone: Yup.string()
      .matches(/^\+?[0-9\s-]{7,15}$/, 'Enter a valid phone number')
      .required('Phone number is required'),
    email: Yup.string().email('Enter a valid email'),
    branch: Yup.string().required('Branch is required'),
    floatAccount: Yup.string().trim().required('Float wallet account is required'),
  })

  const formik = useFormik<CashierFormValues>({
    initialValues: {
      name: initialCashier?.name ?? '',
      phone: initialCashier?.phone ?? '',
      email: initialCashier?.email ?? '',
      gender: initialCashier?.gender ?? 'Female',
      dateOfBirth: initialCashier?.dateOfBirth ?? '',
      address: initialCashier?.address ?? '',
      branch: initialCashier?.branch ?? branchOptions[0],
      floatAccount: initialCashier?.floatAccount ?? '',
    },
    validationSchema: cashierSchema,
    onSubmit: (values) => {
      const id = initialCashier?.id ?? defaultCashierId
      const cashier: Cashier = {
        id,
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        gender: values.gender,
        dateOfBirth: values.dateOfBirth || initialCashier?.dateOfBirth || '',
        address: values.address.trim(),
        username: initialCashier?.username ?? usernameFrom(values.name),
        branch: values.branch,
        terminal: terminal.trim() || initialCashier?.terminal || `TILL-${id.replace('CSH-', '')}`,
        floatAccount: values.floatAccount.trim(),
        commissionAccount: initialCashier?.commissionAccount || `CA-${id.replace('CSH-', '')}`,
        openingFloatBalance: initialCashier?.openingFloatBalance ?? 0,
        todayCashIn: initialCashier?.todayCashIn ?? 0,
        todayCashOut: initialCashier?.todayCashOut ?? 0,
        commissionPayable: initialCashier?.commissionPayable ?? 0,
        unauthorizedReported: initialCashier?.unauthorizedReported ?? false,
        joined: initialCashier?.joined ?? new Date().toISOString().slice(0, 10),
        permissions,
      }
      onSubmit(cashier)
    },
  })

  const hasError = (field: keyof CashierFormValues) => Boolean(formik.touched[field] && formik.errors[field])

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
          <Users size={20} />
        </span>
        <div>
          <h1 className="text-xl font-extrabold text-ink">{mode === 'create' ? 'Add Cashier' : 'Edit Cashier'}</h1>
          <p className="text-sm text-muted">
            {mode === 'create'
              ? 'Register a new cashier and assign their float wallet to enable them to perform transactions.'
              : "Update this cashier's details, access and permissions."}
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
            <p className="text-xs text-muted">Enter the cashier's personal and contact details.</p>
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
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. Mary James"
                className={getInputClass(hasError('name'))}
              />
            </div>
            {hasError('name') && <p className={errorClass}>{formik.errors.name}</p>}
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
                placeholder="e.g. 0712 345 678"
                className={getInputClass(hasError('phone'))}
              />
            </div>
            {hasError('phone') && <p className={errorClass}>{formik.errors.phone}</p>}
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
                placeholder="e.g. mary.james@walletpesa.co.tz"
                className={getInputClass(hasError('email'))}
              />
            </div>
            {hasError('email') && <p className={errorClass}>{formik.errors.email}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Gender</label>
            <select
              name="gender"
              value={formik.values.gender}
              onChange={formik.handleChange}
              className={`mt-1 ${getPlainInputClass(false)}`}
            >
              {genderOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Date of Birth</label>
            <div className="relative mt-1">
              <CalendarDays
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="date"
                name="dateOfBirth"
                value={formik.values.dateOfBirth}
                onChange={formik.handleChange}
                className={getInputClass(false)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Branch <span className="text-red-500">*</span>
            </label>
            <select
              name="branch"
              value={formik.values.branch}
              onChange={formik.handleChange}
              className={`mt-1 ${getPlainInputClass(false)}`}
            >
              {branchOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-3">
            <label className="text-xs font-medium text-muted">Address</label>
            <div className="relative mt-1">
              <MapPin size={16} className="pointer-events-none absolute left-3.5 top-3 text-muted" />
              <textarea
                name="address"
                value={formik.values.address}
                onChange={formik.handleChange}
                rows={2}
                placeholder="e.g. 123 Msimbazi Street, Dar es Salaam"
                className={`${getInputClass(false)} resize-none pt-2.5`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 ring-1 ring-line">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Briefcase size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">Float Wallet Assignment</h2>
            <p className="text-xs text-muted">Assign a float wallet to this cashier for daily operations.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted">
              Float Wallet Account <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Landmark size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                name="floatAccount"
                value={formik.values.floatAccount}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="e.g. FLT-000001"
                className={`${getInputClass(hasError('floatAccount'))} font-mono`}
              />
            </div>
            {hasError('floatAccount') && <p className={errorClass}>{formik.errors.floatAccount}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Branch <span className="text-red-500">*</span>
            </label>
            <select
              name="branch"
              value={formik.values.branch}
              onChange={formik.handleChange}
              className={`mt-1 ${getPlainInputClass(false)}`}
            >
              {branchOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-green-50 p-3 text-xs text-green-800">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
          <p>
            A float wallet will be created and linked to this cashier. Use the "Top-Up Cashier
            Float" quick action afterward to assign starting float.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 ring-1 ring-line">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Shield size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">Permissions</h2>
            <p className="text-xs text-muted">Select the operations this cashier can perform.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {permissionItems.map((item) => {
            const checked = permissions[item.key]
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => togglePermission(item.key)}
                className={`flex items-start gap-3 rounded-xl p-4 text-left transition-colors ring-1 ${
                  checked ? 'bg-brand/5 ring-brand/30' : 'ring-line hover:bg-surface'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                    checked ? 'bg-brand text-white' : 'bg-white ring-1 ring-line'
                  }`}
                >
                  {checked && <Check size={12} />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted">{item.description}</p>
                </div>
              </button>
            )
          })}
        </div>
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
          <Plus size={16} />
          {mode === 'create' ? 'Create Cashier' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
