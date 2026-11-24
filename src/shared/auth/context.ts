import { createContext, useContext } from 'react'
import type { Session, SessionStatus } from './types'

export interface SessionContextValue {
  status: SessionStatus
  session: Session | null
  signIn: (phone: string, pin: string) => Promise<Session>
  signOut: () => Promise<void>
  /** Drops the local session without calling the server (the server already revoked it, e.g. after a PIN change). */
  endSession: () => void
  has: (permission: string) => boolean
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
