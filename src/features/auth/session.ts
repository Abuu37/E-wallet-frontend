import { customers, type Customer } from '../customers/data'

const SESSION_KEY = 'walletpesa.currentCustomerId'

/**
 * Stand-in for a real backend session. A real system hands back a session token after
 * authenticating; this frontend-only app has no backend to issue one, so it stores the
 * resolved identity directly — same shape (something durable that says "who is this"),
 * just backed by localStorage instead of a server-side session store.
 */
export const setCurrentCustomerId = (id: string) => {
  try {
    localStorage.setItem(SESSION_KEY, id)
  } catch {
    // localStorage unavailable (private browsing, etc.) — session just won't survive a reload.
  }
}

export const getCurrentCustomerId = (): string | null => {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

export interface CurrentCustomer {
  customer: Customer
  /** True when there was no real session to resolve and this is a demo fallback — the UI must surface this, never pretend it's a real login. */
  isFallback: boolean
}

/**
 * Resolves who's "logged in" as a customer. Falls back to the first seeded customer so
 * /account stays viewable by direct navigation without going through Login first — the
 * fallback must be shown transparently in the UI, not silently.
 */
export const getCurrentCustomer = (): CurrentCustomer => {
  const id = getCurrentCustomerId()
  const match = id ? customers.find((c) => c.id === id) : undefined
  return match ? { customer: match, isFallback: false } : { customer: customers[0], isFallback: true }
}
