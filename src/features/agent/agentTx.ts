import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'

type Amount = number | string

export interface AgentTx {
  reference: string
  type: string
  amount: Amount
  fee: Amount | null
  commission: Amount | null
  status: string
  createdAt: string
  fromAccountNumber: string | null
  fromAccountName: string | null
  toAccountNumber: string | null
  toAccountName: string | null
}
export interface AgentTxList { transactions: AgentTx[]; page: number; size: number; totalElements: number }

/** What an agent serves: cash-ins, and withdrawals paid at the till (CASH_OUT). */
export const TYPE_LABEL: Record<string, string> = { CASH_IN: 'Cash-in', CASH_OUT: 'Withdrawal' }
export const SERVED_TYPES = ['CASH_IN', 'CASH_OUT']
export const typeLabel = (t: string) => TYPE_LABEL[t] ?? t.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())

/** The party on the other side of the agent's own wallets. */
export function counterparty(tx: AgentTx, ownAccounts: string[]): { name: string; account: string } {
  const fromIsOwn = tx.fromAccountNumber !== null && ownAccounts.includes(tx.fromAccountNumber)
  return fromIsOwn
    ? { name: tx.toAccountName ?? '—', account: tx.toAccountNumber ?? '' }
    : { name: tx.fromAccountName ?? '—', account: tx.fromAccountNumber ?? '' }
}

export const FETCH_SIZE = 200

/** The agent's own transactions (the server returns only those touching the agent's wallets). */
export function useAgentTransactions() {
  return useApi<AgentTxList>((signal) => api('/transactions', { query: { size: FETCH_SIZE }, signal }), [], 30_000)
}
