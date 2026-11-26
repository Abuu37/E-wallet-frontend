import { Copy, FileImage, Upload, X } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { ApiError, api, newIdempotencyKey } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { formatDateTime } from '../../shared/lib/dates'
import { formatTzs, normalizeAmount } from '../../shared/lib/money'
import { Button } from '../../shared/ui/controls'
import { toast } from '../../shared/ui/toast'
import type { EscrowDetails, FloatRequestRow } from './agentApi'

const MAX_BYTES = 5 * 1024 * 1024
const FIELD = 'rounded-[14px] border border-slate-300 px-4 text-ink focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200'

function Step({ title, sub, state }: { title: string; sub: string; state: 'done' | 'now' | 'todo' }) {
  const dot = state === 'done' ? 'bg-accent' : state === 'now' ? 'bg-brand' : 'border-2 border-slate-600'
  return (
    <li className="flex gap-3.5">
      <span className="flex flex-col items-center"><span aria-hidden="true" className={`mt-[3px] h-3.5 w-3.5 rounded-full ${dot}`} /><span aria-hidden="true" className={`min-h-[22px] w-0.5 flex-1 ${state === 'done' ? 'bg-accent' : 'bg-slate-700'}`} /></span>
      <span className="flex flex-col pb-3"><span className={`text-[15px] font-bold ${state === 'todo' ? 'text-slate-400' : 'text-white'}`}>{title}</span><span className="text-[13px] text-slate-400">{sub}</span></span>
    </li>
  )
}

async function copy(text: string, what: string) {
  try { await navigator.clipboard.writeText(text); toast.success(`${what} copied`, { description: text }) } catch { toast.error('Could not copy', { description: 'Select it and copy by hand.' }) }
}

