import { Check, Landmark, ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { bankName, type LinkedBank } from './bankTypes'

/** The name check line under a bank: a match, the Sandbox skip, or a refusal. */
export function NameCheck({ check }: { check: LinkedBank['nameCheck'] }) {
  if (check === 'MATCHED') return <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-green-700"><Check aria-hidden="true" size={14} strokeWidth={3} /> Name matches your ID</span>
  if (check === 'SKIPPED_SANDBOX') return <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-amber-700">Demo: name check skipped in Sandbox</span>
  return <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#DC2626]"><ShieldAlert aria-hidden="true" size={14} /> The name on this account does not match yours</span>
}

/** One linked bank as a selectable card. */
export function BankCard({ bank, selected, onSelect, right }: { bank: LinkedBank; selected?: boolean; onSelect?: () => void; right?: ReactNode }) {
  const body = (
    <>
      <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-dark"><Landmark size={20} /></span>
      <span className="flex min-w-0 flex-1 flex-col"><b className="truncate text-[15px]">{bankName(bank)}</b>
        <span className="truncate text-[13px] text-slate-600">{bank.accountName ?? 'Account'}</span><NameCheck check={bank.nameCheck} /></span>
      {right}
    </>
  )
  const cls = `flex w-full items-center gap-3.5 rounded-2xl border p-3.5 text-left ${selected ? 'border-brand bg-blue-50/50 ring-2 ring-blue-200' : 'border-line bg-white'}`
  return onSelect
    ? <button type="button" role="radio" aria-checked={Boolean(selected)} onClick={onSelect} disabled={!bank.usable} className={`${cls} ${bank.usable ? 'hover:border-brand' : 'opacity-60'} focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200`}>{body}</button>
    : <div className={cls}>{body}</div>
}
