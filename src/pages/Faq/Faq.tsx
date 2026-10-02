import SectionHeading from '../../components/ui/SectionHeading'
import FaqAccordion, { type FaqItem } from '../../components/ui/FaqAccordion'
import CtaBanner from '../../components/ui/CtaBanner'

const faqs: FaqItem[] = [
  {
    question: 'How do I get a WalletPesa card?',
    answer:
      'Register on the app with your phone number and a valid ID. Your virtual card is issued instantly, and you can request a physical card for delivery or pickup at a partner agent.',
  },
  {
    question: 'What does it cost to sign up?',
    answer:
      'Signing up and getting your virtual card is free. A physical card carries a one-time issuance fee, shown on our Fees page.',
  },
  {
    question: 'Is my money safe with WalletPesa?',
    answer:
      'Yes. All transactions are encrypted end-to-end, and you can freeze your card instantly from the app if it is lost or stolen.',
  },
  {
    question: 'Where can I use my WalletPesa card?',
    answer:
      'Anywhere that accepts card or QR payments, plus online checkout for shopping and subscriptions. You can also pay bills and transfer to other WalletPesa users directly in the app.',
  },
  {
    question: 'How do I add money to my wallet?',
    answer:
      'Top up from your bank account, mobile money wallet, or through a nearby WalletPesa agent. Wallet top-ups are free.',
  },
  {
    question: 'What if I need help?',
    answer:
      'Our support team is available via in-app chat, phone, and email. Visit the Contact page for details and hours.',
  },
]

export default function Faq() {
  return (
    <div className="px-6 py-20">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          title="Frequently asked questions"
          subtitle="Can't find what you're looking for? Reach out on the Contact page."
        />

        <div className="mt-12">
          <FaqAccordion items={faqs} />
        </div>

        <div className="mt-16">
          <CtaBanner
            title="Still have questions?"
            subtitle="Our support team is happy to help."
            primaryLabel="Contact Us"
            primaryTo="/contact"
          />
        </div>
      </div>
    </div>
  )
}
