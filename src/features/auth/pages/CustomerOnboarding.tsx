import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CreditCard, ShieldCheck, Sparkles } from 'lucide-react'
import ewalletImage from '../../../assets/imgs/ewallet.webp'
import paymentImage from '../../../assets/imgs/payment-img1.jpg'
import appScreenImage from '../../../assets/imgs/image 2.avif'
import type { Country } from 'react-phone-number-input'
import DetailsStep from '../components/register/DetailsStep'
import OtpStep from '../components/register/OtpStep'
import PinStep from '../components/register/PinStep'
import { stepLabel, stepOrder } from '../components/register/types'
import type { DetailsValues, Step } from '../components/register/types'

const slides = [paymentImage, appScreenImage, ewalletImage]
const SLIDE_DURATION = 15000

let hasCheckedReload = false

export default function CustomerOnboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('details')
  const [activeSlide, setActiveSlide] = useState(0)
  const [details, setDetails] = useState<DetailsValues | null>(null)
  const [country, setCountry] = useState<Country>('TZ')

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

  const handleDetailsSubmit = (values: DetailsValues) => {
    setDetails(values)
    setStep('otp')
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
                    <DetailsStep
                      initialValues={details}
                      country={country}
                      onCountryChange={setCountry}
                      onSubmit={handleDetailsSubmit}
                    />
                  )}

                  {step === 'otp' && (
                    <OtpStep
                      email={details?.email}
                      phone={details?.phone}
                      onVerified={() => setStep('pin')}
                      onBack={() => setStep('details')}
                    />
                  )}

                  {step === 'pin' && (
                    <PinStep
                      email={details?.email}
                      onBack={() => setStep('otp')}
                      onSuccess={() => setStep('success')}
                    />
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
