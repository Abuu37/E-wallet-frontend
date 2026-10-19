export type TxStatus = 'Successful' | 'Pending' | 'Failed'
export type TxType = 'W2W' | 'Cash In' | 'Cash Out' | 'Loan Disbursement' | 'Loan Repayment'
export type TxChannel = 'Web App' | 'USSD' | 'Agent'

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
  recipientName?: string
  recipientAccount?: string
}

export const transactions: Transaction[] = [
  { id: 'TXN-98214', customer: 'Grace Mwangi', phone: '+255 755 442 118', type: 'Loan Repayment', channel: 'Web App', amount: 1200.0, fee: 0, status: 'Successful', date: '2026-09-28', recipientName: 'Loan LN-3012', recipientAccount: 'LN-3012' },
  { id: 'TXN-98213', customer: 'Asha Juma', phone: '+255 617 812 845', type: 'Loan Disbursement', channel: 'Web App', amount: 5000.0, fee: 0, status: 'Successful', date: '2026-09-29', recipientName: 'Loan LN-3001', recipientAccount: 'LN-3001' },
  { id: 'TXN-98210', customer: 'Grace Mwangi', phone: '+255 755 442 118', type: 'Cash Out', channel: 'Agent', amount: 48.2, fee: 0.6, status: 'Failed', date: '2026-09-30', recipientName: 'Halima Ndosi', recipientAccount: 'FA-384023' },
  { id: 'TXN-98209', customer: 'John Foxton', phone: '+255 712 003 221', type: 'W2W', channel: 'Web App', amount: 75.0, fee: 0.75, status: 'Successful', date: '2026-10-01', recipientName: 'Grace Mwangi', recipientAccount: '+255 755 442 118' },
  { id: 'TXN-98208', customer: 'Asha Juma', phone: '+255 617 812 845', type: 'Cash In', channel: 'Agent', amount: 10.0, fee: 0, status: 'Pending', date: '2026-10-01', recipientName: 'Juma Said', recipientAccount: 'FA-384022' },
  { id: 'TXN-98205', customer: 'Fatma Said', phone: '+255 677 102 865', type: 'W2W', channel: 'Web App', amount: 230.75, fee: 2.31, status: 'Failed', date: '2026-10-02', recipientName: 'Daniel Kessy', recipientAccount: '+255 713 558 902' },
  { id: 'TXN-98204', customer: 'Peter Mushi', phone: '+255 688 990 004', type: 'Cash In', channel: 'Agent', amount: 15.0, fee: 0, status: 'Successful', date: '2026-10-02', recipientName: 'Mwajuma Hassan', recipientAccount: 'FA-384021' },
  { id: 'TXN-98202', customer: 'John Foxton', phone: '+255 712 003 221', type: 'Cash Out', channel: 'Agent', amount: 85.5, fee: 1.2, status: 'Successful', date: '2026-10-03', recipientName: 'Mwajuma Hassan', recipientAccount: 'FA-384021' },
  { id: 'TXN-98201', customer: 'Asha Juma', phone: '+255 617 812 845', type: 'W2W', channel: 'Web App', amount: 120.0, fee: 1.2, status: 'Successful', date: '2026-10-03', recipientName: 'John Foxton', recipientAccount: '+255 712 003 221' },
]
