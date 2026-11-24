import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, apiWithCsrf, refreshSession, setAccessToken, setSessionLostHandler, type SessionTokens } from '../api/client'
import { SessionContext, type SessionContextValue } from './context'
import { STAFF_IDLE_MINUTES, type Role, type Session, type SessionStatus } from './types'

function emailClaim(token: string): string | null {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const claims = JSON.parse(atob(payload)) as { email?: string }
    return claims.email ?? null
  } catch {
    return null
  }
}

function toSession(tokens: SessionTokens): Session {
  return {
    roles: tokens.roles as Role[],
    permissions: tokens.permissions,
    mustChangePin: tokens.mustChangePin,
    email: emailClaim(tokens.accessToken),
  }
}

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<SessionStatus>('loading')
  const refreshTimer = useRef<number | undefined>(undefined)
  const adoptRef = useRef<(tokens: SessionTokens) => Session>(() => { throw new Error("session not ready") })

  const clear = useCallback(() => {
    window.clearTimeout(refreshTimer.current)
    setAccessToken(null)
    setSession(null)
    setStatus('anonymous')
  }, [])

  const adopt = useCallback((tokens: SessionTokens): Session => {
    const next = toSession(tokens)
    setSession(next)
    setStatus('authenticated')
    window.clearTimeout(refreshTimer.current)
    // refresh one minute before the 15-minute access token expires
    const delay = Math.max(30_000, tokens.accessTokenExpiresIn - 60_000)
    refreshTimer.current = window.setTimeout(() => {
      refreshSession().then((t) => { adoptRef.current(t) }).catch(clear)
    }, delay)
    return next
  }, [clear])

  useEffect(() => { adoptRef.current = adopt }, [adopt])

  // On load (and on page refresh) the httpOnly cookie restores the session; no token is ever stored.
  useEffect(() => {
    setSessionLostHandler(clear)
    let cancelled = false
    refreshSession()
      .then((tokens) => { if (!cancelled) adopt(tokens) })
      .catch(() => { if (!cancelled) clear() })
    return () => {
      cancelled = true
      setSessionLostHandler(null)
      window.clearTimeout(refreshTimer.current)
    }
  }, [adopt, clear])

  const signIn = useCallback(async (phone: string, pin: string) => {
    const tokens = await api<SessionTokens>('/auth/login', { method: 'POST', body: { phone, pin }, anonymous: true })
    setAccessToken(tokens.accessToken)
    return adopt(tokens)
  }, [adopt])

  const signOut = useCallback(async () => {
    try { await apiWithCsrf('/auth/logout') } catch { /* the local session is cleared regardless */ }
    clear()
  }, [clear])

  // Staff sessions end after 15 idle minutes.
  const isStaff = session?.roles.includes('ADMIN') ?? false
  useEffect(() => {
    if (!isStaff) return
    const limit = STAFF_IDLE_MINUTES * 60_000
    let timer = window.setTimeout(() => { void signOut() }, limit)
    const reset = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => { void signOut() }, limit)
    }
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, reset, { passive: true }))
    return () => {
      window.clearTimeout(timer)
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, reset))
    }
  }, [isStaff, signOut])

  const value = useMemo<SessionContextValue>(() => ({
    status,
    session,
    signIn,
    signOut,
    endSession: clear,
    has: (permission) => session?.permissions.includes(permission) ?? false,
  }), [status, session, signIn, signOut, clear])

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
