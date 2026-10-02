import {
  Send,
  Receipt,
  Store,
  CreditCard,
  Landmark,
  Smartphone,
  QrCode,
  BarChart3,
  Users,
  UserPlus,
  Wallet,
} from 'lucide-react'
import SectionHeading from '../../components/ui/SectionHeading'
import ServiceCard from '../../components/ui/ServiceCard'
import CtaBanner from '../../components/ui/CtaBanner'

const personal = [
  {
    to: '/services/send-money',
    icon: Send,
    title: 'Send Money',
    description: 'Instant, free transfers to any WalletPesa user, any time.',
  },
  {
    to: '/services/pay-bills',
    icon: Receipt,
    title: 'Pay Bills',
    description: 'Electricity, water, TV, and internet bills settled in seconds.',
  },
  {
    icon: CreditCard,
    title: 'Virtual & Physical Cards',
    description: 'Instant virtual card issuance, plus an optional physical card for in-store use.',
  },
  {
    to: '/services/bank-transfers',
    icon: Landmark,
    title: 'Bank Transfers',
    description: 'Move funds freely between WalletPesa and your linked bank account.',
  },
  {
    to: '/services/airtime-data-bundles',
    icon: Smartphone,
    title: 'Airtime & Data Bundles',
    description: 'Top up your own line or send credit to friends and family.',
  },
  {
    icon: Wallet,
    title: 'Savings Pockets',
    description: 'Set money aside for goals directly from your wallet balance.',
  },
]

const merchant = [
  {
    icon: Store,
    title: 'In-Store Payments',
    description: 'Accept tap and QR payments at the counter with no extra hardware.',
  },
  {
    icon: QrCode,
    title: 'QR Checkout',
    description: 'Generate a QR code for any amount and get paid instantly online or offline.',
  },
  {
    icon: BarChart3,
    title: 'Sales Dashboard',
    description: 'Track daily transactions, settlements, and trends in one place.',
  },
  {
    icon: Users,
    title: 'Staff Accounts',
    description: 'Give employees limited access to accept payments without full control.',
  },
  {
    to: '/services/become-an-agent',
    icon: UserPlus,
    title: 'Become an Agent',
    description: 'Join the WalletPesa agent network to handle cash-in, cash-out, and card pickup nearby.',
  },
]

export default function MainService() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Services"
          title="Everything you need, on one card"
          subtitle="WalletPesa covers personal payments and merchant acceptance under a single platform."
        />

        <div className="mt-16">
          <h3 className="text-xl font-bold text-ink">For You</h3>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {personal.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h3 className="text-xl font-bold text-ink">For Your Business</h3>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {merchant.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>
        </div>

        <div className="mt-20">
          <CtaBanner
            title="Bring every payment onto one card"
            subtitle="Whether you're paying or getting paid, WalletPesa has you covered."
            primaryLabel="Get the Card"
            primaryTo="/get-card"
            secondaryLabel="See Fees"
            secondaryTo="/fees"
          />
        </div>
      </div>
    </div>
  )
}
