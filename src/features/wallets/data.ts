export type WalletStatus = 'Active' | 'Frozen' | 'Blocked'
export type WalletInstrument = 'Virtual Wallet' | 'Physical Card'

export interface Wallet {
  id: string
  holder: string
  phone: string
  instrument: WalletInstrument
  cardNumber?: string
  cardExpiry?: string
  currency: string
  balance: number
  status: WalletStatus
  lastActivity: string
  opened: string
}

export const wallets: Wallet[] = [
  { id: 'WAL-40231', holder: 'Asha Juma', phone: '+255 617 812 845', instrument: 'Virtual Wallet', currency: 'USD', balance: 2480.5, status: 'Active', lastActivity: '2026-10-03 09:42', opened: '2025-11-02' },
  { id: 'WAL-40230', holder: 'John Foxton', phone: '+255 712 003 221', instrument: 'Physical Card', cardNumber: '•••• •••• •••• 7781', cardExpiry: '03/27', currency: 'USD', balance: 980.0, status: 'Active', lastActivity: '2026-10-03 08:15', opened: '2025-12-14' },
  { id: 'WAL-40229', holder: 'Grace Mwangi', phone: '+255 755 442 118', instrument: 'Virtual Wallet', currency: 'USD', balance: 15320.0, status: 'Frozen', lastActivity: '2026-09-28 12:10', opened: '2026-01-20' },
  { id: 'WAL-40228', holder: 'Peter Mushi', phone: '+255 688 990 004', instrument: 'Virtual Wallet', currency: 'USD', balance: 125.0, status: 'Blocked', lastActivity: '2026-08-02 10:00', opened: '2026-02-08' },
  { id: 'WAL-40227', holder: 'Fatma Said', phone: '+255 677 102 865', instrument: 'Physical Card', cardNumber: '•••• •••• •••• 4420', cardExpiry: '11/27', currency: 'USD', balance: 3100.75, status: 'Active', lastActivity: '2026-10-02 16:04', opened: '2026-03-17' },
  { id: 'WAL-40226', holder: 'Daniel Kessy', phone: '+255 713 558 902', instrument: 'Virtual Wallet', currency: 'USD', balance: 640.2, status: 'Active', lastActivity: '2026-10-02 14:37', opened: '2026-05-03' },
]