function Detail({ label, value, copyable }: { label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 py-2.5 first:border-0">
      <span className="flex flex-col"><span className="text-xs font-semibold text-muted">{label}</span><b className="text-[15px]">{value}</b></span>
      {copyable && <button type="button" aria-label={`Copy ${label}`} onClick={() => void copy(value, label)} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-slate-600 hover:bg-slate-50"><Copy aria-hidden="true" size={16} /></button>}
    </div>
  )
}

/** Float request, Path B (A03b): pay into the escrow account yourself, then send the slip for a staff member to check. */
export function AgentRequestFloat({ prefillAmount, openRequest, onSent }: { prefillAmount?: string; openRequest?: FloatRequestRow; onSent: () => void }) {
  const escrow = useApi<EscrowDetails>((signal) => api('/agent/float/escrow-details', { signal }), [])
  const [amount, setAmount] = useState(prefillAmount ?? '')
  const [slipNo, setSlipNo] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const attemptKey = useRef(newIdempotencyKey())
  const picker = useRef<HTMLInputElement>(null)

  const clean = normalizeAmount(amount)
  const amountOk = clean !== '' && Number(clean) > 0
  const valid = amountOk && slipNo.trim().length >= 3 && Boolean(file) && !openRequest

  function pick(f: File | undefined) {
    setError(null)
    if (!f) return
    if (!/^(image\/(jpeg|png)|application\/pdf)$/.test(f.type)) { setError('The slip must be a JPG or PNG photo, or a PDF.'); return }
    if (f.size > MAX_BYTES) { setError('The slip file is too large. The most is 5 MB.'); return }
    setFile(f)
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!valid || busy || !file) return
    setBusy(true); setError(null)
    try {
      const form = new FormData()
      form.set('amount', clean); form.set('depositReference', slipNo.trim()); form.set('slip', file)
      await api('/agent/float/requests', { method: 'POST', idempotencyKey: attemptKey.current, body: form })
      toast.success('Float request sent', { description: 'A staff member will check the escrow statement. We email you when it is decided.' })
      attemptKey.current = newIdempotencyKey()
      setAmount(''); setSlipNo(''); setFile(null)
      onSent()
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Could not send the request.'
      setError(msg); toast.error('Request not sent', { description: msg })
    } finally { setBusy(false) }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
      <div className="flex flex-col gap-5">
        <section aria-label="Step 1: pay into the escrow account" className="flex flex-col gap-2 rounded-[22px] border border-line bg-white p-6">
          <h2 className="text-lg font-extrabold"><span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm text-white">1</span>Pay into the escrow account</h2>
          <p className="text-sm text-slate-600">Deposit at the bank or send from any bank. Write your agent ID as the reference so we can find it.</p>
          {escrow.data ? <div className="mt-1">
            <Detail label="Bank" value={escrow.data.bankName} />
            <Detail label="Account name" value={escrow.data.accountName} copyable />
            <Detail label="Account number" value={escrow.data.accountNumber} copyable />
            <Detail label="Reference" value={escrow.data.reference} copyable />
          </div> : <p className="py-3 text-sm text-muted">Loading the account details…</p>}
        </section>

        <form onSubmit={submit} className="flex flex-col gap-[18px] rounded-[22px] border border-line bg-white p-6">
          <h2 className="text-lg font-extrabold"><span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm text-white">2</span>Send us the slip</h2>
          {openRequest && <p role="status" className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">You already have a request waiting. You can send another once it is checked.</p>}
          <div className="flex flex-col gap-1.5"><label htmlFor="rf-amt" className="text-sm font-semibold">Amount you deposited (TZS)</label>
            <input id="rf-amt" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="500,000" className={`${FIELD} h-14 text-2xl font-extrabold`} /></div>
          <div className="flex flex-col gap-1.5"><label htmlFor="rf-slip" className="text-sm font-semibold">Slip number</label>
            <input id="rf-slip" value={slipNo} onChange={(e) => setSlipNo(e.target.value)} maxLength={60} className={`${FIELD} h-[52px] font-semibold`} />
            <span className="text-[13px] text-slate-600">The number printed on your bank slip. Each slip can be used once.</span></div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold" id="rf-file-label">Photo of the slip</span>
            <input ref={picker} id="rf-file" type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" aria-labelledby="rf-file-label" onChange={(e) => pick(e.target.files?.[0])} />
            {file ? (
              <div className="flex items-center gap-3 rounded-[14px] border border-line px-4 py-3"><FileImage aria-hidden="true" size={20} className="text-brand" />
                <span className="flex min-w-0 flex-1 flex-col"><b className="truncate text-sm">{file.name}</b><span className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB</span></span>
                <button type="button" aria-label="Remove the slip photo" onClick={() => { setFile(null); if (picker.current) picker.current.value = '' }} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-slate-100"><X aria-hidden="true" size={16} /></button></div>
            ) : (
              <button type="button" onClick={() => picker.current?.click()} className="flex h-24 w-full flex-col items-center justify-center gap-1 rounded-[14px] border-2 border-dashed border-slate-300 text-sm font-semibold text-slate-600 hover:border-brand hover:bg-blue-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
                <Upload aria-hidden="true" size={20} />Choose a JPG, PNG or PDF (up to 5 MB)</button>
            )}
          </div>
          {error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
          <Button type="submit" loading={busy} disabled={!valid} block className="h-14 rounded-[14px] text-[17px]">Send float request</Button>
        </form>
      </div>

      <aside className="flex flex-col gap-4">
        {openRequest ? (
          <section aria-label="Open request" className="flex flex-col gap-4 rounded-3xl bg-ink p-6 text-white">
            <div className="flex items-center justify-between"><span className="font-mono text-[13px] text-slate-400">{openRequest.requestRef}</span>
              <span className="rounded-full bg-[#1E3A8A] px-2.5 py-1 text-xs font-bold text-blue-100">Waiting</span></div>
            <span className="text-[32px] font-extrabold tracking-tight">{formatTzs(openRequest.amount)}</span>
            <ol className="m-0 flex list-none flex-col p-0">
              <Step title="Sent" sub={`${formatDateTime(openRequest.createdAt)} · slip ${openRequest.externalReference ?? ''}`} state="done" />
              <Step title="Staff check the escrow statement" sub="One WalletPesa staff member matches your deposit" state="now" />
              <Step title="Float added" sub="You get an email when it is decided" state="todo" />
            </ol>
          </section>
        ) : (
          <section aria-label="How it works" className="rounded-[22px] border border-line bg-white p-6 text-sm text-slate-600">
            <h2 className="mb-2 text-lg font-extrabold text-ink">How it works</h2>
            <ol className="ml-4 list-decimal space-y-1.5"><li>Pay into the escrow account with your agent ID as the reference.</li><li>Send the slip number and a photo of the slip.</li><li>A staff member checks the escrow statement and adds your float.</li></ol>
            <p className="mt-3">Want it instantly? Use <b>From bank</b> and top up straight from your linked business bank.</p>
          </section>
        )}
      </aside>
    </div>
  )
}
