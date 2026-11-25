import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../auth/context'
import { Button } from './controls'
import { Modal } from './Modal'
import { toast } from './toast'

/** Asks before ending the session, then signs out, shows a toast and goes to the sign-in screen. */
export function LogoutConfirm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signOut } = useSession()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)

  async function confirm() {
    setBusy(true)
    try {
      await signOut()
      toast.success('Logged out', { description: 'Your session has ended on this device.' })
      navigate('/login', { replace: true })
    } finally { setBusy(false) }
  }

  return (
    <Modal open={open} title="Log out of WalletPesa?" width={420} onClose={busy ? () => {} : onClose}
      subtitle="Your session will end on this device. You will need your phone number and PIN to sign in again."
      footer={<>
        <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Stay signed in</Button>
        <Button type="button" variant="danger" loading={busy} onClick={() => void confirm()}><LogOut aria-hidden="true" size={16} /> Log out</Button>
      </>}>
      <p className="pb-2 text-sm text-slate-600">Anything you have not saved or submitted will not be sent.</p>
    </Modal>
  )
}
