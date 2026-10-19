import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import {
  CreditCard,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  Smartphone,
  RefreshCw,
} from 'lucide-react'
import Button from '../../../components/ui/Button'
import ewalletImage from '../../../assets/imgs/ewallet.webp'
import paymentImage from '../../../assets/imgs/payment-img1.jpg'
import appScreenImage from '../../../assets/imgs/image 2.avif'

const slides = [paymentImage, appScreenImage, ewalletImage]
const SLIDE_DURATION = 15000

const detailsSchema = Yup.object({
  firstName: Yup.string().trim().required('First name is required'),
  middleName: Yup.string().trim(),
  lastName: Yup.string().trim().required('Last name is required'),
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  phone: Yup.string()
    .matches(/^\+?[0-9\s-]{7,15}$/, 'Enter a valid phone number')
    .required('Phone number is required'),
})

const getFieldClass = (hasError: boolean) =>
  `w-full rounded-full border py-2.5 pl-11 text-sm outline-none transition-colors focus:bg-white ${
    hasError
      ? 'border-red-400 bg-surface focus:border-red-500'
      : 'border-transparent bg-surface focus:border-brand'
  }`
const errorClass = 'mt-2 text-xs font-medium text-red-600'
const RequiredMark = () => <span className="text-red-500">*</span>

const OTP_LENGTH = 6
const PIN_LENGTH = 4
const RESEND_SECONDS = 30

type Step = 'details' | 'otp' | 'pin' | 'success'

const stepOrder: Step[] = ['details', 'otp', 'pin']
const stepLabel: Record<Step, string> = {
  details: 'Your details',
  otp: 'Verify phone',
  pin: 'Set PIN',
  success: 'Done',
}

interface DetailsValues {
  firstName: string
  middleName: string
  lastName: string
  email: string
  phone: string
}

