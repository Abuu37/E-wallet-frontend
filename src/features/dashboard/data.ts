export type TxStatus = 'Completed' | 'Pending' | 'Failed'
export type TxType = 'Send Money' | 'Pay Bills' | 'Bank Transfer' | 'Airtime & Data'

export interface Transaction {
  id: string
  customer: string
  type: TxType
  amount: number
  status: TxStatus
  date: string
}

export const transactions: Transaction[] = [
  { id: 'TXN-98213', customer: 'Asha Juma', type: 'Send Money', amount: 120.0, status: 'Completed', date: '2026-10-03' },
  { id: 'TXN-98212', customer: 'John Foxton', type: 'Pay Bills', amount: 85.5, status: 'Completed', date: '2026-10-03' },
  { id: 'TXN-98211', customer: 'Grace Mwangi', type: 'Bank Transfer', amount: 540.0, status: 'Pending', date: '2026-10-03' },
  { id: 'TXN-98210', customer: 'Peter Mushi', type: 'Airtime & Data', amount: 15.0, status: 'Completed', date: '2026-10-02' },
  { id: 'TXN-98209', customer: 'Fatma Said', type: 'Send Money', amount: 230.75, status: 'Failed', date: '2026-10-02' },
  { id: 'TXN-98208', customer: 'Daniel Kessy', type: 'Pay Bills', amount: 62.0, status: 'Completed', date: '2026-10-02' },
  { id: 'TXN-98207', customer: 'Neema Lyimo', type: 'Bank Transfer', amount: 1250.0, status: 'Completed', date: '2026-10-01' },
  { id: 'TXN-98206', customer: 'Asha Juma', type: 'Airtime & Data', amount: 10.0, status: 'Pending', date: '2026-10-01' },
  { id: 'TXN-98205', customer: 'John Foxton', type: 'Send Money', amount: 75.0, status: 'Completed', date: '2026-10-01' },
  { id: 'TXN-98204', customer: 'Grace Mwangi', type: 'Pay Bills', amount: 48.2, status: 'Failed', date: '2026-09-30' },
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

export type CardStatus = 'Active' | 'Blocked'

export interface IssuedCard {
  id: string
  holder: string
  number: string
  type: 'Virtual' | 'Physical'
  status: CardStatus
  expiry: string
}

export const cards: IssuedCard[] = [
  { id: 'CRD-5501', holder: 'Asha Juma', number: '•••• •••• •••• 1234', type: 'Virtual', status: 'Active', expiry: '09/28' },
  { id: 'CRD-5502', holder: 'John Foxton', number: '•••• •••• •••• 7781', type: 'Physical', status: 'Active', expiry: '03/27' },
  { id: 'CRD-5503', holder: 'Grace Mwangi', number: '•••• •••• •••• 4420', type: 'Virtual', status: 'Blocked', expiry: '11/27' },
  { id: 'CRD-5504', holder: 'Peter Mushi', number: '•••• •••• •••• 9093', type: 'Virtual', status: 'Active', expiry: '06/28' },
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
