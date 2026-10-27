import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CreditCard, Phone, Lock, Eye, EyeOff, Sparkles } from 'lucide-react'
import Button from '../../../components/ui/Button'
import ewalletImage from '../../../assets/imgs/ewallet.webp'
import paymentImage from '../../../assets/imgs/payment-img1.jpg'
import appScreenImage from '../../../assets/imgs/image 2.avif'
import { customers } from '../../customers/data'
import { cashiers } from '../../cashiers/data'
import { setCurrentCustomerId } from '../session'

const normalizePhone = (value: string) => value.replace(/\s+/g, '')

const slides = [ewalletImage, paymentImage, appScreenImage]
const SLIDE_DURATION = 15000

const fieldClass =
  'w-full rounded-full border border-transparent bg-surface py-2.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-brand focus:bg-white'

const PIN_LENGTH = 4

export default function Login() {
  const navigate = useNavigate()
  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState('')
  const [activeSlide, setActiveSlide] = useState(0)
  const [phone, setPhone] = useState('')

  // One form for everyone — who you are is resolved from the phone number, not a role you
  // picked. A real backend would authenticate the phone+PIN and return the account's actual
  // role; this frontend-only app simulates that by checking the phone against the real
  // customer and cashier records. No match in either means there's no staff record for this
  // phone either (there's no seeded Admin list at all), so it falls back to the admin view —
  // same "admin is the catch-all" behavior this app already had before customer login existed.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const typed = normalizePhone(phone)
    const customerMatch = customers.find((customer) => normalizePhone(customer.phone) === typed)
    if (customerMatch) {
      setCurrentCustomerId(customerMatch.id)
      navigate('/account')
      return
    }

    const cashierMatch = cashiers.find((cashier) => normalizePhone(cashier.phone) === typed)
    if (cashierMatch) {
      navigate('/dashboard')
      return
    }

    navigate('/dashboard')
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length)
    }, SLIDE_DURATION)
    return () => clearInterval(timer)
  }, [])

  return (
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
            Trusted by 250K+ users
          </span>
          <h2 className="mt-5 text-3xl font-extrabold leading-tight text-white">
            One wallet for every payment.
          </h2>
          <p className="mt-3 text-sm text-white/60">
            Log in to send money, pay bills, and manage your card from anywhere.
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
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-muted">
              Log in to manage your WalletPesa account and card.
            </p>
          </div>

          <div className="mt-8 rounded-3xl bg-white p-8 shadow-2xl shadow-ink/10">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="phone" className="text-sm font-medium text-ink">
                  Phone number
                </label>
                <div className="relative mt-2">
                  <Phone
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className={fieldClass}
                    placeholder="+255 7XX XXX XXX"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="pin" className="text-sm font-medium text-ink">
                  PIN
                </label>
                <div className="relative mt-2">
                  <Lock
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                  />
                  <input
                    id="pin"
                    name="pin"
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={PIN_LENGTH}
                    value={pin}
                    onChange={(event) => {
                      if (/^\d*$/.test(event.target.value)) setPin(event.target.value)
                    }}
                    className={`${fieldClass} pr-11 tracking-[0.5em]`}
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
                <div className="mt-3 flex items-center justify-between">
                  <label htmlFor="remember" className="flex items-center gap-2 text-sm text-muted">
                    <input
                      id="remember"
                      name="remember"
                      type="checkbox"
                      className="h-4 w-4 rounded border-line text-brand focus:ring-brand"
                    />
                    Remember me
                  </label>
                  <Link to="/contact" className="text-xs font-medium text-brand hover:underline">
                    Forgot PIN?
                  </Link>
                </div>
              </div>

              <Button type="submit" className="w-full">
                Log In
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand hover:underline">
              Register
            </Link>
          </p>
        </motion.div>
      </div>
      </div>
    </div>
  )
}
