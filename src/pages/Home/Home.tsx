import {
  Send,
  Receipt,
  Store,
  CreditCard,
  Landmark,
  Smartphone,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Wifi,
} from 'lucide-react'
import Button from '../../components/ui/Button'
import SectionHeading from '../../components/ui/SectionHeading'
import ServiceCard from '../../components/ui/ServiceCard'
import StepCard from '../../components/ui/StepCard'
import StatsBar from '../../components/ui/StatsBar'
import CtaBanner from '../../components/ui/CtaBanner'
import digitalWallet from '../../assets/imgs/Digital-wallet.png.webp'

function CardChip() {
  return (
    <div className="relative h-10 w-12 shrink-0">
      <span className="absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/25 blur-md" />
      <div className="absolute left-1/2 top-1/2 grid h-7 w-10 -translate-x-1/2 -translate-y-1/2 grid-cols-3 grid-rows-2 gap-px rounded-[5px] border border-yellow-800/30 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 p-[3px] shadow-inner shadow-yellow-900/40">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="rounded-[1px] bg-gradient-to-br from-yellow-100 via-yellow-300 to-yellow-500" />
        ))}
      </div>
    </div>
  )
}

function CardTexture() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0.8) 1px, transparent 1px, transparent 14px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.8) 0px, rgba(255,255,255,0.8) 1px, transparent 1px, transparent 14px)',
      }}
    />
  )
}

function CardBrandMark() {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center">
        <span className="h-6 w-6 rounded-full bg-red-500" />
        <span className="-ml-2.5 h-6 w-6 rounded-full bg-orange-400 mix-blend-plus-lighter" />
      </div>
      <span className="text-[9px] font-semibold italic tracking-tight text-white/90">mastercard</span>
    </div>
  )
}

const services = [
  {
    icon: Send,
    title: 'Send Money',
    description: 'Transfer to any WalletPesa user instantly, with fees that stay low.',
  },
  {
    icon: Receipt,
    title: 'Pay Bills',
    description: 'Electricity, water, TV subscriptions and more, settled in seconds.',
  },
  {
    icon: Store,
    title: 'Merchant Payments',
    description: 'Tap or scan to pay at thousands of partner shops nationwide.',
  },
  {
    icon: CreditCard,
    title: 'Virtual Card',
    description: 'Get issued instantly and use it online anywhere cards are accepted.',
  },
  {
    icon: Landmark,
    title: 'Bank Transfers',
    description: 'Move money between WalletPesa and your bank account freely.',
  },
  {
    icon: Smartphone,
    title: 'Airtime & Data',
    description: 'Top up your line or someone else’s without leaving the app.',
  },
]

const steps = [
  {
    title: 'Sign up',
    description: 'Register in minutes with just your phone number and ID.',
  },
  {
    title: 'Get your card',
    description: 'Receive a virtual card instantly, or order a physical one.',
  },
  {
    title: 'Fund your wallet',
    description: 'Top up from your bank, mobile money, or an agent nearby.',
  },
  {
    title: 'Start paying',
    description: 'Send money, pay bills, and shop online or in person.',
  },
]

