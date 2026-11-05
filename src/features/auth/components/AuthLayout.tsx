import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CreditCard, Sparkles } from 'lucide-react'

const SLIDE_DURATION = 15000

interface AuthLayoutProps {
  slides: string[]
  badgeText: string
  heading: string
  subheading: string
  title: string
  description: string
  footer: ReactNode
  children: ReactNode
}

export default function AuthLayout({
  slides,
  badgeText,
  heading,
  subheading,
  title,
  description,
  footer,
  children,
}: AuthLayoutProps) {
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length)
    }, SLIDE_DURATION)
    return () => clearInterval(timer)
  }, [slides.length])

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
              {badgeText}
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight text-white">{heading}</h2>
            <p className="mt-3 text-sm text-white/60">{subheading}</p>

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
              <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-ink lg:mt-0">{title}</h1>
              <p className="mt-2 text-sm text-muted">{description}</p>
            </div>

            {children}

            <p className="mt-6 text-center text-sm text-muted">{footer}</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
