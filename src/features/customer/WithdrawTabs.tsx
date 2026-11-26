import { Landmark } from 'lucide-react'

export type WithdrawMode = 'agent' | 'bank'

/** The two ways to withdraw: cash at an agent, or to your own bank. */
export function WithdrawTabs({ mode, onChange }: { mode: WithdrawMode; onChange: (mode: WithdrawMode) => void }) {
  const tab = (id: WithdrawMode, label: React.ReactNode) => (
    <button type="button" role="tab" aria-selected={mode === id} onClick={() => onChange(id)}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${mode === id ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-ink'}`}>{label}</button>
  )
  return (
    <div role="tablist" aria-label="How to withdraw" className="flex gap-1 rounded-full bg-slate-100 p-1">
      {tab('agent', 'Cash at an agent')}
      {tab('bank', <><Landmark aria-hidden="true" size={15} /> To my bank</>)}
    </div>
  )
}