const stats = [
  { value: '250K+', label: 'Active users' },
  { value: 'TSh 40B+', label: 'Processed monthly' },
  { value: '3,000+', label: 'Partner merchants' },
  { value: '99.9%', label: 'Uptime' },
]

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden bg-ink">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />
        <div className="pointer-events-none absolute -top-32 right-0 h-[28rem] w-[28rem] rounded-full bg-brand/25 blur-[120px]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 sm:py-28 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5 text-sm font-medium text-white/80">
              <Sparkles size={16} className="text-accent" />
              Now issuing instant virtual cards
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
              One card.
              <br />
              Every payment.
            </h1>
            <p className="mt-6 max-w-md text-lg text-white/70">
              WalletPesa brings your money, bills, and shopping together in a
              single card: instant, secure, and built to keep fees low.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button to="/register" size="lg">
                Register
                <ArrowRight size={18} />
              </Button>
              <Button to="/fees" size="lg" variant="outline-light">
                See Fees
              </Button>
            </div>
          </div>

          <div className="relative mx-auto h-72 w-full max-w-sm sm:h-80">
            <div className="absolute bottom-0 left-0 z-0 aspect-[1.6/1] w-[85%] -rotate-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-700 via-slate-900 to-black shadow-2xl shadow-black/40 animate-card-float [animation-delay:0.6s]">
              <CardTexture />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent" />
              <div className="relative flex h-full flex-col text-white">
                <div className="mt-5 h-7 w-full bg-black/85" />
                <div className="mt-4 flex items-center gap-2 px-5">
                  <div className="h-5 flex-1 rounded-sm bg-white/90" />
                  <div className="flex h-5 min-w-9 items-center justify-center rounded-sm bg-white px-2 text-[10px] font-semibold text-ink">
                    341
                  </div>
                </div>
                <p className="mt-3 px-5 text-[6px] leading-snug text-white/40">
                  Card usage is subject to the WalletPesa terms and conditions. This card remains the
                  property of WalletPesa. If found, please return it to the WalletPesa office, P.O. Box
                  12107, Dar es Salaam, or to any WalletPesa agent or branch nationwide. For assistance,
                  contact Customer Service on +255 617 812 845, available 24/7.
                </p>
                <div className="mt-auto flex items-center justify-between px-5 pb-3">
                  <span className="text-xs font-bold tracking-tight">WalletPesa</span>
                  <span className="text-[10px] tracking-wide text-white/60">Exp 09/35</span>
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 z-10 w-[85%] rotate-6 animate-card-float">
              <div className="relative aspect-[1.6/1] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-black p-5 shadow-2xl shadow-black/50">
                <CardTexture />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent" />
                <div className="relative flex h-full flex-col justify-between text-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CardChip />
                      <Wifi size={22} className="rotate-90 opacity-80" />
                    </div>
                    <span className="text-base font-bold tracking-tight">WalletPesa</span>
                  </div>
                  <p className="text-lg font-semibold tracking-[0.15em]">4821 **** **** 7734</p>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-white/50">Card holder</p>
                      <p className="text-sm font-semibold tracking-wide">CODE A.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-white/50">Valid thru</p>
                      <p className="text-sm font-semibold">12/27</p>
                    </div>
                    <CardBrandMark />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-line bg-white px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <StatsBar stats={stats} />
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="What you can do"
            title="Every payment, one card away"
            subtitle="From daily bills to online shopping, WalletPesa covers it all."
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>
        </div>
      </section>

      <section
        className="relative bg-fixed bg-cover bg-center bg-no-repeat px-6 py-20"
        style={{ backgroundImage: `url(${digitalWallet})` }}
      >
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="How it works"
            title="Get started in four simple steps"
            light
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <StepCard key={step.title} step={index + 1} {...step} light />
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Why WalletPesa"
            title="Built for trust, speed, and low fees"
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-line bg-white p-8">
              <Zap className="text-brand" size={28} />
              <h3 className="mt-4 text-lg font-bold text-ink">Instant</h3>
              <p className="mt-2 text-sm text-muted">
                Card issuance and transfers happen in seconds, not days.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-8">
              <ShieldCheck className="text-brand" size={28} />
              <h3 className="mt-4 text-lg font-bold text-ink">Secure</h3>
              <p className="mt-2 text-sm text-muted">
                Bank-grade encryption and card freeze controls, always in your hand.
              </p>
            </div>
            <div className="rounded-2xl border border-line bg-white p-8">
              <Sparkles className="text-brand" size={28} />
              <h3 className="mt-4 text-lg font-bold text-ink">Low fees</h3>
              <p className="mt-2 text-sm text-muted">
                Transparent pricing with free transfers between WalletPesa users.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-6xl">
          <CtaBanner
            title="Ready to get your card?"
            subtitle="Join thousands already paying smarter with WalletPesa."
            primaryLabel="Register"
            primaryTo="/register"
            secondaryLabel="Talk to Us"
            secondaryTo="/contact"
          />
        </div>
      </section>
    </div>
  )
}