// Navigation Timing only reports the page's real document load, so this must
// only be checked once per actual browser load, not on every client-side
// route change into /register (e.g. clicking "Register" from the Login page).
let hasCheckedReload = false

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('details')
  const [activeSlide, setActiveSlide] = useState(0)
  const [details, setDetails] = useState<DetailsValues | null>(null)

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [otpError, setOtpError] = useState('')
  const [resendCountdown, setResendCountdown] = useState(RESEND_SECONDS)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [showConfirmPin, setShowConfirmPin] = useState(false)
  const [pinError, setPinError] = useState('')

  useEffect(() => {
    if (hasCheckedReload) return
    hasCheckedReload = true

    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    if (entry?.type === 'reload' && window.location.pathname === '/register') {
      navigate('/', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length)
    }, SLIDE_DURATION)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (step !== 'otp' || resendCountdown <= 0) return
    const timer = setInterval(() => setResendCountdown((prev) => prev - 1), 1000)
    return () => clearInterval(timer)
  }, [step, resendCountdown])

  const goToOtp = (values: DetailsValues) => {
    setDetails(values)
    setOtp(Array(OTP_LENGTH).fill(''))
    setOtpError('')
    setResendCountdown(RESEND_SECONDS)
    setStep('otp')
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    setOtp((prev) => {
      const next = [...prev]
      next[index] = value.slice(-1)
      return next
    })
    setOtpError('')
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleResend = () => {
    setOtp(Array(OTP_LENGTH).fill(''))
    setOtpError('')
    setResendCountdown(RESEND_SECONDS)
    otpRefs.current[0]?.focus()
  }

  const verifyOtp = () => {
    if (otp.some((digit) => digit === '')) {
      setOtpError('Enter the full 6-digit code')
      return
    }
    setPin('')
    setConfirmPin('')
    setPinError('')
    setStep('pin')
  }

  const handleCreateAccount = () => {
    if (pin.length !== PIN_LENGTH) {
      setPinError(`PIN must be ${PIN_LENGTH} digits`)
      return
    }
    if (pin !== confirmPin) {
      setPinError('PINs do not match')
      return
    }
    setPinError('')
    setStep('success')
  }

  const currentStepIndex = stepOrder.indexOf(step)

  return (
    <div>
      <div
        className="relative flex min-h-[calc(100vh-73px)] items-stretch animate-gradient-pan p-6 sm:p-10 lg:p-16"
        style={{
          backgroundImage:
            'linear-gradient(135deg, var(--color-brand-dark), var(--color-brand), var(--color-ink))',
          backgroundSize: '200% 200%',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="relative grid w-full overflow-hidden rounded-3xl shadow-2xl shadow-ink/10 lg:grid-cols-2">
          <div className="relative hidden overflow-hidden bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12">
            <AnimatePresence initial={false}>
              <motion.div
                key={activeSlide}
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${slides[activeSlide]})` }}
                initial={{ x: '100%' }}
                animate={{ x: '0%' }}
                exit={{ x: '-100%' }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-0 bg-ink/50" />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            />
            <motion.div
              className="pointer-events-none absolute -top-32 -left-20 h-96 w-96 rounded-full bg-brand/25 blur-[120px]"
              animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-accent/20 blur-[120px]"
              animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="pointer-events-none absolute left-0 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-white/10 blur-[100px]"
              animate={{ x: [0, 25, 0], y: [0, -25, 0], scale: [1, 1.15, 1] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />

            <Link
              to="/"
              className="relative flex items-center gap-2 text-lg font-extrabold tracking-tight text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
                <CreditCard size={18} />
              </span>
              WalletPesa
            </Link>

            <div className="relative max-w-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs font-medium text-white/80">
                <Sparkles size={14} className="text-accent" />
                Get started in minutes
              </span>
              <h2 className="mt-5 text-3xl font-extrabold leading-tight text-white">
                Open your wallet in minutes.
              </h2>
              <p className="mt-3 text-sm text-white/60">
                Register, verify your identity, and get a virtual card issued instantly.
              </p>

              <div className="mt-6 flex items-center gap-2">
                {slides.map((slide, index) => (
                  <button
                    key={slide}
                    type="button"
                    onClick={() => setActiveSlide(index)}
                    aria-label={`Show slide ${index + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      activeSlide === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="relative text-xs text-white/40">© {new Date().getFullYear()} WalletPesa</p>
          </div>

          <div className="relative flex items-center justify-center overflow-hidden bg-surface px-6 py-16">
            <motion.div
              className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-brand/30 blur-[100px]"
              animate={{ x: [0, -35, 0], y: [0, 25, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="w-full max-w-md"
            >
              <div className="text-center lg:text-left">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white lg:hidden">
                  <CreditCard size={24} />
                </span>
                <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink lg:mt-0">
                  Create your account
                </h1>
                <p className="mt-2 text-sm text-muted">
                  Register in minutes and we'll guide you through getting your card.
                </p>
              </div>

              {step !== 'success' && (
                <div className="mt-6 flex items-center gap-2">
                  {stepOrder.map((item, index) => (
                    <div key={item} className="flex flex-1 items-center gap-2">
                      <span
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                          index <= currentStepIndex ? 'bg-brand' : 'bg-line'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              )}
              {step !== 'success' && (
                <p className="mt-2 text-xs font-medium text-muted">
                  Step {currentStepIndex + 1} of {stepOrder.length}: {stepLabel[step]}
                </p>
              )}

              <div className="mt-6 rounded-3xl bg-white p-8 shadow-2xl shadow-ink/10">
                <AnimatePresence mode="wait">
                  {step === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="flex flex-col items-center py-4 text-center"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-positive/10 text-positive">
                        <ShieldCheck size={24} />
                      </span>
                      <h3 className="mt-4 text-lg font-bold text-ink">You're registered</h3>
                      <p className="mt-2 text-sm text-muted">
                        We'll reach out with next steps to get your WalletPesa card.
                      </p>
                    </motion.div>
                  )}

                  {step === 'details' && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Formik<DetailsValues>
                        initialValues={
                          details ?? {
                            firstName: '',
                            middleName: '',
                            lastName: '',
                            email: '',
                            phone: '',
                          }
                        }
                        validationSchema={detailsSchema}
                        onSubmit={(values, { setSubmitting }) => {
                          goToOtp(values)
                          setSubmitting(false)
                        }}
                      >
                        {({ isSubmitting, errors, touched }) => (
                          <Form className="space-y-5">
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                              <div>
                                <label htmlFor="firstName" className="text-sm font-medium text-ink">
                                  First name <RequiredMark />
                                </label>
                                <div className="relative mt-2">
                                  <User
                                    size={18}
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                                  />
                                  <Field
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    className={`${getFieldClass(
                                      Boolean(touched.firstName && errors.firstName),
                                    )} pr-4`}
                                    placeholder="Asha"
                                  />
                                </div>
                                <ErrorMessage name="firstName" component="p" className={errorClass} />
                              </div>

                              <div>
                                <label htmlFor="lastName" className="text-sm font-medium text-ink">
                                  Last name <RequiredMark />
                                </label>
                                <div className="relative mt-2">
                                  <User
                                    size={18}
                                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                                  />
                                  <Field
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    className={`${getFieldClass(
                                      Boolean(touched.lastName && errors.lastName),
                                    )} pr-4`}
                                    placeholder="Juma"
                                  />
                                </div>
                                <ErrorMessage name="lastName" component="p" className={errorClass} />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="middleName" className="text-sm font-medium text-ink">
                                Middle name
                              </label>
                              <div className="relative mt-2">
                                <User
                                  size={18}
                                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                                />
                                <Field
                                  id="middleName"
                                  name="middleName"
                                  type="text"
                                  className={`${getFieldClass(
                                    Boolean(touched.middleName && errors.middleName),
                                  )} pr-4`}
                                  placeholder="Optional"
                                />
                              </div>
                              <ErrorMessage name="middleName" component="p" className={errorClass} />
                            </div>

                            <div>
                              <label htmlFor="email" className="text-sm font-medium text-ink">
                                Email <RequiredMark />
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
                                  className={`${getFieldClass(Boolean(touched.email && errors.email))} pr-4`}
                                  placeholder="you@example.com"
                                />
                              </div>
                              <ErrorMessage name="email" component="p" className={errorClass} />
                            </div>

                            <div>
                              <label htmlFor="phone" className="text-sm font-medium text-ink">
                                Phone number <RequiredMark />
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
                                  className={`${getFieldClass(Boolean(touched.phone && errors.phone))} pr-4`}
                                  placeholder="+255 7XX XXX XXX"
                                />
                              </div>
                              <ErrorMessage name="phone" component="p" className={errorClass} />
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                              Continue
                            </Button>
                          </Form>
                        )}
                      </Formik>
                    </motion.div>
                  )}

                  {step === 'otp' && (
                    <motion.div
                      key="otp"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.25 }}
                    >
                      <button
                        type="button"
                        onClick={() => setStep('details')}
                        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
                      >
                        <ArrowLeft
                          size={14}
                          className="transition-transform duration-200 group-hover:-translate-x-1"
                        />
                        Back
                      </button>

                      <div className="mt-4 flex flex-col items-center text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                          <Smartphone size={22} />
                        </span>
                        <h3 className="mt-4 text-lg font-bold text-ink">Verify your phone number</h3>
                        <p className="mt-2 text-sm text-muted">
                          Enter the 6-digit code we sent to{' '}
                          <span className="font-semibold text-ink">{details?.phone}</span>
                        </p>
                      </div>

                      <div className="mt-6 flex justify-center gap-2">
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            ref={(node) => {
                              otpRefs.current[index] = node
                            }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(event) => handleOtpChange(index, event.target.value)}
                            onKeyDown={(event) => handleOtpKeyDown(index, event)}
                            className={`h-12 w-11 rounded-xl border text-center text-lg font-bold text-ink outline-none transition-colors focus:bg-white ${
                              otpError
                                ? 'border-red-400 bg-surface focus:border-red-500'
                                : 'border-transparent bg-surface focus:border-brand'
                            }`}
                          />
                        ))}
                      </div>
                      {otpError && <p className={`${errorClass} text-center`}>{otpError}</p>}

                      <div className="mt-4 text-center text-sm text-muted">
                        {resendCountdown > 0 ? (
                          <span>Resend code in 00:{String(resendCountdown).padStart(2, '0')}</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleResend}
                            className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline"
                          >
                            <RefreshCw size={14} />
                            Resend code
                          </button>
                        )}
                      </div>

                      <Button type="button" className="mt-6 w-full" onClick={verifyOtp}>
                        Verify & Continue
                      </Button>
                    </motion.div>
                  )}

                  {step === 'pin' && (
                    <motion.div
                      key="pin"
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      transition={{ duration: 0.25 }}
                    >
                      <button
                        type="button"
                        onClick={() => setStep('otp')}
                        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
                      >
                        <ArrowLeft
                          size={14}
                          className="transition-transform duration-200 group-hover:-translate-x-1"
                        />
                        Back
                      </button>

                      <div className="mt-4 flex flex-col items-center text-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
                          <Lock size={22} />
                        </span>
                        <h3 className="mt-4 text-lg font-bold text-ink">Set your PIN</h3>
                        <p className="mt-2 text-sm text-muted">
                          Create a {PIN_LENGTH}-digit PIN to secure your wallet.
                        </p>
                      </div>

                      <div className="mt-6 space-y-5">
                        <div>
                          <label htmlFor="pin" className="text-sm font-medium text-ink">
                            PIN <RequiredMark />
                          </label>
                          <div className="relative mt-2">
                            <Lock
                              size={18}
                              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                            />
                            <input
                              id="pin"
                              type={showPin ? 'text' : 'password'}
                              inputMode="numeric"
                              maxLength={PIN_LENGTH}
                              value={pin}
                              onChange={(event) => {
                                if (/^\d*$/.test(event.target.value)) setPin(event.target.value)
                                setPinError('')
                              }}
                              className={`${getFieldClass(Boolean(pinError))} pr-11 tracking-[0.5em]`}
                              placeholder="••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPin((prev) => !prev)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-brand"
                              aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                            >
                              {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label htmlFor="confirmPin" className="text-sm font-medium text-ink">
                            Confirm PIN <RequiredMark />
                          </label>
                          <div className="relative mt-2">
                            <Lock
                              size={18}
                              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                            />
                            <input
                              id="confirmPin"
                              type={showConfirmPin ? 'text' : 'password'}
                              inputMode="numeric"
                              maxLength={PIN_LENGTH}
                              value={confirmPin}
                              onChange={(event) => {
                                if (/^\d*$/.test(event.target.value)) setConfirmPin(event.target.value)
                                setPinError('')
                              }}
                              className={`${getFieldClass(Boolean(pinError))} pr-11 tracking-[0.5em]`}
                              placeholder="••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPin((prev) => !prev)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-brand"
                              aria-label={showConfirmPin ? 'Hide PIN' : 'Show PIN'}
                            >
                              {showConfirmPin ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {pinError && <p className={errorClass}>{pinError}</p>}
                        </div>

                        <Button type="button" className="w-full" onClick={handleCreateAccount}>
                          Create Account
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <p className="mt-6 text-center text-sm text-muted">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-brand hover:underline">
                  Log in
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
