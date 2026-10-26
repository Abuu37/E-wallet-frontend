import { cashiers } from '../cashiers/data'

export type TxStatus = 'Successful' | 'Pending' | 'Failed'
export type TxType = 'W2W' | 'Cash In' | 'Cash Out' | 'W2B' | 'Loan Disbursement' | 'Loan Repayment'
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
  time: string
  recipientName?: string
  recipientAccount?: string
  customerId: string
  recipientCustomerId?: string
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatClockTime(time: string) {
  const [hourStr, minuteStr] = time.split(':')
  const hour24 = Number(hourStr)
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return `${hour12}:${minuteStr.padStart(2, '0')} ${period}`
}

function isSameCalendarDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/**
 * Relative-friendly date/time display for a transaction: "Today at 11:17 AM",
 * "Yesterday at 10:40 AM", or "20 Oct 2026, 11:17 AM" for anything older.
 */
export const formatTxDateTime = (tx: Pick<Transaction, 'date' | 'time'>, now: Date = new Date()) => {
  const [year, month, day] = tx.date.split('-').map(Number)
  const txDate = new Date(year, month - 1, day)
  const time = formatClockTime(tx.time)

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (isSameCalendarDay(txDate, today)) return `Today at ${time}`
  if (isSameCalendarDay(txDate, yesterday)) return `Yesterday at ${time}`
  return `${day} ${SHORT_MONTHS[month - 1]} ${year}, ${time}`
}

/** Amount text color by transaction type: Cash In is money coming in (green), Cash Out is money going out (red). */
export const getAmountTone = (type: TxType) => {
  if (type === 'Cash In') return 'text-green-700'
  if (type === 'Cash Out' || type === 'W2B') return 'text-red-600'
  return 'text-ink'
}

/**
 * "From" is whoever conducts the transaction: the cashier for an agent-served Cash In/Out,
 * the loan account for a disbursement, and the customer themselves for a self-service
 * W2W transfer or loan repayment.
 */
export const getTxFromTo = (tx: Transaction): { from: string; to: string } => {
  if (tx.type === 'Cash In' || tx.type === 'Cash Out' || tx.type === 'Loan Disbursement') {
    return { from: tx.recipientName ?? '—', to: tx.customer }
  }
  return { from: tx.customer, to: tx.recipientName ?? '—' }
}

/** Whether this transaction was served by a cashier/agent (Cash In or Cash Out). */
export const isCashierServed = (tx: Transaction) => tx.type === 'Cash In' || tx.type === 'Cash Out'

export const STUCK_PENDING_MINUTES = 10

/** A pending transaction that has sat unresolved longer than the stuck-transaction threshold. */
export const isStuckPending = (tx: Transaction, now: number = Date.now()) => {
  if (tx.status !== 'Pending') return false
  const minutesSince = (now - new Date(`${tx.date}T${tx.time}:00`).getTime()) / 60000
  return minutesSince > STUCK_PENDING_MINUTES
}

// Commission is paid to the cashier/agent who handled the transaction, funded by the
// operator — independent of the customer fee (e.g. Cash In has no fee but still pays commission).
const COMMISSION_RATES: Partial<Record<TxType, number>> = { 'Cash In': 0.01, 'Cash Out': 0.01 }

// Fee, commission, and net revenue are only recognized once a transaction actually
// completes — a pending transaction hasn't moved money yet, and a failed one never did.
export const getRecognizedFee = (tx: Transaction) => (tx.status === 'Successful' ? tx.fee : 0)

export const getCommission = (tx: Transaction) => {
  if (tx.status !== 'Successful') return 0
  const rate = COMMISSION_RATES[tx.type]
  return rate ? tx.amount * rate : 0
}

export const getNetRevenue = (tx: Transaction) => getRecognizedFee(tx) - getCommission(tx)

/** Gross successful Cash In volume — real cash entering the system. */
export const getTotalDeposits = (txs: Transaction[]) =>
  txs
    .filter((tx) => tx.status === 'Successful' && tx.type === 'Cash In')
    .reduce((sum, tx) => sum + tx.amount, 0)

/** Gross successful Cash Out volume — real cash leaving the system. */
export const getTotalWithdrawals = (txs: Transaction[]) =>
  txs
    .filter((tx) => tx.status === 'Successful' && tx.type === 'Cash Out')
    .reduce((sum, tx) => sum + tx.amount, 0)

/**
 * Everything besides Cash In/Cash Out that moves the combined wallet pool: loan
 * disbursements add e-money, loan repayments remove it, and fees (charged on Cash In,
 * Cash Out, and W2W) drain out to company revenue. A W2W transfer itself nets to zero
 * across the two wallets it touches, so only its fee shows up here.
 */
