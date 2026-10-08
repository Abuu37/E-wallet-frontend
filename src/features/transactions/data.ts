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
