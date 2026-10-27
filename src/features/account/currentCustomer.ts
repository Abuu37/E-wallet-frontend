import { customers, type Customer } from '../customers/data'

/**
 * Resolves the real customer behind whoever's logged in (via mockAuth's `user.customerId`,
 * set in sessionStorage by Login.tsx). Falls back to the first seeded customer so /account
 * is still viewable by direct navigation without logging in first.
 */
export const getLoggedInCustomer = (): Customer => {
  try {
    const stored = sessionStorage.getItem('user')
    if (stored) {
      const parsed = JSON.parse(stored)
      const match = customers.find((c) => c.id === parsed.customerId)
      if (match) return match
    }
  } catch {
    // malformed session value — fall through to the default below
  }
  return customers[0]
}
