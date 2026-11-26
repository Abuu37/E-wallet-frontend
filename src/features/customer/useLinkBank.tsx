import { useState } from 'react'
import type { PlaidLinkOnSuccessMetadata } from 'react-plaid-link'
import { ApiError, api } from '../../shared/api/client'
import { toast } from '../../shared/ui/toast'
import { bankName, type LinkedBank } from './bankTypes'
import { PlaidBankLauncher } from './PlaidBankLauncher'

/**
 * Link a bank through Plaid Link. `start` opens the secure Plaid window; when the person finishes, the one-time token
 * goes to our server, which keeps the access token. Render `launcher` once anywhere in the page.
 */
export function useLinkBank(onLinked: (bank: LinkedBank) => void) {
  const [token, setToken] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function start() {
    setBusy(true)
    try {
      const { linkToken } = await api<{ linkToken: string }>('/banks/link-token', { method: 'POST' })
      setToken(linkToken)
    } catch (err) {
      setBusy(false)
      toast.error('Could not open your bank', { description: err instanceof ApiError ? err.message : 'Please try again.' })
    }
  }

  async function finish(publicToken: string, meta: PlaidLinkOnSuccessMetadata) {
    setToken(null)
    try {
      const bank = await api<LinkedBank>('/banks/exchange', { method: 'POST', body: { publicToken, accountId: meta.accounts?.[0]?.id } })
      toast.success('Bank linked', { description: bankName(bank) })
      onLinked(bank)
    } catch (err) {
      toast.error('Could not link this bank', { description: err instanceof ApiError ? err.message : 'Please try again.' })
    } finally { setBusy(false) }
  }

  const launcher = token ? <PlaidBankLauncher token={token} onSuccess={(pt, meta) => void finish(pt, meta)} onExit={() => { setToken(null); setBusy(false) }} /> : null
  return { start: () => void start(), busy, launcher }
}
