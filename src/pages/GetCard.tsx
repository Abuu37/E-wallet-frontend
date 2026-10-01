import { useState } from 'react'
import { CreditCard, ShieldCheck, Zap } from 'lucide-react'
import SectionHeading from '../components/ui/SectionHeading'
import StepCard from '../components/ui/StepCard'
import Button from '../components/ui/Button'

const steps = [
  { title: 'Enter your details', description: 'Phone number, full name, and a valid ID.' },
  { title: 'Verify your identity', description: 'A quick selfie and ID check, done in the app.' },
  { title: 'Get your virtual card', description: 'Issued instantly, ready to use online.' },
  { title: 'Request a physical card', description: 'Optional delivery or pickup at an agent.' },
]

const highlights = [
  { icon: Zap, text: 'Instant virtual card issuance' },
  { icon: ShieldCheck, text: 'Bank-grade security & freeze controls' },
  { icon: CreditCard, text: 'Works online, in-store, and for bills' },
]

export default function GetCard() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Get the Card"
          title="Your WalletPesa card, in minutes"
          subtitle="Join the waitlist or start registration, and we'll guide you through the rest."
        />

        <div className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {steps.map((step, index) => (
                <StepCard key={step.title} step={index + 1} {...step} />
              ))}
            </div>

            <div className="mt-8 space-y-4">
              {highlights.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-sm text-ink">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <Icon size={16} />
                  </span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-8">
            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <h3 className="text-lg font-bold text-ink">You're on the list</h3>
                <p className="mt-2 text-sm text-muted">
                  We'll reach out with next steps to get your WalletPesa card.
                </p>
              </div>
            ) : (
              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault()
                  setSubmitted(true)
                }}
              >
                <h3 className="text-lg font-bold text-ink">Join the waitlist</h3>
                <div>
                  <label htmlFor="fullName" className="text-sm font-medium text-ink">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    className="mt-2 w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
                    placeholder="Asha Juma"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="text-sm font-medium text-ink">
                    Phone number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    className="mt-2 w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
                    placeholder="+255 7XX XXX XXX"
                  />
                </div>
                <div>
                  <label htmlFor="cardType" className="text-sm font-medium text-ink">
                    Card type
                  </label>
                  <select
                    id="cardType"
                    className="mt-2 w-full rounded-xl border border-line px-4 py-2.5 text-sm outline-none focus:border-brand"
                  >
                    <option>Virtual card</option>
                    <option>Physical card</option>
                    <option>Both</option>
                  </select>
                </div>
                <Button type="submit" className="w-full">
                  Join the Waitlist
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
