import { transactions } from '../transactions/data'
import type { Cashier, CashierStatus } from './data'

export const daysSince = (value: string) => {
  const datePart = value.slice(0, 10)
  const diffMs = Date.now() - new Date(`${datePart}T00:00:00`).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

export const getCashierTransactions = (cashier: Cashier) =>
  transactions.filter((tx) => tx.recipientName === cashier.name)

export const getLastActiveDate = (cashier: Cashier) => {
  const cashierTx = getCashierTransactions(cashier)
  if (cashierTx.length === 0) return cashier.joined
  return cashierTx.reduce((latest, tx) => (tx.date > latest ? tx.date : latest), cashierTx[0].date)
}

export const getCashierStatus = (cashier: Cashier): CashierStatus => {
  if (cashier.unauthorizedReported) return 'Blocked'
  if (getCashierTransactions(cashier).length === 0) return 'Pending'
  const days = daysSince(getLastActiveDate(cashier))
  if (days > 30) return 'Dormant'
  if (days > 7) return 'Idle'
  return 'Active'
}
