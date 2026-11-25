import { useEffect } from 'react'
import { toast } from './toast'

/** Tells the person when the browser loses and regains its connection. Renders nothing. */
export function ConnectionToasts() {
  useEffect(() => {
    const offline = () => toast.warning('You are offline', { description: 'Changes cannot be saved until the connection is back.', duration: 6000 })
    const online = () => toast.success('Back online')
    window.addEventListener('offline', offline)
    window.addEventListener('online', online)
    return () => { window.removeEventListener('offline', offline); window.removeEventListener('online', online) }
  }, [])
  return null
}
