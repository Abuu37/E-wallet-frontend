import { cashiers } from '../cashiers/data'
import type { UserRole } from './utils/mockAuth'

export interface StaffIdentity {
  name: string
  initials: string
  email: string
  phone: string
  role: UserRole
}

const defaultIdentity: StaffIdentity = {
  name: 'Code Abuu',
  initials: 'CA',
  email: '',
  phone: '',
  role: 'Admin',
}

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()

/**
 * Resolves to whoever's actually logged in — the real cashier's record for a Cashier session,
 * or Admin's own stored details for an Admin session — falling back to the generic placeholder
 * if there's no session at all. Called fresh on every render (not module scope) so it reflects
 * whoever actually just logged in, not whatever sessionStorage held when this module first
 * loaded.
 */
export function getCurrentStaffUser(): StaffIdentity {
  try {
    const stored = sessionStorage.getItem('user')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.role === 'Cashier' && parsed.cashierId) {
        const cashier = cashiers.find((item) => item.id === parsed.cashierId)
        if (cashier) {
          return {
            name: cashier.name,
            initials: initialsOf(cashier.name),
            email: cashier.email,
            phone: cashier.phone,
            role: 'Cashier',
          }
        }
      }
      if (parsed.role === 'Admin' && parsed.name) {
        return {
          name: parsed.name,
          initials: initialsOf(parsed.name),
          email: parsed.email ?? '',
          phone: parsed.phone ?? '',
          role: 'Admin',
        }
      }
    }
  } catch {
    // malformed session value — fall through to the default below
  }
  return defaultIdentity
}
