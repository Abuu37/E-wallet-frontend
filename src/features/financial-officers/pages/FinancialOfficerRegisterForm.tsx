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
import { branchOptions, type FinancialOfficer, type OfficerGender, type OfficerPermissions } from '../data'

const genderOptions: OfficerGender[] = ['Female', 'Male', 'Other']

const permissionItems: Array<{ key: keyof OfficerPermissions; label: string; description: string }> = [
  {
    key: 'approveDisbursements',
    label: 'Approve Disbursements',
    description: 'Allow approving loan disbursement batches',
  },
  {
    key: 'reconcileSettlements',
    label: 'Reconcile Settlements',
    description: 'Allow reviewing and reconciling settlement entries',
  },
  {
    key: 'reviewOverdueLoans',
    label: 'Review Overdue Loans',
    description: 'Allow flagging and reviewing overdue loan accounts',
  },
  { key: 'exportReports', label: 'Export Reports', description: 'Allow exporting financial reports' },
]

const defaultPermissions: OfficerPermissions = {
  approveDisbursements: true,
  reconcileSettlements: true,
  reviewOverdueLoans: true,
  exportReports: true,
}

const inputClass =
  'w-full rounded-xl border border-transparent bg-surface py-2.5 pl-10 pr-3.5 text-sm outline-none ring-1 ring-line focus:border-brand'
const plainInputClass =
  'w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand'

interface FinancialOfficerRegisterFormProps {
  mode: 'create' | 'edit'
  initialOfficer?: FinancialOfficer
  defaultOfficerId: string
  onCancel: () => void
  onSubmit: (officer: FinancialOfficer) => void
}

export default function FinancialOfficerRegisterForm({
  mode,
  initialOfficer,
  defaultOfficerId,
  onCancel,
  onSubmit,
}: FinancialOfficerRegisterFormProps) {
  const [officerId, setOfficerId] = useState(initialOfficer?.id ?? defaultOfficerId)
  const [name, setName] = useState(initialOfficer?.name ?? '')
  const [phone, setPhone] = useState(initialOfficer?.phone ?? '')
  const [email, setEmail] = useState(initialOfficer?.email ?? '')
  const [gender, setGender] = useState<OfficerGender>(initialOfficer?.gender ?? 'Female')
  const [dateOfBirth, setDateOfBirth] = useState(initialOfficer?.dateOfBirth ?? '')
  const [address, setAddress] = useState(initialOfficer?.address ?? '')
  const [username, setUsername] = useState(initialOfficer?.username ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [branch, setBranch] = useState(initialOfficer?.branch ?? branchOptions[0])
  const deskCode = initialOfficer?.deskCode ?? ''
  const [portfolioAccount, setPortfolioAccount] = useState(initialOfficer?.portfolioAccount ?? '')
  const [assignedPortfolio, setAssignedPortfolio] = useState(
    initialOfficer ? String(initialOfficer.assignedPortfolio) : '',
  )
  const [permissions, setPermissions] = useState<OfficerPermissions>(
    initialOfficer?.permissions ?? defaultPermissions,
  )

  const togglePermission = (key: keyof OfficerPermissions) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = () => {
    const id = officerId.trim() || defaultOfficerId
    const officer: FinancialOfficer = {
      id,
      name: name.trim() || initialOfficer?.name || 'New Officer',
      phone: phone.trim() || initialOfficer?.phone || '',
      email: email.trim() || initialOfficer?.email || '',
      gender,
      dateOfBirth: dateOfBirth || initialOfficer?.dateOfBirth || '',
      address: address.trim() || initialOfficer?.address || '',
      username: username.trim() || initialOfficer?.username || '',
      branch,
      deskCode: deskCode.trim() || initialOfficer?.deskCode || `DESK-${id.replace('OFC-', '')}`,
      portfolioAccount:
        portfolioAccount.trim() || initialOfficer?.portfolioAccount || `PF-${id.replace('OFC-', '')}`,
      assignedPortfolio: Number(assignedPortfolio) || initialOfficer?.assignedPortfolio || 0,
      todayApprovals: initialOfficer?.todayApprovals ?? 0,
      todayFlagged: initialOfficer?.todayFlagged ?? 0,
      status: initialOfficer?.status ?? 'Active',
      joined: initialOfficer?.joined ?? new Date().toISOString().slice(0, 10),
      lastActivity: initialOfficer?.lastActivity ?? 'Just now',
      permissions,
    }
    onSubmit(officer)
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
          <h1 className="text-xl font-extrabold text-ink">
            {mode === 'create' ? 'Add Financial Officer' : 'Edit Financial Officer'}
          </h1>
          <p className="text-sm text-muted">
            {mode === 'create'
              ? 'Register a new financial officer and assign their portfolio to enable them to review and approve financial operations.'
              : "Update this officer's details, access and permissions."}
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
            <p className="text-xs text-muted">Enter the officer's personal and contact details.</p>
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
                placeholder="e.g. Grace Mahundi"
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
                placeholder="e.g. 0712 445 801"
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
                placeholder="e.g. grace.mahundi@walletpesa.co.tz"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Gender</label>
            <select
              value={gender}
              onChange={(event) => setGender(event.target.value as OfficerGender)}
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
                placeholder="e.g. 14 Samora Avenue, Kariakoo, Dar es Salaam"
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
            <p className="text-xs text-muted">Set the officer ID and login credentials.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted">
              Officer ID <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Hash size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={officerId}
                readOnly={mode === 'edit'}
                onChange={(event) => setOfficerId(event.target.value)}
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
                placeholder="e.g. gracemahundi"
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
          <p>The officer ID is auto-generated or can be set manually. The username will be used for login.</p>
        </div>
      </div>

      <div className="bg-white p-6 ring-1 ring-line">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Briefcase size={18} />
          </span>
          <div>
            <h2 className="text-sm font-bold text-ink">Portfolio Assignment</h2>
            <p className="text-xs text-muted">Assign a financial portfolio to this officer to oversee.</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="text-xs font-medium text-muted">
              Portfolio Account <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Landmark size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={portfolioAccount}
                onChange={(event) => setPortfolioAccount(event.target.value)}
                placeholder="e.g. PF-220031"
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              Assigned Portfolio Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Wallet size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="number"
                step="0.01"
                value={assignedPortfolio}
                onChange={(event) => setAssignedPortfolio(event.target.value)}
                placeholder="e.g. 150000"
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
            A portfolio will be assigned to this officer. They will be able to review and approve
            operations within the assigned amount.
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
            <p className="text-xs text-muted">Select the operations this officer can perform.</p>
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
          {mode === 'create' ? 'Create Officer' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
