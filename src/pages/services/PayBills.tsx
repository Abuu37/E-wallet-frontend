import type { ReactNode } from 'react'
import SectionHeading from '../../components/ui/SectionHeading'
import CtaBanner from '../../components/ui/CtaBanner'
import CheckIcon from '../../components/ui/CheckIcon'

const payments = [
  'Electricity (LUKU) tokens',
  'Water bills',
  'Government payments (GEPG)',
  'TV decoder subscriptions',
  'Airline tickets',
  'Internet service payments',
  'UTT investment payments',
  'Mastercard QR payments',
]

const ussdSteps: ReactNode[] = [
  <>
    Dial <strong className="font-bold text-ink">*150*08#</strong>
  </>,
  <>
    Select <strong className="font-bold text-ink">Pay Bill</strong>
  </>,
  'Select the company',
  'Follow the prompts and confirm with your PIN',
]

const appSteps: ReactNode[] = [
  <>
    Open the <strong className="font-bold text-ink">WalletPesa app</strong>
  </>,
  <>
    Tap <strong className="font-bold text-ink">Pay Bill</strong>
  </>,
  'Select the company and enter your reference number and amount',
  <>
    Review the details and confirm with your <strong className="font-bold text-ink">PIN</strong>
  </>,
]

const billers = ['AzamTV', 'DStv', 'StarTimes', 'UTT', 'Mastercard']

export default function PayBills() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Pay Bills"
          title="Pay Bills, the Easy Way"
          subtitle="Make various bill payments such as water, electricity, decoders, and product payments (via Mastercard QR) more conveniently and quickly with WalletPesa."
        />

        <div className="mt-16">
          <h3 className="text-xl font-bold text-ink">Payments you can make:</h3>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {payments.map((payment) => (
              <li
                key={payment}
                className="flex items-center gap-3 rounded-2xl border border-line bg-white p-5 text-sm font-medium text-ink"
              >
                <CheckIcon />
                {payment}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16">
          <h3 className="text-xl font-bold text-ink">How to Use:</h3>
          <p className="mt-2 text-sm text-muted">
            Pay your bills using WalletPesa for these companies and more…
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-line bg-white p-6">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-brand">
                Using USSD
              </h4>
              <ol className="mt-4 space-y-3">
                {ussdSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-ink">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-2xl border border-line bg-white p-6">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-brand">
                Using the App
              </h4>
              <ol className="mt-4 space-y-3">
                {appSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-ink">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h3 className="text-xl font-bold text-ink">Supported companies</h3>
          <div className="mt-6 flex flex-wrap gap-3">
            {billers.map((biller) => (
              <span
                key={biller}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink"
              >
                {biller}
              </span>
            ))}
            <span className="rounded-full border border-dashed border-line px-4 py-2 text-sm text-muted">
              and more…
            </span>
          </div>
        </div>

        <div className="mt-20">
          <CtaBanner
            title="Ready to pay smarter?"
            subtitle="Get your WalletPesa card and settle every bill from one place."
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
