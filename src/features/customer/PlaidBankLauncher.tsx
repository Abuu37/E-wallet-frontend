import { useEffect, useRef } from 'react'
import { usePlaidLink, type PlaidLinkOnSuccessMetadata } from 'react-plaid-link'

export function PlaidBankLauncher({ token, onSuccess, onExit }: { token: string; onSuccess: (publicToken: string, meta: PlaidLinkOnSuccessMetadata) => void; onExit: () => void }) {
  const { open, ready } = usePlaidLink({ token, onSuccess, onExit })
  const opened = useRef(false)
  useEffect(() => { if (ready && !opened.current) { opened.current = true; open() } }, [ready, open])
  return null
}
