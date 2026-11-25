import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from '../ui/toast'

export interface ApiState<T> {
  data: T | undefined
  error: unknown
  loading: boolean
  reload: () => void
}

/**
 * Runs `fetcher` on mount and whenever `deps` change; optionally polls.
 * Stale responses are ignored, and polling never flips an already-loaded screen back to "loading".
 */
export function useApi<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: unknown[], pollMs?: number): ApiState<T> {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<unknown>()
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const fetcherRef = useRef(fetcher)
  useEffect(() => { fetcherRef.current = fetcher })

  useEffect(() => {
    const controller = new AbortController()
    let first = true
    let warned = false
    let loaded = false
    const run = async () => {
      if (first) setLoading(true)
      try {
        const result = await fetcherRef.current(controller.signal)
        if (controller.signal.aborted) return
        setData(result)
        setError(undefined)
        loaded = true
        warned = false
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err)
        // Data is already on screen and a refresh failed: say so once, not on every poll.
        if (loaded && !warned) { warned = true; toast.warning('Could not refresh', { description: 'Showing the last data we have. We will keep trying.' }) }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
        first = false
      }
    }
    void run()
    const timer = pollMs ? window.setInterval(() => void run(), pollMs) : undefined
    return () => { controller.abort(); if (timer) window.clearInterval(timer) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick, pollMs])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, error, loading, reload }
}
