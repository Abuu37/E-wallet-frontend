import type { LucideIcon } from 'lucide-react'
import SectionHeading from './SectionHeading'
import StepCard from './StepCard'
import CtaBanner from './CtaBanner'

interface ServiceLayoutProps {
  eyebrow: string
  title: string
  subtitle: string
  highlights: { icon: LucideIcon; text: string }[]
  steps: { title: string; description: string }[]
}

export default function ServiceLayout({
  eyebrow,
  title,
  subtitle,
  highlights,
  steps,
}: ServiceLayoutProps) {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {highlights.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <Icon size={16} />
              </span>
              <p className="text-sm font-medium text-ink">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-16">
          <h3 className="text-xl font-bold text-ink">How it works</h3>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <StepCard key={step.title} step={index + 1} {...step} />
            ))}
          </div>
        </div>

        <div className="mt-20">
          <CtaBanner
            title="Ready to get started?"
            subtitle="Get your WalletPesa card and start using this feature today."
            primaryLabel="Register"
            primaryTo="/register"
            secondaryLabel="Back to Services"
            secondaryTo="/services"
          />
        </div>
      </div>
    </div>
  )
}