export const getNetAdjustment = (txs: Transaction[]) => {
  const disbursed = txs
    .filter((tx) => tx.status === 'Successful' && tx.type === 'Loan Disbursement')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const repaid = txs
    .filter((tx) => tx.status === 'Successful' && tx.type === 'Loan Repayment')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const totalFees = txs.reduce((sum, tx) => sum + getRecognizedFee(tx), 0)
  return disbursed - repaid - totalFees
}

/** Total Deposits − Total Withdrawals + Net Adjustment: the e-money-in-circulation view of the wallet pool. */
export const getTotalWalletBalance = (txs: Transaction[]) =>
  getTotalDeposits(txs) - getTotalWithdrawals(txs) + getNetAdjustment(txs)

/** Looks up the cashier ID for a transaction's recipientName (the serving cashier's name). */
export const getCashierId = (name?: string) =>
  (name && cashiers.find((cashier) => cashier.name === name)?.id) || '—'

// Fixed categorical display order — kept separate from the live counts below so chart color
// adjacency (picked per type, not per value) never has to be re-validated when volumes change.
export const TX_TYPE_ORDER: TxType[] = [
  'W2W',
  'Cash Out',
  'W2B',
  'Cash In',
  'Loan Disbursement',
  'Loan Repayment',
]

/**
 * Each type's share of all Successful transactions, as a rounded percentage — Pending/Failed
 * are excluded from both the count and the denominator, matching how "Total Transactions" is
 * defined elsewhere (Overview). Order follows TX_TYPE_ORDER regardless of volume.
 */
export const getTransactionTypeShare = (txs: Transaction[]) => {
  const successful = txs.filter((tx) => tx.status === 'Successful')
  const total = successful.length
  return TX_TYPE_ORDER.map((type) => {
    const count = successful.filter((tx) => tx.type === type).length
    return { type, value: total > 0 ? Math.round((count / total) * 100) : 0 }
  })
}

