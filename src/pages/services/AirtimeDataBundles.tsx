import type { ReactNode } from 'react'
import SectionHeading from '../../components/ui/SectionHeading'
import CtaBanner from '../../components/ui/CtaBanner'

const ussdSteps: ReactNode[] = [
  <>
    Dial <strong className="font-bold text-ink">*150*08#</strong>
  </>,
  <>
    Select <strong className="font-bold text-ink">Airtime & Data Bundles</strong>
  </>,
  'Choose your network',
  'Enter the phone number and amount',
  <>
    Enter your <strong className="font-bold text-ink">PIN</strong> to complete
  </>,
]

const appSteps: ReactNode[] = [
  <>
    Open the <strong className="font-bold text-ink">WalletPesa app</strong>
  </>,
  <>
    Tap <strong className="font-bold text-ink">Airtime & Data Bundles</strong>
  </>,
  'Select your network and the phone number',
  'Choose airtime or a data bundle, and enter the amount',
  <>
    Review the details and enter your <strong className="font-bold text-ink">PIN</strong> to
    confirm
  </>,
]

const networks = ['Vodacom', 'Tigo', 'Airtel', 'Halotel', 'TTCL']

export default function AirtimeDataBundles() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Airtime & Data Bundles"
          title="Top Up Airtime and Data in Seconds"
          subtitle="Buy airtime or a data bundle for yourself or someone else, on any network, using WalletPesa."
        />

        <div className="mt-16">
          <h3 className="text-xl font-bold text-ink">How to Use:</h3>
          <p className="mt-2 text-sm text-muted">
            Top up airtime and data bundles using WalletPesa on any network.
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
          <h3 className="text-xl font-bold text-ink">Networks we work with</h3>
          <div className="mt-6 flex flex-wrap gap-3">
            {networks.map((network) => (
              <span
                key={network}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink"
              >
                {network}
              </span>
            ))}
            <span className="rounded-full border border-dashed border-line px-4 py-2 text-sm text-muted">
              and more…
            </span>
          </div>
        </div>

        <div className="mt-20">
          <CtaBanner
            title="Ready to top up?"
            subtitle="Get your WalletPesa card and top up airtime or data in seconds."
            primaryLabel="Get the Card"
            primaryTo="/get-card"
            secondaryLabel="Back to Services"
            secondaryTo="/services"
          />
        </div>
      </div>
    </div>
  )
}
