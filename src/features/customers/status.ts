import { transactions } from '../transactions/data'
import { getCustomerBalance } from '../ledger/data'
import type { Customer, CustomerStatus } from './data'

export const daysSince = (value: string) => {
  const diffMs = Date.now() - new Date(`${value}T00:00:00`).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

export const getCustomerTransactions = (customer: Customer) =>
  transactions.filter((tx) => tx.customer === customer.name)

export const getLastActiveDate = (customer: Customer) => {
  const customerTx = getCustomerTransactions(customer)
  if (customerTx.length === 0) return customer.joined
  return customerTx.reduce((latest, tx) => (tx.date > latest ? tx.date : latest), customerTx[0].date)
}

const DORMANT_THRESHOLD_DAYS = 60

export const getCustomerStatus = (customer: Customer): CustomerStatus => {
  if (getCustomerBalance(customer) === 0 && getCustomerTransactions(customer).length === 0) return 'Inactive'
  const days = daysSince(getLastActiveDate(customer))
  if (days > DORMANT_THRESHOLD_DAYS) return 'Dormant'
  return 'Active'
}
