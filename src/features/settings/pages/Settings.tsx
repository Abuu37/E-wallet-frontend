import { useState, type FormEvent } from 'react'
import { User, Mail, Phone, Building2, ShieldCheck, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import Button from '../../../components/ui/Button'
import StatusBadge from '../../../components/ui/StatusBadge'
import { getCurrentStaffUser } from '../../auth/currentStaffUser'

const fieldClass =
  'w-full rounded-full border border-transparent bg-surface py-2.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-brand focus:bg-white'

const pinFieldClass =
  'w-full rounded-full border border-transparent bg-surface py-2.5 pl-11 pr-11 text-sm tracking-[0.3em] outline-none transition-colors focus:border-brand focus:bg-white'

const ORGANIZATION = 'WalletPesa'

function PinInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-2">
        <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          inputMode="numeric"
          maxLength={4}
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          className={pinFieldClass}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Hide PIN' : 'Show PIN'}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  )
}

export default function Settings() {
  const currentUser = getCurrentStaffUser()

  const [name, setName] = useState(currentUser.name)
  const [email, setEmail] = useState(currentUser.email)
  const [phone, setPhone] = useState(currentUser.phone)
  const [profileSaved, setProfileSaved] = useState(false)

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSaved, setPinSaved] = useState(false)

  const saveProfile = (event: FormEvent) => {
    event.preventDefault()
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  const resetProfile = () => {
    setName(currentUser.name)
    setEmail(currentUser.email)
    setPhone(currentUser.phone)
  }

  const changePin = (event: FormEvent) => {
    event.preventDefault()
    setPinSaved(false)

    let session: { pin?: string } = {}
    try {
      session = JSON.parse(sessionStorage.getItem('user') ?? '{}')
    } catch {
      session = {}
    }

    if (!session.pin || session.pin !== currentPin) {
      setPinError('Current PIN is incorrect.')
      return
    }
    if (!/^\d{4}$/.test(newPin)) {
      setPinError('New PIN must be exactly 4 digits.')
      return
    }
    if (newPin !== confirmPin) {
      setPinError("New PIN and confirmation don't match.")
      return
    }
    if (newPin === currentPin) {
      setPinError('New PIN must be different from your current PIN.')
      return
    }

    sessionStorage.setItem('user', JSON.stringify({ ...session, pin: newPin }))
    setPinError('')
    setPinSaved(true)
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your account details and sign-in security.</p>
      </div>

      <div className="rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-bold text-white">
            {currentUser.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-ink">{currentUser.name}</p>
            <p className="truncate text-sm text-muted">{ORGANIZATION}</p>
          </div>
          <StatusBadge status="info" label={currentUser.role} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-8 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <h2 className="text-lg font-bold text-ink">Profile settings</h2>
        <p className="mt-1 text-sm text-muted">Update the details shown across the dashboard.</p>

        <form className="mt-6 space-y-5" onSubmit={saveProfile}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="text-sm font-medium text-ink">
                Full name
              </label>
              <div className="relative mt-2">
                <User size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="org" className="text-sm font-medium text-ink">
                Organization
              </label>
              <div className="relative mt-2">
                <Building2 size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  id="org"
                  type="text"
                  value={ORGANIZATION}
                  disabled
                  className={`${fieldClass} cursor-not-allowed text-muted`}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-ink">
              Email
            </label>
            <div className="relative mt-2">
              <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="text-sm font-medium text-ink">
              Phone number
            </label>
            <div className="relative mt-2">
              <Phone size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            {profileSaved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                <CheckCircle2 size={16} />
                Saved
              </span>
            )}
            <Button type="button" variant="secondary" onClick={resetProfile}>
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl bg-white p-8 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
            <ShieldCheck size={18} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-ink">Security</h2>
            <p className="mt-0.5 text-sm text-muted">Change the PIN you sign in with.</p>
          </div>
        </div>

        <form className="mt-6 space-y-5" onSubmit={changePin}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <PinInput id="current-pin" label="Current PIN" value={currentPin} onChange={setCurrentPin} />
            <PinInput id="new-pin" label="New PIN" value={newPin} onChange={setNewPin} />
            <PinInput id="confirm-pin" label="Confirm new PIN" value={confirmPin} onChange={setConfirmPin} />
          </div>

          {pinError && <p className="text-sm font-medium text-red-600">{pinError}</p>}

          <div className="flex items-center justify-end gap-3 pt-2">
            {pinSaved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                <CheckCircle2 size={16} />
                PIN updated
              </span>
            )}
            <Button type="submit">Update PIN</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