// Amounts are whole TZS (no cents) with a realistic floor of TSh 10,000 per transaction.
export const transactions: Transaction[] = [
  { id: 'TXN-98214', customer: 'Grace Mwangi', phone: '+255 755 442 118', type: 'Loan Repayment', channel: 'Web App', amount: 5000, fee: 0, status: 'Successful', date: '2026-09-28', time: '16:42', recipientName: 'Loan LN-3012', recipientAccount: 'LN-3012', customerId: 'CUS-1003' },
  { id: 'TXN-98213', customer: 'Asha Juma', phone: '+255 617 812 845', type: 'Loan Disbursement', channel: 'Web App', amount: 5000, fee: 0, status: 'Successful', date: '2026-09-29', time: '09:15', recipientName: 'Loan LN-3001', recipientAccount: 'LN-3001', customerId: 'CUS-1001' },
  { id: 'TXN-98210', customer: 'Grace Mwangi', phone: '+255 755 442 118', type: 'Cash Out', channel: 'Agent', amount: 48200, fee: 600, status: 'Failed', date: '2026-09-30', time: '13:08', recipientName: 'Halima Ndosi', recipientAccount: 'FA-384023', customerId: 'CUS-1003' },
  { id: 'TXN-98209', customer: 'John Foxton', phone: '+255 712 003 221', type: 'W2W', channel: 'Web App', amount: 75000, fee: 750, status: 'Successful', date: '2026-10-01', time: '10:27', recipientName: 'Grace Mwangi', recipientAccount: '+255 755 442 118', customerId: 'CUS-1002', recipientCustomerId: 'CUS-1003' },
  { id: 'TXN-98208', customer: 'Asha Juma', phone: '+255 617 812 845', type: 'Cash In', channel: 'Agent', amount: 10000, fee: 0, status: 'Pending', date: '2026-10-01', time: '15:50', recipientName: 'Juma Said', recipientAccount: 'FA-384022', customerId: 'CUS-1001' },
  { id: 'TXN-98205', customer: 'Fatma Said', phone: '+255 677 102 865', type: 'W2W', channel: 'Web App', amount: 230750, fee: 2310, status: 'Failed', date: '2026-10-02', time: '08:33', recipientName: 'Daniel Kessy', recipientAccount: '+255 713 558 902', customerId: 'CUS-1005', recipientCustomerId: 'CUS-1006' },
  { id: 'TXN-98204', customer: 'Peter Mushi', phone: '+255 688 990 004', type: 'Cash In', channel: 'Agent', amount: 15000, fee: 0, status: 'Successful', date: '2026-10-02', time: '11:05', recipientName: 'Mwajuma Hassan', recipientAccount: 'FA-384021', customerId: 'CUS-1004' },
  { id: 'TXN-98202', customer: 'John Foxton', phone: '+255 712 003 221', type: 'Cash Out', channel: 'Agent', amount: 85500, fee: 1200, status: 'Successful', date: '2026-10-03', time: '14:19', recipientName: 'Mwajuma Hassan', recipientAccount: 'FA-384021', customerId: 'CUS-1002' },
  { id: 'TXN-98201', customer: 'Asha Juma', phone: '+255 617 812 845', type: 'W2W', channel: 'Web App', amount: 120000, fee: 1200, status: 'Successful', date: '2026-10-03', time: '17:02', recipientName: 'John Foxton', recipientAccount: '+255 712 003 221', customerId: 'CUS-1001', recipientCustomerId: 'CUS-1002' },
  { id: 'TXN-97901', customer: 'Peter Mushi', phone: '+255 688 990 004', type: 'Cash In', channel: 'Agent', amount: 20000, fee: 0, status: 'Successful', date: '2026-10-02', time: '09:48', recipientName: 'Omary Chacha', recipientAccount: 'FA-384024', customerId: 'CUS-1004' },
  { id: 'TXN-97902', customer: 'Fatma Said', phone: '+255 677 102 865', type: 'Cash Out', channel: 'Agent', amount: 35000, fee: 400, status: 'Successful', date: '2026-10-03', time: '12:36', recipientName: 'Bakari Juma', recipientAccount: 'FA-384026', customerId: 'CUS-1005' },
  { id: 'TXN-97903', customer: 'Daniel Kessy', phone: '+255 713 558 902', type: 'Cash In', channel: 'Agent', amount: 12500, fee: 0, status: 'Successful', date: '2026-10-01', time: '18:11', recipientName: 'Zainab Mrisho', recipientAccount: 'FA-384027', customerId: 'CUS-1006' },
  { id: 'TXN-97904', customer: 'Neema Lyimo', phone: '+255 621 904 377', type: 'Cash Out', channel: 'Agent', amount: 60000, fee: 800, status: 'Successful', date: '2026-09-20', time: '10:54', recipientName: 'Elias Mwakalinga', recipientAccount: 'FA-384028', customerId: 'CUS-1007' },
  { id: 'TXN-97905', customer: 'Imani Mbwana', phone: '+255 689 213 540', type: 'Cash In', channel: 'Agent', amount: 19000, fee: 0, status: 'Successful', date: '2026-10-20', time: '07:58', recipientName: 'Fadhili Mushi', recipientAccount: 'FA-384029', customerId: 'CUS-1008' },
  { id: 'TXN-97906', customer: 'Salma Rajab', phone: '+255 754 880 102', type: 'Cash In', channel: 'Agent', amount: 10500, fee: 0, status: 'Successful', date: '2026-10-20', time: '08:22', recipientName: 'Said Ramadhani', recipientAccount: 'FA-384031', customerId: 'CUS-1009' },
  { id: 'TXN-97907', customer: 'Hassan Kitwana', phone: '+255 713 902 448', type: 'Cash Out', channel: 'Agent', amount: 31000, fee: 300, status: 'Successful', date: '2026-10-20', time: '10:40', recipientName: 'Neema Komba', recipientAccount: 'FA-384032', customerId: 'CUS-1010' },
  { id: 'TXN-97908', customer: 'John Foxton', phone: '+255 712 003 221', type: 'Cash In', channel: 'Agent', amount: 12000, fee: 0, status: 'Successful', date: '2026-09-01', time: '15:03', recipientName: 'Yusuf Abdallah', recipientAccount: 'FA-384033', customerId: 'CUS-1002' },
  { id: 'TXN-97909', customer: 'Asha Juma', phone: '+255 617 812 845', type: 'Cash In', channel: 'Agent', amount: 14000, fee: 0, status: 'Successful', date: '2026-10-20', time: '11:17', recipientName: 'Grace Lyimo', recipientAccount: 'FA-384034', customerId: 'CUS-1001' },
  { id: 'TXN-98301', customer: 'Grace Mwangi', phone: '+255 755 442 118', type: 'W2B', channel: 'Web App', amount: 50000, fee: 1000, status: 'Successful', date: '2026-10-24', time: '10:15', recipientName: 'NMB Bank', recipientAccount: '0142220099881', customerId: 'CUS-1003' },
  { id: 'TXN-98302', customer: 'Peter Mushi', phone: '+255 688 990 004', type: 'W2B', channel: 'USSD', amount: 25000, fee: 0, status: 'Pending', date: '2026-10-25', time: '16:40', recipientName: 'CRDB Bank', recipientAccount: '0110123456789', customerId: 'CUS-1004' },
]
