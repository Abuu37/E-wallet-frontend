import SectionHeading from '../../components/ui/SectionHeading'
import PricingTable from '../../components/ui/PricingTable'
import CtaBanner from '../../components/ui/CtaBanner'
import CheckIcon from '../../components/ui/CheckIcon'

const cardFees = [
  { service: 'Virtual card issuance', fee: 'Free', note: 'Instant, unlimited' },
  { service: 'Physical card issuance', fee: 'TSh 5,000', note: 'One-time fee' },
  { service: 'Card replacement', fee: 'TSh 5,000', note: 'Lost or damaged cards' },
]

const transferFees = [
  { service: 'WalletPesa to WalletPesa', fee: 'Free', note: 'Unlimited transfers' },
  { service: 'WalletPesa to bank account', fee: '1.0%', note: 'Min TSh 500, capped at TSh 3,000' },
  { service: 'Cash withdrawal (agent)', fee: '1.5%', note: 'Min TSh 500' },
  { service: 'Wallet top-up', fee: 'Free', note: 'From bank or mobile money' },
]

const merchantFees = [
  { service: 'In-store card / QR payment', fee: '1.2%', note: 'Per transaction' },
  { service: 'Online checkout', fee: '1.8%', note: 'Per transaction' },
  { service: 'Settlement to bank', fee: 'Free', note: 'Next business day' },
]

const comparisons = [
  'No monthly account fees',
  'No hidden charges on statements',
  'Free transfers between WalletPesa users',
  'Transparent, published merchant rates',
]

export default function Fees() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title="Simple, transparent pricing"
          subtitle="No surprise charges. All figures below are illustrative and may vary by region."
        />

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <PricingTable title="Card" rows={cardFees} />
          <PricingTable title="Transfers & Withdrawals" rows={transferFees} />
          <PricingTable title="Merchant Payments" rows={merchantFees} />
        </div>

        <div className="mt-16 rounded-2xl border border-line bg-white p-8">
          <h3 className="text-lg font-bold text-ink">
            How WalletPesa compares to traditional banking
          </h3>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {comparisons.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-muted">
                <CheckIcon className="mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-20">
          <CtaBanner
            title="No hidden fees. Ever."
            subtitle="Get your WalletPesa card and start paying smarter today."
            primaryLabel="Register"
            primaryTo="/register"
            secondaryLabel="Read FAQ"
            secondaryTo="/faq"
          />
        </div>
      </div>
    </div>
  )
}
