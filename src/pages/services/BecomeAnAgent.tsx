import { MessageCircle, Phone } from 'lucide-react'
import SectionHeading from '../../components/ui/SectionHeading'
import CtaBanner from '../../components/ui/CtaBanner'
import CheckIcon from '../../components/ui/CheckIcon'

const benefits = [
  'Earn competitive commissions on every transaction, higher than most other networks.',
  "Deposit money into a customer's wallet on the spot.",
  'Let customers withdraw cash instantly from their WalletPesa balance.',
  'Sell airtime and data bundles to customers and earn extra commission.',
  'Help customers collect a physical WalletPesa card at your counter.',
  'Use any mobile network to connect to WalletPesa agent services.',
]

const requirements = [
  'Your National ID (NIDA) number',
  'Your business TIN',
  'The phone number you will use for agent services',
]

export default function BecomeAnAgent() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Become an Agent"
          title="Become an Agent and Earn Big Commissions"
          subtitle="Join the WalletPesa agent network and earn commission every time you help customers deposit, withdraw, top up, or collect their card."
        />

        <div className="mt-16">
          <h3 className="text-xl font-bold text-ink">Benefits of Being a WalletPesa Agent</h3>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-3 rounded-2xl border border-line bg-white p-5 text-sm text-ink"
              >
                <CheckIcon className="mt-0.5" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-16">
          <h3 className="text-xl font-bold text-ink">How to Become a WalletPesa Agent</h3>
          <div className="mt-6 rounded-2xl border border-line bg-white p-8">
            <p className="text-sm leading-relaxed text-muted">
              Send the following details to our agent team on WhatsApp, and we will verify and
              activate your account within days.
            </p>
            <ul className="mt-6 space-y-3">
              {requirements.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-ink">
                  <CheckIcon className="mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-6 border-t border-line pt-6 text-sm">
              <div className="flex items-center gap-2 text-ink">
                <MessageCircle size={18} className="text-brand" />
                WhatsApp: +255 617 812 845
              </div>
              <div className="flex items-center gap-2 text-ink">
                <Phone size={18} className="text-brand" />
                Call: +255 617 812 845
              </div>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <CtaBanner
            title="Ready to start earning?"
            subtitle="Send your details today and join the WalletPesa agent network."
            primaryLabel="Contact Us"
            primaryTo="/contact"
            secondaryLabel="Back to Services"
            secondaryTo="/services"
          />
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Icons made by{' '}
          <a
            href="https://www.flaticon.com/authors/octopocto"
            title="Octopocto"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-brand"
          >
            Octopocto
          </a>{' '}
          from{' '}
          <a
            href="https://www.flaticon.com/"
            title="Flaticon"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-brand"
          >
            www.flaticon.com
          </a>
        </p>
      </div>
    </div>
  )
}
