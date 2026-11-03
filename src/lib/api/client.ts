import axios, { AxiosError } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

interface ApiEnvelope<T> {
  timestamp: string
  status: number
  message: string
  data: T
}

interface ApiErrorBody {
  error?: string
  errors?: Record<string, string> | null
  message?: string
  path?: string
  status?: number
  timestamp?: string
}

export class ApiRequestError extends Error {
  fieldErrors: Record<string, string> | null

  constructor(message: string, fieldErrors: Record<string, string> | null = null) {
    super(message)
    this.name = 'ApiRequestError'
    this.fieldErrors = fieldErrors
  }
}

apiClient.interceptors.response.use(
  (response) => {
    const envelope = response.data as ApiEnvelope<unknown>
    response.data = envelope?.data ?? envelope
    return response
  },
  (error: AxiosError<ApiErrorBody>) => {
    const body = error.response?.data
    const message = body?.message ?? error.message ?? 'Something went wrong. Please try again.'
    return Promise.reject(new ApiRequestError(message, body?.errors ?? null))
  },
)
