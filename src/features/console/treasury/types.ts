type Amount = number | string

export type RequestType = 'TOPUP' | 'WITHDRAWAL' | 'MINT' | 'COMMISSION_TOPUP'

export const TYPE_LABEL: Record<RequestType, string> = {
  TOPUP: 'Float top-up',
  WITHDRAWAL: 'Float withdrawal',
  MINT: 'Mint (retired)',
  COMMISSION_TOPUP: 'Commission top-up (retired)',
}

/** Float comes straight from escrow now. Mint and commission-request rows only remain so old history still reads. */
export const isRetired = (t: RequestType) => t === 'MINT' || t === 'COMMISSION_TOPUP'

export interface TreasuryRequest {
  requestId: string
  requestRef: string
  requestType: RequestType
  /** Null for the retired staff-raised requests. */
  agentId: string | null
  agentNumber: string | null
  agentName: string | null
  region: string | null
  district: string | null
  phone: string | null
  accountNumber: string | null
  amount: Amount
  reason: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  decidedByUserName: string | null
  decisionNote: string | null
  decidedAt: string | null
  createdAt: string
  externalReference: string | null
  requestedByUserId: string | null
  requestedByUserName: string | null
}

export interface TreasuryList {
  summary: {
    totalRequests: number
    pending: { count: number; balance: Amount }
    approved: { count: number; balance: Amount }
    rejected: { count: number; balance: Amount }
  }
  requests: TreasuryRequest[]
}
