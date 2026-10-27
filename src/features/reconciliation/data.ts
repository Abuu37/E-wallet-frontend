import { chartOfAccounts, getAccountBalance, getCashierFloatBalance } from '../ledger/data'
import { cashiers, type Cashier } from '../cashiers/data'

export type ReconciliationScope = 'Company' | 'Cashier'
export type ReconciliationStatus = 'Balanced' | 'Open' | 'Investigating' | 'Resolved' | 'Written Off'

export interface ReconciliationRun {
  id: string
  scope: ReconciliationScope
  /** Set only when scope is 'Cashier'. */
  cashierId?: string
  asOf: string
  /** The real bank statement amount (Company scope) or physically counted cash (Cashier scope) — entered by whoever performed the run. */
  statementAmount: number
  /** Captured from the live ledger at the moment the run was created — a historical record, not recomputed later. */
  ledgerAmount: number
  difference: number
  status: ReconciliationStatus
  notes?: string
  resolvedAt?: string
  performedBy: string
}

const round2 = (value: number) => Math.round(value * 100) / 100

const balanceOf = (accountId: string) => {
  const account = chartOfAccounts.find((item) => item.id === accountId)
  return account ? getAccountBalance(account) : 0
}

/**
 * What the ledger implies the real bank account should currently hold: e-money liabilities
 * plus equity, minus the portion already backed by Loans Receivable instead of bank cash.
 * Same formula the Company Wallet page's balance check used before it was simplified away.
 */
export const getCompanyLedgerAmount = () => {
  const liabilities = balanceOf('2000') + balanceOf('2005') + balanceOf('2010') + balanceOf('2020')
  const equity = balanceOf('4000') - balanceOf('5000')
  const loansReceivable = balanceOf('1020')
  return round2(liabilities + equity - loansReceivable)
}

/** What the ledger says this cashier's float should currently be. */
export const getCashierLedgerAmount = (cashier: Cashier) => round2(getCashierFloatBalance(cashier))

export const getCashierName = (cashierId?: string) =>
  (cashierId && cashiers.find((c) => c.id === cashierId)?.name) || '—'

/** Builds a new run from user input, capturing today's live ledger amount as a frozen snapshot. */
export const buildReconciliationRun = (params: {
  id: string
  scope: ReconciliationScope
  cashierId?: string
  statementAmount: number
  performedBy: string
}): ReconciliationRun => {
  const cashier = params.cashierId ? cashiers.find((c) => c.id === params.cashierId) : undefined
  const ledgerAmount =
    params.scope === 'Cashier' && cashier ? getCashierLedgerAmount(cashier) : getCompanyLedgerAmount()
  const statementAmount = round2(params.statementAmount)
  const difference = round2(statementAmount - ledgerAmount)
  return {
    id: params.id,
    scope: params.scope,
    cashierId: params.scope === 'Cashier' ? params.cashierId : undefined,
    asOf: new Date().toISOString(),
    statementAmount,
    ledgerAmount,
    difference,
    status: Math.abs(difference) < 0.01 ? 'Balanced' : 'Open',
    performedBy: params.performedBy.trim() || 'Unknown',
  }
}

// Historical runs are hand-seeded, not computed live — each one is a frozen record of what was
// true at that past moment, the same way a real audit trail never recalculates old entries.
export const reconciliationRuns: ReconciliationRun[] = [
  {
    id: 'RCN-001',
    scope: 'Company',
    asOf: '2026-10-01T08:00:00Z',
    statementAmount: 420000.0,
    ledgerAmount: 420000.0,
    difference: 0,
    status: 'Balanced',
    performedBy: 'Grace Mahundi',
  },
  {
    id: 'RCN-002',
    scope: 'Company',
    asOf: '2026-10-08T08:00:00Z',
    statementAmount: 538500.0,
    ledgerAmount: 540000.0,
    difference: -1500.0,
    status: 'Resolved',
    notes:
      'Bank deducted a monthly account fee directly from the trust account that had not yet been booked as an expense. Corrected and recorded against Commission Expense.',
    resolvedAt: '2026-10-09T10:30:00Z',
    performedBy: 'Victor Lema',
  },
  {
    id: 'RCN-003',
    scope: 'Company',
    asOf: '2026-10-15T08:00:00Z',
    statementAmount: 680000.0,
    ledgerAmount: 680000.0,
    difference: 0,
    status: 'Balanced',
    performedBy: 'Grace Mahundi',
  },
  {
    id: 'RCN-004',
    scope: 'Company',
    asOf: '2026-10-22T08:00:00Z',
    statementAmount: 795966.75,
    ledgerAmount: 795966.75,
    difference: 0,
    status: 'Balanced',
    performedBy: 'Hassan Bakari',
  },
  {
    id: 'RCN-005',
    scope: 'Cashier',
    cashierId: 'CSH-3001',
    asOf: '2026-10-20T17:00:00Z',
    statementAmount: 69300.0,
    ledgerAmount: 69300.0,
    difference: 0,
    status: 'Balanced',
    performedBy: 'Neema Chuwa',
  },
  {
    id: 'RCN-006',
    scope: 'Cashier',
    cashierId: 'CSH-3008',
    asOf: '2026-10-21T17:00:00Z',
    statementAmount: 58700.0,
    ledgerAmount: 59200.0,
    difference: -500.0,
    status: 'Open',
    performedBy: 'Joseph Mkude',
  },
]
