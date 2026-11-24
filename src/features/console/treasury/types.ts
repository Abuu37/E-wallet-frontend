type Amount = number | string

export interface TreasuryRequest {
  requestId: string
  requestRef: string
  requestType: 'TOPUP' | 'WITHDRAWAL'
  agentId: string
  agentNumber: string
  agentName: string
  region: string | null
  district: string | null
  phone: string | null
  accountNumber: string
  amount: Amount
  reason: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  decidedByUserName: string | null
  decisionNote: string | null
  decidedAt: string | null
  createdAt: string
  externalReference: string | null
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
