type Amount = number | string

export interface Wallet { accountNumber: string; balance: Amount; currency: string; status: string }

export interface Profile { fullName: string; phoneNumber: string }

export interface KycLimits { perPayment: Amount; daily: Amount; maxBalance: Amount }

export interface KycInfo {
  status: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED'
  tier: 'BASIC' | 'VERIFIED'
  perPaymentLimit: Amount
  dailyLimit: Amount
  maxBalance: Amount
  basic: KycLimits
  verified: KycLimits
  usedToday: Amount
}

export interface MyTransaction {
  referenceNo: string
  type: string
  direction: 'IN' | 'OUT'
  amount: Amount
  fee: Amount
  status: string
  createdAt: string
  counterpartyName: string
  counterpartyPhone: string
  matchCode: string | null
}

export interface MyTransactionList { items: MyTransaction[]; page: number; size: number; totalElements: number }

export interface Receipt {
  reference: string
  type: string
  amount: Amount
  fee: Amount
  status: string
  createdAt: string
  direction: 'IN' | 'OUT' | null
  counterpartyName: string | null
  counterpartyPhone: string | null
  matchCode: string | null
  fromAccountNumber: string
  toAccountNumber: string
}

export interface Lookup { found: boolean; name: string | null; canReceive: boolean }
export interface Quote { type: string; amount: Amount; fee: Amount; total: Amount }
export interface Beneficiary { name: string; phone: string; lastUsedAt: string | null }
export interface NearbyAgent { name: string; tillNumber: string; district: string; region: string; open: boolean }

export interface TransferResult {
  referenceNo: string; status: string; amount: Amount; fee: Amount; total: Amount
  recipientName: string; recipientPhone: string; newBalance: Amount; createdAt: string
}

export interface WithdrawResult {
  referenceNo: string; status: string; amount: Amount; fee: Amount; total: Amount; matchCode: string
  agent: { businessName: string; tillNumber: string; district: string; region: string }
  newBalance: Amount; createdAt: string
}

/** "Cash-in" style label for a transaction type, from the customer's side. */
export function typeLabel(t: Pick<MyTransaction, 'type' | 'direction'>): string {
  if (t.type === 'TRANSFER') return t.direction === 'IN' ? 'Money received' : 'Money sent'
  if (t.type === 'CASH_IN') return 'Cash-in at agent'
  if (t.type === 'CASH_OUT') return 'Withdrawal at agent'
  return t.type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
}

/** 220341 -> 220 341 */
export const groupTill = (till: string) => (till.length === 6 ? `${till.slice(0, 3)} ${till.slice(3)}` : till)
