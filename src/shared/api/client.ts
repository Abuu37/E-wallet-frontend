/**
 * The one HTTP client for the app.
 *  - base URL from VITE_API_BASE_URL
 *  - access token lives in this module's memory only (never web storage)
 *  - the refresh token is an httpOnly cookie the browser sends by itself; we only send the CSRF header
 *  - a 401 triggers one refresh (shared by concurrent calls) and one retry
 */

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

export interface ApiEnvelope<T> {
  timestamp?: string
  status: number
  message?: string
  data: T
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>
  /** From the X-Correlation-Id response header when the server sends one; quote it to support. */
  readonly correlationId: string | null

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}, correlationId: string | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.correlationId = correlationId
  }

  get isUnauthorized() { return this.status === 401 }
  get isForbidden() { return this.status === 403 }
  get isRateLimited() { return this.status === 429 }
}

// ---- in-memory session token --------------------------------------------------------------
let accessToken: string | null = null
let onSessionLost: (() => void) | null = null

export const getAccessToken = () => accessToken
export const setAccessToken = (token: string | null) => { accessToken = token }
/** The session provider registers this so a failed refresh signs the user out. */
export const setSessionLostHandler = (handler: (() => void) | null) => { onSessionLost = handler }

// ---- CSRF (only the cookie-authenticated endpoints need it) -------------------------------
function readCookie(name: string): string | null {
  const match = document.cookie.split('; ').find((c) => c.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null
}

async function csrfToken(): Promise<string | null> {
  let token = readCookie('XSRF-TOKEN')
  if (!token) {
    await fetch(`${BASE_URL}/auth/csrf`, { credentials: 'same-origin' })
    token = readCookie('XSRF-TOKEN')
  }
  return token
}

// ---- helpers ------------------------------------------------------------------------------
/** A fresh key per user attempt. Reuse the same key when retrying the same attempt. */
export const newIdempotencyKey = (): string => crypto.randomUUID()

async function toApiError(response: Response): Promise<ApiError> {
  let message = 'Something went wrong. Please try again.'
  let fieldErrors: Record<string, string> = {}
  try {
    const body = await response.json()
    if (typeof body?.message === 'string') message = body.message
    if (body?.errors && typeof body.errors === 'object') fieldErrors = body.errors
  } catch {
    /* non-JSON body: keep the generic message */
  }
  if (response.status === 429) {
    const retry = response.headers.get('Retry-After')
    message = retry ? `Too many attempts. Try again in ${retry} seconds.` : 'Too many attempts. Please try again later.'
  }
  return new ApiError(response.status, message, fieldErrors, response.headers.get('X-Correlation-Id'))
}

// ---- refresh (single flight) --------------------------------------------------------------
export interface SessionTokens {
  accessToken: string
  roles: string[]
  permissions: string[]
  mustChangePin: boolean
  accessTokenExpiresIn: number
}

let refreshInFlight: Promise<SessionTokens> | null = null

export function refreshSession(): Promise<SessionTokens> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      const token = await csrfToken()
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: token ? { 'X-XSRF-TOKEN': token } : {},
      })
      if (!response.ok) throw await toApiError(response)
      const body = (await response.json()) as ApiEnvelope<SessionTokens>
      setAccessToken(body.data.accessToken)
      return body.data
    })().finally(() => { refreshInFlight = null })
  }
  return refreshInFlight
}

// ---- main request -------------------------------------------------------------------------
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined | null>
  idempotencyKey?: string
  signal?: AbortSignal
  /** Skip the Bearer header and the 401 refresh (login, register, OTP...). */
  anonymous?: boolean
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = `${BASE_URL}${path}`
  if (!query) return url
  const params = new URLSearchParams()
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  })
  const qs = params.toString()
  return qs ? `${url}?${qs}` : url
}

async function send(path: string, opts: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  if (opts.idempotencyKey) headers['Idempotency-Key'] = opts.idempotencyKey
  if (!opts.anonymous && accessToken) headers.Authorization = `Bearer ${accessToken}`
  return fetch(buildUrl(path, opts.query), {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: 'same-origin',
    signal: opts.signal,
  })
}

/** Returns the unwrapped `data` of the ApiResponse envelope. */
export async function api<T = void>(path: string, opts: RequestOptions = {}): Promise<T> {
  let response = await send(path, opts)

  if (response.status === 401 && !opts.anonymous) {
    try {
      await refreshSession()
      response = await send(path, opts) // retried once
    } catch {
      setAccessToken(null)
      onSessionLost?.()
      throw new ApiError(401, 'Your session has ended. Please sign in again.')
    }
  }

  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  const text = await response.text()
  if (!text) return undefined as T
  const body = JSON.parse(text) as ApiEnvelope<T>
  return body.data
}

/** Cookie-authenticated POSTs (logout) that must carry the CSRF header. */
export async function apiWithCsrf<T = void>(path: string, opts: RequestOptions = {}): Promise<T> {
  const token = await csrfToken()
  const response = await fetch(buildUrl(path, opts.query), {
    method: opts.method ?? 'POST',
    headers: token ? { 'X-XSRF-TOKEN': token, Accept: 'application/json' } : { Accept: 'application/json' },
    credentials: 'same-origin',
  })
  if (!response.ok) throw await toApiError(response)
  return undefined as T
}
