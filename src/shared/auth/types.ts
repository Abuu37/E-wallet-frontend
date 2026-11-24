export type Role = 'ADMIN' | 'AGENT' | 'CUSTOMER'

export interface Session {
  roles: Role[]
  permissions: string[]
  mustChangePin: boolean
  /** Display-only claim decoded from the access token; never used for authorization. */
  email: string | null
}

export type SessionStatus = 'loading' | 'anonymous' | 'authenticated'

export const STAFF_IDLE_MINUTES = 15

/** Where each role lands after sign-in. */
export function homePathFor(roles: Role[]): string {
  if (roles.includes('ADMIN')) return '/console'
  if (roles.includes('AGENT')) return '/agent'
  if (roles.includes('CUSTOMER')) return '/app'
  return '/'
}
