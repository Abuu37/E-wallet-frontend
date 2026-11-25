import { Loader2, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../auth/context'
import { maskEmail } from '../lib/phone'
import { Modal } from './Modal'
import { toast } from './toast'

const STAY = 'inline-flex h-11 items-center justify-center border border-slate-300 bg-white px-7 text-sm font-bold text-ink transition-colors hover:border-brand hover:bg-blue-50 hover:text-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:opacity-50'

/** Confirms before ending the session, then signs out, shows a toast and goes to the sign-in screen. */
export function LogoutConfirm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { session, signOut } = useSession()
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
    <Modal open={open} sharp width={440} title="Confirm logout" subtitle="You are about to end your session." onClose={busy ? () => {} : onClose}
      footer={<>
        <button type="button" onClick={onClose} disabled={busy} className={STAY}>Stay</button>
        <button type="button" onClick={() => void confirm()} disabled={busy}
          className="group relative inline-flex h-11 items-center justify-center overflow-hidden bg-[#E11D48] px-7 text-sm font-bold text-white transition-transform duration-150 hover:shadow-[0_8px_18px_-8px_rgba(225,29,72,0.8)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-rose-300 disabled:opacity-60 motion-reduce:transition-none">
          <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-[#9F1239] transition-transform duration-300 ease-out group-hover:translate-x-0 motion-reduce:transition-none" />
          <span className="relative flex items-center gap-2">
            {busy ? <Loader2 aria-hidden="true" size={16} className="animate-spin" /> : <LogOut aria-hidden="true" size={16} className="transition-transform duration-300 ease-out group-hover:translate-x-1 motion-reduce:transition-none" />}
            Logout
          </span>
        </button>
      </>}>
      <div className="flex gap-4 pb-3">
        <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center border border-rose-200 bg-rose-50 text-[#E11D48]"><LogOut size={20} /></span>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-semibold text-ink">Sign out of WalletPesa on this device?</p>
          <p className="text-[13px] leading-normal text-slate-600">You will need your phone number and PIN to sign in again. Anything you have not saved or submitted will not be sent.</p>
        </div>
      </div>
      {session?.email && (
        <dl className="border-t border-line py-3 text-[13px]">
          <div className="flex justify-between gap-4"><dt className="text-muted">Signed in as</dt><dd className="truncate font-semibold">{maskEmail(session.email)}</dd></div>
        </dl>
      )}
    </Modal>
  )
}
