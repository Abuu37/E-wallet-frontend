import { useState } from 'react'
import {
  ArrowLeft,
  Users,
  User,
  Phone,
  Mail,
  CalendarDays,
  MapPin,
  Lock,
  Hash,
  Eye,
  EyeOff,
  Briefcase,
  Landmark,
  Wallet,
  Shield,
  Info,
  CheckCircle2,
  Check,
  Plus,
} from 'lucide-react'
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

const inputClass =
  'w-full rounded-xl border border-transparent bg-surface py-2.5 pl-10 pr-3.5 text-sm outline-none ring-1 ring-line focus:border-brand'
const plainInputClass =
  'w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand'

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
  const [cashierId, setCashierId] = useState(initialCashier?.id ?? defaultCashierId)
  const [name, setName] = useState(initialCashier?.name ?? '')
  const [phone, setPhone] = useState(initialCashier?.phone ?? '')
  const [email, setEmail] = useState(initialCashier?.email ?? '')
  const [gender, setGender] = useState<CashierGender>(initialCashier?.gender ?? 'Female')
  const [dateOfBirth, setDateOfBirth] = useState(initialCashier?.dateOfBirth ?? '')
  const [address, setAddress] = useState(initialCashier?.address ?? '')
  const [username, setUsername] = useState(initialCashier?.username ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [branch, setBranch] = useState(initialCashier?.branch ?? branchOptions[0])
  const terminal = initialCashier?.terminal ?? ''
  const [floatAccount, setFloatAccount] = useState(initialCashier?.floatAccount ?? '')
  const [assignedFloat, setAssignedFloat] = useState(
    initialCashier ? String(initialCashier.floatBalance) : '',
  )
  const [permissions, setPermissions] = useState<CashierPermissions>(
    initialCashier?.permissions ?? defaultPermissions,
  )

  const togglePermission = (key: keyof CashierPermissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = () => {
    const id = cashierId.trim() || defaultCashierId
    const cashier: Cashier = {
      id,
      name: name.trim() || initialCashier?.name || 'New Cashier',
      phone: phone.trim() || initialCashier?.phone || '',
      email: email.trim() || initialCashier?.email || '',
      gender,
      dateOfBirth: dateOfBirth || initialCashier?.dateOfBirth || '',
      address: address.trim() || initialCashier?.address || '',
      username: username.trim() || initialCashier?.username || '',
      branch,
      terminal: terminal.trim() || initialCashier?.terminal || `TILL-${id.replace('CSH-', '')}`,
      floatAccount: floatAccount.trim() || initialCashier?.floatAccount || `FA-${id.replace('CSH-', '')}`,
      commissionAccount: initialCashier?.commissionAccount || `CA-${id.replace('CSH-', '')}`,
      floatBalance: Number(assignedFloat) || initialCashier?.floatBalance || 0,
      todayCashIn: initialCashier?.todayCashIn ?? 0,
      todayCashOut: initialCashier?.todayCashOut ?? 0,
      commissionPayable: initialCashier?.commissionPayable ?? 0,
      unauthorizedReported: initialCashier?.unauthorizedReported ?? false,
      joined: initialCashier?.joined ?? new Date().toISOString().slice(0, 10),
      permissions,
    }
    onSubmit(cashier)
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
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Mary James"
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
                placeholder="e.g. 0712 345 678"
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
                placeholder="e.g. mary.james@walletpesa.co.tz"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Gender</label>
            <select
              value={gender}
              onChange={(event) => setGender(event.target.value as CashierGender)}
              className={`mt-1 ${plainInputClass}`}
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
                value={dateOfBirth}
                onChange={(event) => setDateOfBirth(event.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Branch <span className="text-red-500">*</span>
            </label>
            <select
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              className={`mt-1 ${plainInputClass}`}
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
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                rows={2}
                placeholder="e.g. 123 Msimbazi Street, Dar es Salaam"
                className={`${inputClass} resize-none pt-2.5`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 ring-1 ring-line">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Lock size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">Account &amp; Access</h2>
            <p className="text-xs text-muted">Set the cashier ID and login credentials.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted">
              Cashier ID <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Hash size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={cashierId}
                readOnly={mode === 'edit'}
                onChange={(event) => setCashierId(event.target.value)}
                className={`${inputClass} font-mono ${mode === 'edit' ? 'text-muted' : ''}`}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Username <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <User size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="e.g. maryjames"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === 'edit' ? 'Leave blank to keep current password' : 'Enter a secure password'}
                className={`${inputClass} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
          <Info size={14} className="mt-0.5 shrink-0" />
          <p>The cashier ID is auto-generated or can be set manually. The username will be used for login.</p>
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
                value={floatAccount}
                onChange={(event) => setFloatAccount(event.target.value)}
                placeholder="e.g. FLT-000001"
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Assigned Float Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Wallet size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="number"
                step="0.01"
                value={assignedFloat}
                onChange={(event) => setAssignedFloat(event.target.value)}
                placeholder="e.g. 5000000"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Branch <span className="text-red-500">*</span>
            </label>
            <select
              value={branch}
              onChange={(event) => setBranch(event.target.value)}
              className={`mt-1 ${plainInputClass}`}
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
            A float wallet will be created and linked to this cashier. The assigned amount will be
            available for transactions.
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
          type="button"
          onClick={handleSubmit}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
        >
          <Plus size={16} />
          {mode === 'create' ? 'Create Cashier' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
