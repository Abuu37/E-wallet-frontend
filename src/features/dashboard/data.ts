export type TxStatus = 'Completed' | 'Pending' | 'Failed'
export type TxType = 'Send Money' | 'Pay Bills' | 'Bank Transfer' | 'Airtime & Data'
export type TxChannel = 'App' | 'USSD' | 'Agent'

export interface Transaction {
  id: string
  customer: string
  phone: string
  type: TxType
  channel: TxChannel
  amount: number
  fee: number
  status: TxStatus
  date: string
}

export const transactions: Transaction[] = [
  { id: 'TXN-98213', customer: 'Asha Juma', phone: '+255 617 812 845', type: 'Send Money', channel: 'App', amount: 120.0, fee: 0, status: 'Completed', date: '2026-10-03' },
  { id: 'TXN-98212', customer: 'John Foxton', phone: '+255 712 003 221', type: 'Pay Bills', channel: 'USSD', amount: 85.5, fee: 1.2, status: 'Completed', date: '2026-10-03' },
  { id: 'TXN-98211', customer: 'Grace Mwangi', phone: '+255 755 442 118', type: 'Bank Transfer', channel: 'App', amount: 540.0, fee: 3.5, status: 'Pending', date: '2026-10-03' },
  { id: 'TXN-98210', customer: 'Peter Mushi', phone: '+255 688 990 004', type: 'Airtime & Data', channel: 'Agent', amount: 15.0, fee: 0, status: 'Completed', date: '2026-10-02' },
  { id: 'TXN-98209', customer: 'Fatma Said', phone: '+255 677 102 865', type: 'Send Money', channel: 'App', amount: 230.75, fee: 0, status: 'Failed', date: '2026-10-02' },
  { id: 'TXN-98208', customer: 'Daniel Kessy', phone: '+255 713 558 902', type: 'Pay Bills', channel: 'USSD', amount: 62.0, fee: 0.9, status: 'Completed', date: '2026-10-02' },
  { id: 'TXN-98207', customer: 'Neema Lyimo', phone: '+255 789 221 034', type: 'Bank Transfer', channel: 'App', amount: 1250.0, fee: 6.0, status: 'Completed', date: '2026-10-01' },
  { id: 'TXN-98206', customer: 'Asha Juma', phone: '+255 617 812 845', type: 'Airtime & Data', channel: 'Agent', amount: 10.0, fee: 0, status: 'Pending', date: '2026-10-01' },
  { id: 'TXN-98205', customer: 'John Foxton', phone: '+255 712 003 221', type: 'Send Money', channel: 'App', amount: 75.0, fee: 0, status: 'Completed', date: '2026-10-01' },
  { id: 'TXN-98204', customer: 'Grace Mwangi', phone: '+255 755 442 118', type: 'Pay Bills', channel: 'USSD', amount: 48.2, fee: 0.6, status: 'Failed', date: '2026-09-30' },
]

export type CustomerStatus = 'Active' | 'Suspended'

export interface Customer {
  id: string
  name: string
  email: string
  balance: number
  status: CustomerStatus
  joined: string
}

export const customers: Customer[] = [
  { id: 'CUS-1001', name: 'Asha Juma', email: 'asha.juma@example.com', balance: 2480.5, status: 'Active', joined: '2025-11-02' },
  { id: 'CUS-1002', name: 'John Foxton', email: 'john.foxton@example.com', balance: 980.0, status: 'Active', joined: '2025-12-14' },
  { id: 'CUS-1003', name: 'Grace Mwangi', email: 'grace.mwangi@example.com', balance: 15320.0, status: 'Active', joined: '2026-01-20' },
  { id: 'CUS-1004', name: 'Peter Mushi', email: 'peter.mushi@example.com', balance: 125.0, status: 'Suspended', joined: '2026-02-08' },
  { id: 'CUS-1005', name: 'Fatma Said', email: 'fatma.said@example.com', balance: 3100.75, status: 'Active', joined: '2026-03-17' },
  { id: 'CUS-1006', name: 'Daniel Kessy', email: 'daniel.kessy@example.com', balance: 640.2, status: 'Active', joined: '2026-05-03' },
  { id: 'CUS-1007', name: 'Neema Lyimo', email: 'neema.lyimo@example.com', balance: 8750.0, status: 'Suspended', joined: '2026-06-29' },
]

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

export const revenueTrend = [
  { day: 'Sep 4', revenue: 2100 },
  { day: 'Sep 8', revenue: 2600 },
  { day: 'Sep 12', revenue: 2300 },
  { day: 'Sep 16', revenue: 3100 },
  { day: 'Sep 20', revenue: 2950 },
  { day: 'Sep 24', revenue: 3600 },
  { day: 'Sep 28', revenue: 3400 },
  { day: 'Oct 2', revenue: 4100 },
]

export const transactionBreakdown = [
  { type: 'Send Money', value: 42, color: '#2563eb' },
  { type: 'Pay Bills', value: 27, color: '#14b8a6' },
  { type: 'Bank Transfer', value: 18, color: '#f59e0b' },
  { type: 'Airtime & Data', value: 13, color: '#16a34a' },
]
