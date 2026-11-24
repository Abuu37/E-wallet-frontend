import { Send, ShieldCheck, Zap } from 'lucide-react'
import ServiceLayout from '../../components/ui/ServiceLayout'

export default function SendMoney() {
  return (
    <ServiceLayout
      eyebrow="Send Money"
      title="Send money to anyone, instantly"
      subtitle="Transfer funds to any WalletPesa user in seconds, with no fees between wallets."
      highlights={[
        { icon: Zap, text: 'Delivered instantly, day or night' },
        { icon: ShieldCheck, text: 'PIN and biometric confirmation on every transfer' },
        { icon: Send, text: 'Free between WalletPesa users' },
      ]}
      steps={[
        { title: 'Open Send Money', description: 'Tap Send from your wallet home screen.' },
        {
          title: 'Enter the recipient',
          description: "Add their phone number or scan their WalletPesa code.",
        },
        {
          title: 'Confirm the amount',
          description: 'Review the details and confirm with your PIN or fingerprint.',
        },
        {
          title: 'Money arrives instantly',
          description: 'Your recipient gets a notification and can use the funds right away.',
        },
      ]}
    />
  )
}
