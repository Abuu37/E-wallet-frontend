import type { ReactNode } from 'react'
import SectionHeading from '../../components/ui/SectionHeading'
import CtaBanner from '../../components/ui/CtaBanner'

const ussdSteps: ReactNode[] = [
  <>
    Dial <strong className="font-bold text-ink">*150*08#</strong>
  </>,
  <>
    Select <strong className="font-bold text-ink">Banking Services</strong>
  </>,
  <>
    Choose <strong className="font-bold text-ink">WalletPesa to Bank</strong> or{' '}
    <strong className="font-bold text-ink">Bank to WalletPesa</strong>
  </>,
  'Select your bank and follow the prompts',
]

const appSteps: ReactNode[] = [
  <>
    Open the <strong className="font-bold text-ink">WalletPesa app</strong>
  </>,
  <>
    Tap <strong className="font-bold text-ink">Transfer to Bank</strong>
  </>,
  'Enter the account number and amount',
  <>
    Enter your <strong className="font-bold text-ink">PIN</strong> to complete
  </>,
]

const banks = ['NMB Bank', 'NBC Bank', 'CRDB Bank', 'ABSA', 'DTB Bank', 'Exim Bank', 'Akiba Bank']

export default function BankTransfers() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Bank Transfers"
          title="Banking Services with WalletPesa"
          subtitle="Link your phone number to your bank account and move money freely between your bank and your WalletPesa wallet."
        />

        <div className="mt-16">
          <h3 className="text-xl font-bold text-ink">How it works</h3>
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
          <h3 className="text-xl font-bold text-ink">Some of the banks we work with</h3>
          <div className="mt-6 flex flex-wrap gap-3">
            {banks.map((bank) => (
              <span
                key={bank}
                className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink"
              >
                {bank}
              </span>
            ))}
            <span className="rounded-full border border-dashed border-line px-4 py-2 text-sm text-muted">
              and more…
            </span>
          </div>
        </div>

        <div className="mt-20">
          <CtaBanner
            title="Ready to link your bank?"
            subtitle="Get your WalletPesa card and move money freely between your wallet and bank."
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
