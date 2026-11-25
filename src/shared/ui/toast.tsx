import { Check, Info, TriangleAlert, X } from 'lucide-react'
import { toast as toastify, type ToastOptions } from 'react-toastify'
import { ApiError } from '../api/client'

interface ToastExtra {
  description?: string
  duration?: number
}

const content = (title: string, description?: string) => (
  <div>
    <p className="font-semibold text-ink">{title}</p>
    {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
  </div>
)

const buildOptions = ({ duration }: ToastExtra, icon: ToastOptions['icon']): ToastOptions => ({
  icon,
  ...(duration !== undefined ? { autoClose: duration } : {}),
})

// The badge behind the glyph (colour, circle) comes from the .Toastify__toast-icon rules in index.css.
const ICON = { size: 16, strokeWidth: 3, style: { fill: 'none' }, 'aria-hidden': true } as const

export const toast = {
  success: (title: string, extra: ToastExtra = {}) =>
    toastify.success(content(title, extra.description), buildOptions(extra, <Check {...ICON} />)),
  error: (title: string, extra: ToastExtra = {}) =>
    toastify.error(content(title, extra.description), buildOptions(extra, <X {...ICON} />)),
  warning: (title: string, extra: ToastExtra = {}) =>
    toastify.warning(content(title, extra.description), buildOptions(extra, <TriangleAlert {...ICON} />)),
  info: (title: string, extra: ToastExtra = {}) =>
    toastify.info(content(title, extra.description), buildOptions(extra, <Info {...ICON} />)),
}

/** The message to show for a failed call: the server's own words, or a plain fallback. */
export function errorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  return err instanceof ApiError && err.message ? err.message : fallback
}

/** Show a failed call as an error toast and return the message used. */
export function reportError(err: unknown, title: string, fallback?: string): string {
  const message = errorMessage(err, fallback)
  toast.error(title, { description: message })
  return message
}
