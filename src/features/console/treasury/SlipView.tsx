import { FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { apiBlob } from '../../../shared/api/client'

/** The deposit slip the agent uploaded. It is fetched with the staff member's login, never from a public link. */
export function SlipView({ requestId }: { requestId: string }) {
  const [file, setFile] = useState<{ url: string; pdf: boolean } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let url = ''
    let cancelled = false
    apiBlob(`/treasury/requests/${requestId}/slip`).then((blob) => {
      if (cancelled) return
      url = URL.createObjectURL(blob)
      setFile({ url, pdf: blob.type === 'application/pdf' })
    }).catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url) }
  }, [requestId])

  if (failed) return <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">The slip could not be loaded.</p>
  if (!file) return <p className="text-sm text-muted">Loading the slip…</p>
  return file.pdf
    ? <a href={file.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-bold text-brand-dark"><FileText aria-hidden="true" size={18} /> Open the slip (PDF)</a>
    : <a href={file.url} target="_blank" rel="noreferrer" aria-label="Open the slip photo in a new tab"><img src={file.url} alt="Deposit slip uploaded by the agent" className="max-h-72 w-full rounded-xl border border-line object-contain" /></a>
}
