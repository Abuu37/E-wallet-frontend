import { useAuth } from '../../components/context/AuthContext'
import { decodeAccessToken } from './decodeAccessToken'

interface StaffIdentity {
  name: string
  initials: string
  email: string
  phone: string
  role: 'ADMIN' | 'CASHIER'
}

const defaultIdentity: StaffIdentity = {
  name: 'Staff',
  initials: 'ST',
  email: '',
  phone: '',
  role: 'ADMIN',
}

const initialsOf = (name: string) =>
  name
    .split(/[.\s_-]+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

/**
 * Resolves the logged-in staff member's display identity from the session's JWT.
 * The backend has no "get my profile" endpoint yet, so `name` is derived from the
 * JWT's email claim (the only identity data available) rather than a real display name.
 */
export function useCurrentStaffUser(): StaffIdentity {
  const { user } = useAuth()
  if (!user) return defaultIdentity

  const email = decodeAccessToken(user.accessToken)?.email ?? ''
  const name = email ? email.split('@')[0] : defaultIdentity.name

  return {
    name,
    initials: email ? initialsOf(name) : defaultIdentity.initials,
    email,
    phone: '',
    role: user.roles.includes('CASHIER') ? 'CASHIER' : 'ADMIN',
  }
}
