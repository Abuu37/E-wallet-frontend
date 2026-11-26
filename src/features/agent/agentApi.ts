type Amount = number | string

/** One transaction the agent conducted: a cash-in, or a customer withdrawal paid at the till. */
export interface TillTx {
  reference: string
  type: 'CASH_IN' | 'CASH_OUT'
  customerName: string
  /** Masked in the list, in full in the detail. */
  customerPhone: string
  customerAccount: string
  amount: Amount
  customerFee: Amount
  commission: Amount
  status: string
  createdAt: string
}

export interface TillTxPage {
  items: TillTx[]
  page: number
  size: number
  totalElements: number
  kpis: { todayCount: number; cashInToday: number; withdrawalsToday: number; pendingToday: number; commissionToday: Amount }
}

export interface LiveWithdrawal { reference: string; amount: Amount; customerName: string; customerPhone: string; matchCode: string | null; commission: Amount; createdAt: string }

export interface WeeklyDay { date: string; cashInCount: number; cashInAmount: Amount; withdrawalCount: number; withdrawalAmount: Amount }

export interface FloatBankSummary { dailyCap: Amount; usedToday: Amount; leftToday: Amount }

export interface EscrowDetails { bankName: string; accountName: string; accountNumber: string; reference: string }

export interface FloatRequestRow {
  requestId: string
  requestRef: string
  requestType: string
  amount: Amount
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  decisionNote: string | null
  decidedAt: string | null
  createdAt: string
  externalReference: string | null
  hasSlip: boolean
}

export const TILL_TYPE_LABEL: Record<string, string> = { CASH_IN: 'Cash-in', CASH_OUT: 'Withdrawal' }
