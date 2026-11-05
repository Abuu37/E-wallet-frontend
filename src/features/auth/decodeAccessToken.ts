interface AccessTokenClaims {
  sub?: string
  email?: string
  roles?: string
  permissions?: string[]
  type?: string
  iat?: number
  exp?: number
}

/**
 * Decodes a JWT's payload without verifying its signature. Safe for reading
 * display-only claims (e.g. email) client-side — never use this for
 * authorization decisions, since an unverified token can't be trusted.
 */
export function decodeAccessToken(token: string): AccessTokenClaims | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}
