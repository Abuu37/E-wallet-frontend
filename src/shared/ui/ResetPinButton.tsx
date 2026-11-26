import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { api } from '../api/client'
import { Button } from './controls'
import { Modal } from './Modal'
import { reportError, toast } from './toast'

/**
 * An administrator resets a forgotten PIN for an agent or staff member (they have no NIDA on file for self-service).
 * The person gets a new one-time PIN by email, every session of theirs ends, and the action is audited.
 */
export function ResetPinButton({ path, name }: { path: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function reset() {
    setBusy(true)
    try {
      await api(path, { method: 'POST' })
      toast.success('PIN reset', { description: `${name} was emailed a new one-time PIN and signed out everywhere.` })
      setOpen(false)
    } catch (err) {
      reportError(err, 'PIN not reset', 'Could not reset the PIN.')
    } finally { setBusy(false) }
  }

  return (
    <>
      <Button type="button" variant="secondary" block onClick={() => setOpen(true)}><KeyRound aria-hidden="true" size={16} /> Reset PIN</Button>
      <Modal open={open} radius="small" width={440} title="Reset PIN?" onClose={busy ? () => {} : () => setOpen(false)}
        footer={<>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button type="button" loading={busy} onClick={() => void reset()}>Reset PIN</Button>
        </>}>
        <div className="flex flex-col gap-1 pb-3">
          <p className="text-[15px] font-semibold text-ink">Reset the PIN for {name}?</p>
          <p className="text-sm text-slate-600">They get a new one-time PIN by email and are signed out on every device. They must set their own PIN the next time they sign in. This is written to the audit log.</p>
        </div>
      </Modal>
    </>
  )
}
