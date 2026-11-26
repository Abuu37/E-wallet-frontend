/** Mirrors DashboardOverviewResponse. Amounts arrive as JSON numbers; convert with amountOf() on read. */
type Amount = number | string

export interface TypeMetric { count: number; volume: Amount }

export interface OverviewResponse {
  timestamp: string
  currency: string
  liquidityCards: {
    escrowBankBalance: Amount
    commissionPoolBalance: Amount
    companyRevenueBalance: Amount
    totalAgentFloatBalance: Amount
    totalAgentCommissionBalance: Amount
    totalCustomerWalletBalance: Amount
    isLedgerBalanced: boolean
  }
  transactionMetrics: {
    range: string
    periodStart: string
    periodEnd: string
    totalVolume: Amount
    totalCount: number
    breakdown: { cashIn: TypeMetric; cashOut: TypeMetric; serviceFee: TypeMetric; commission: TypeMetric }
    trend: { period: string; volume: Amount; count: number }[]
  }
  actionAlerts: {
    pendingFloatRequests: {
      count: number
      totalRequestedAmount: Amount
      recentRequests: {
        requestId: string
        agentCode: string
        businessName: string
        requestType: string
        floatAccountNumber: string
        amount: Amount
        externalReference: string | null
        requestedAt: string
      }[]
    }
    lowFloatAgents: {
      threshold: Amount
      count: number
      agents: { agentId: string; agentCode: string; businessName: string; phoneNumber: string; floatAccountNumber: string; currentBalance: Amount }[]
    }
  }
  networkStats: { totalActiveAgents: number; totalActiveCustomers: number; pendingTransactionsToday: TypeMetric; failedTransactionsToday: TypeMetric }
  recentTransactions: {
    referenceNo: string
    transactionType: string
    amount: Amount
    status: string
    createdAt: string
    fromAccountName: string
    fromAccountNumber: string
    toAccountName: string
    toAccountNumber: string
  }[]
}
