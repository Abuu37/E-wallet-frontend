import { Loader2, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../auth/context'
import { Modal } from './Modal'
import { toast } from './toast'

const STAY = 'inline-flex h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-7 text-sm font-bold text-ink transition-colors hover:border-brand hover:bg-blue-50 hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:opacity-50'

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
    <Modal open={open} radius="small" width={420} title="Log out" onClose={busy ? () => {} : onClose}
      footer={<>
        <button type="button" onClick={onClose} disabled={busy} className={STAY}>Stay</button>
        <button type="button" onClick={() => void confirm()} disabled={busy}
          className="group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-full bg-[#E11D48] px-7 text-sm font-bold text-white transition-transform duration-150 hover:shadow-[0_8px_18px_-8px_rgba(225,29,72,0.8)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 disabled:opacity-60 motion-reduce:transition-none">
          <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-[#9F1239] transition-transform duration-300 ease-out group-hover:translate-x-0 motion-reduce:transition-none" />
          <span className="relative flex items-center gap-2">
            {busy ? <Loader2 aria-hidden="true" size={16} className="animate-spin" /> : <LogOut aria-hidden="true" size={16} className="transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none" />}
            Logout
          </span>
        </button>
      </>}>
      <div className="flex flex-col gap-1 pb-3">
        <p className="text-[15px] font-semibold text-ink">Do you want to log out?</p>
        <p className="text-sm text-slate-600">You will need your phone number and PIN to log in again.</p>
      </div>
    </Modal>
  )
}
