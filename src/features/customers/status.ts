import { transactions } from '../transactions/data'
import type { Customer, CustomerStatus } from './data'

export const daysSince = (value: string) => {
  const diffMs = Date.now() - new Date(`${value}T00:00:00`).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

export const getLastActiveDate = (customer: Customer) => {
  const customerTx = transactions.filter((tx) => tx.customer === customer.name)
  if (customerTx.length === 0) return customer.joined
  return customerTx.reduce((latest, tx) => (tx.date > latest ? tx.date : latest), customerTx[0].date)
}

export const getCustomerStatus = (customer: Customer): CustomerStatus => {
  const days = daysSince(getLastActiveDate(customer))
  if (days >= 90) return 'Inactive'
  if (days >= 30) return 'Dormant'
  return 'Active'
}
