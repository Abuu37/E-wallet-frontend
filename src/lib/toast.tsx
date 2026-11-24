import { toast as toastify, type ToastOptions } from 'react-toastify'

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

const buildOptions = ({ duration }: ToastExtra): ToastOptions =>
  duration !== undefined ? { autoClose: duration } : {}

export const toast = {
  success: (title: string, extra: ToastExtra = {}) =>
    toastify.success(content(title, extra.description), buildOptions(extra)),
  error: (title: string, extra: ToastExtra = {}) =>
    toastify.error(content(title, extra.description), buildOptions(extra)),
  info: (title: string, extra: ToastExtra = {}) =>
    toastify.info(content(title, extra.description), buildOptions(extra)),
}
