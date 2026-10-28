import { useState } from 'react'
import { Formik, Form, Field, ErrorMessage, useField } from 'formik'
import * as Yup from 'yup'
import { User, Mail, Phone, Building2, ShieldCheck, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import Button from '../../../components/ui/Button'
import StatusBadge from '../../../components/ui/StatusBadge'
import { getCurrentStaffUser } from '../../auth/currentStaffUser'

const getFieldClass = (hasError: boolean) =>
  `w-full rounded-full border py-3.5 pl-12 pr-5 text-sm outline-none transition-colors focus:bg-white ${
    hasError ? 'border-red-400 bg-surface focus:border-red-500' : 'border-transparent bg-surface focus:border-brand'
  }`
const errorClass = 'mt-2 text-xs font-medium text-red-600'

const getPinFieldClass = (hasError: boolean) =>
  `w-full rounded-full border py-2.5 pl-11 pr-11 text-sm tracking-[0.3em] outline-none transition-colors focus:bg-white ${
    hasError ? 'border-red-400 bg-surface focus:border-red-500' : 'border-transparent bg-surface focus:border-brand'
  }`

const ORGANIZATION = 'WalletPesa'

interface ProfileValues {
  name: string
  email: string
  phone: string
}

const profileSchema = Yup.object({
  name: Yup.string().trim().required('Full name is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  phone: Yup.string()
    .matches(/^\+?[0-9\s-]{7,15}$/, 'Enter a valid phone number')
    .required('Phone number is required'),
})

interface PinValues {
  currentPin: string
  newPin: string
  confirmPin: string
}

const readSessionPin = (): string | undefined => {
  try {
    return JSON.parse(sessionStorage.getItem('user') ?? '{}').pin
  } catch {
    return undefined
  }
}

const pinSchema = Yup.object({
  currentPin: Yup.string()
    .matches(/^\d{4}$/, 'Current PIN must be 4 digits')
    .required('Current PIN is required')
    .test('matches-session', 'Current PIN is incorrect', (value) => value === readSessionPin()),
  newPin: Yup.string()
    .matches(/^\d{4}$/, 'New PIN must be exactly 4 digits')
    .required('New PIN is required')
    .notOneOf([Yup.ref('currentPin')], 'New PIN must be different from your current PIN'),
  confirmPin: Yup.string()
    .required('Please confirm your new PIN')
    .oneOf([Yup.ref('newPin')], "New PIN and confirmation don't match"),
})

function PinInput({ name, label }: { name: string; label: string }) {
  const [field, meta, helpers] = useField<string>(name)
  const [visible, setVisible] = useState(false)
  const hasError = Boolean(meta.touched && meta.error)

  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div className="relative mt-2">
        <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id={name}
          type={visible ? 'text' : 'password'}
          inputMode="numeric"
          maxLength={4}
          name={field.name}
          value={field.value}
          onBlur={field.onBlur}
          onChange={(event) => helpers.setValue(event.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="••••"
          className={getPinFieldClass(hasError)}
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
      <ErrorMessage name={name} component="p" className={errorClass} />
    </div>
  )
}

type Section = 'profile' | 'security'

const sections: Array<{ id: Section; label: string; icon: typeof User }> = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: ShieldCheck },
]

export default function Settings() {
  const currentUser = getCurrentStaffUser()
  const [activeSection, setActiveSection] = useState<Section>('profile')
  const [profileSaved, setProfileSaved] = useState(false)
  const [pinSaved, setPinSaved] = useState(false)

  return (
    <div className="max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-muted">Manage your account details and sign-in security.</p>
      </div>

      <div className="mt-6 overflow-hidden bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <div className="flex flex-col lg:flex-row">
          <aside className="shrink-0 border-b border-line p-4 lg:w-64 lg:border-b-0 lg:border-r">
            <nav className="flex flex-row gap-1 lg:flex-col">
              {sections.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex flex-1 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors lg:flex-none ${
                    activeSection === section.id
                      ? 'bg-brand/10 text-brand'
                      : 'text-ink/70 hover:bg-surface hover:text-ink'
                  }`}
                >
                  <section.icon size={18} />
                  {section.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 flex-1">
            {activeSection === 'profile' && (
              <div className="p-8">
                <div className="flex flex-col items-center border-b border-line pb-6 text-center">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand text-base font-bold text-white">
                    {currentUser.initials}
                  </span>
                  <p className="mt-3 text-sm font-bold text-ink">{currentUser.name}</p>
                  <p className="text-xs text-muted">{ORGANIZATION}</p>
                  <div className="mt-2">
                    <StatusBadge status="info" label={currentUser.role} />
                  </div>
                </div>

                <h2 className="mt-6 text-lg font-bold text-ink">Profile settings</h2>
                <p className="mt-1 text-sm text-muted">Update the details shown across the dashboard.</p>

                <Formik<ProfileValues>
                  initialValues={{ name: currentUser.name, email: currentUser.email, phone: currentUser.phone }}
                  validationSchema={profileSchema}
                  onSubmit={(_values, { setSubmitting }) => {
                    setProfileSaved(true)
                    setSubmitting(false)
                    setTimeout(() => setProfileSaved(false), 2500)
                  }}
                >
                  {({ isSubmitting, errors, touched, resetForm }) => (
                    <Form className="mt-6 space-y-5">
                      <div>
                        <label htmlFor="name" className="text-sm font-medium text-ink">
                          Full name
                        </label>
                        <div className="relative mt-2">
                          <User
                            size={18}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                          />
                          <Field
                            id="name"
                            name="name"
                            type="text"
                            className={getFieldClass(Boolean(touched.name && errors.name))}
                          />
                        </div>
                        <ErrorMessage name="name" component="p" className={errorClass} />
                      </div>

                      <div>
                        <label htmlFor="org" className="text-sm font-medium text-ink">
                          Organization
                        </label>
                        <div className="relative mt-2">
                          <Building2
                            size={18}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                          />
                          <input
                            id="org"
                            type="text"
                            value={ORGANIZATION}
                            disabled
                            className={`${getFieldClass(false)} cursor-not-allowed text-muted`}
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="email" className="text-sm font-medium text-ink">
                          Email
                        </label>
                        <div className="relative mt-2">
                          <Mail
                            size={18}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                          />
                          <Field
                            id="email"
                            name="email"
                            type="email"
                            className={getFieldClass(Boolean(touched.email && errors.email))}
                          />
                        </div>
                        <ErrorMessage name="email" component="p" className={errorClass} />
                      </div>

                      <div>
                        <label htmlFor="phone" className="text-sm font-medium text-ink">
                          Phone number
                        </label>
                        <div className="relative mt-2">
                          <Phone
                            size={18}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                          />
                          <Field
                            id="phone"
                            name="phone"
                            type="tel"
                            className={getFieldClass(Boolean(touched.phone && errors.phone))}
                          />
                        </div>
                        <ErrorMessage name="phone" component="p" className={errorClass} />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        {profileSaved && (
                          <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                            <CheckCircle2 size={16} />
                            Saved
                          </span>
                        )}
                        <Button type="button" variant="secondary" onClick={() => resetForm()}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                          Save changes
                        </Button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                    <ShieldCheck size={18} />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-ink">Security</h2>
                    <p className="mt-0.5 text-sm text-muted">Change the PIN you sign in with.</p>
                  </div>
                </div>

                <Formik<PinValues>
                  initialValues={{ currentPin: '', newPin: '', confirmPin: '' }}
                  validationSchema={pinSchema}
                  onSubmit={(values, { setSubmitting, resetForm }) => {
                    let session: Record<string, unknown> = {}
                    try {
                      session = JSON.parse(sessionStorage.getItem('user') ?? '{}')
                    } catch {
                      session = {}
                    }
                    sessionStorage.setItem('user', JSON.stringify({ ...session, pin: values.newPin }))
                    setPinSaved(true)
                    resetForm()
                    setSubmitting(false)
                  }}
                >
                  {({ isSubmitting }) => (
                    <Form className="mt-6 space-y-5">
                      <div className="max-w-xs space-y-5">
                        <PinInput name="currentPin" label="Current PIN" />
                        <PinInput name="newPin" label="New PIN" />
                        <PinInput name="confirmPin" label="Confirm new PIN" />
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        {pinSaved && (
                          <span className="flex items-center gap-1.5 text-sm font-medium text-green-700">
                            <CheckCircle2 size={16} />
                            PIN updated
                          </span>
                        )}
                        <Button type="submit" disabled={isSubmitting}>
                          Update PIN
                        </Button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
