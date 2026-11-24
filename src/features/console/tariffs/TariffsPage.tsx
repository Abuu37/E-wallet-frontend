import { Check, TriangleAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { amountOf, formatTzs, normalizeAmount, subtractAmounts } from '../../../shared/lib/money'
import { Button, EmptyState, ErrorState, LoadingState } from '../../../shared/ui/controls'
import { PageHeader } from '../../../shared/ui/console'

interface Band {
  id: string
  transactionType: string
  minAmount: number | string
  maxAmount: number | string
  fee: number | string
  agentCommission: number | string
  active: boolean
}

const TYPE_LABEL: Record<string, string> = { CASH_IN: 'Cash-in', CASH_OUT: 'Cash-out', TRANSFER: 'Send money', BANK_TOP_UP: 'Bank top-up', BANK_TOPUP: 'Bank top-up' }
const label = (t: string) => TYPE_LABEL[t] ?? t.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
const PRESETS = ['5000', '40000', '250000']

/** Hundredths of a shilling as a BigInt, so band edges are compared exactly. */
function cents(value: number | string): bigint {
  const [w, f] = normalizeAmount(amountOf(value)).replace('-', '').split('.')
  return BigInt(w + f)
}

/** Live bands of one type must start where the previous one ended, with no gap and no overlap. */
function coverage(bands: Band[]): { ok: boolean; text: string } {
  const live = bands.filter((b) => b.active).sort((a, b) => (cents(a.minAmount) < cents(b.minAmount) ? -1 : 1))
  if (live.length === 0) return { ok: false, text: 'No live band: customers cannot use this service' }
  for (let i = 1; i < live.length; i++) {
    const prevEnd = cents(live[i - 1].maxAmount)
    const start = cents(live[i].minAmount)
    if (start <= prevEnd) return { ok: false, text: `Bands overlap near ${formatTzs(live[i].minAmount, { symbol: false })}` }
    if (start > prevEnd + 100n) return { ok: false, text: `Gap between ${formatTzs(live[i - 1].maxAmount, { symbol: false })} and ${formatTzs(live[i].minAmount, { symbol: false })}` }
  }
  return { ok: true, text: `Bands cover ${formatTzs(live[0].minAmount, { symbol: false })} – ${formatTzs(live[live.length - 1].maxAmount, { symbol: false })} with no gaps or overlaps` }
}

export default function TariffsPage() {
  const state = useApi<Band[]>((signal) => api('/tariffs', { signal }), [])
  const [selected, setSelected] = useState<string | null>(null)
  const [preview, setPreview] = useState('40000')

  const bands = useMemo(() => state.data ?? [], [state.data])
  const types = useMemo(() => [...new Set(bands.map((b) => b.transactionType))], [bands])
  const type = selected && types.includes(selected) ? selected : types[0]
  const ofType = useMemo(() => bands.filter((b) => b.transactionType === type).sort((a, b) => (cents(a.minAmount) < cents(b.minAmount) ? -1 : 1)), [bands, type])

  if (state.loading && !state.data) return <LoadingState />
  if (state.error && !state.data) return <ErrorState error={state.error} onRetry={state.reload} />

  const check = coverage(ofType)
  const amount = normalizeAmount(preview)
  const hit = amount ? ofType.find((b) => b.active && cents(b.minAmount) <= cents(amount) && cents(amount) <= cents(b.maxAmount)) : undefined

  return (
    <div className="flex flex-col gap-5 tabular-nums">
      <PageHeader title="Tariffs" subtitle="Fees customers pay and commission agents earn, by amount band"
        action={<Button disabled title="Changing a band needs a second approver and an effective date. That workflow is coming soon.">+ New band</Button>} />

      {types.length === 0 ? <EmptyState title="No tariff bands are configured" /> : (
        <>
          <div role="tablist" aria-label="Transaction type" className="flex flex-wrap gap-2">
            {types.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={t === type} onClick={() => setSelected(t)}
                className={`h-10 rounded-full px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${t === type ? 'bg-ink text-white' : 'border border-line bg-white text-ink hover:bg-slate-50'}`}>{label(t)}</button>
            ))}
          </div>

          <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <section aria-label="Bands" className="rounded-[20px] border border-line bg-white px-5 pb-4 pt-2">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-sm">
                  <thead><tr className="text-left text-slate-600"><th className="px-2 py-3 font-bold">From</th><th className="px-2 font-bold">To</th><th className="px-2 text-right font-bold">Customer fee</th><th className="px-2 text-right font-bold">Agent commission</th><th className="px-2 font-bold">Status</th></tr></thead>
                  <tbody>
                    {ofType.map((b) => (
                      <tr key={b.id} className="border-t border-slate-100">
                        <td className="px-2 py-3.5 font-bold">{formatTzs(b.minAmount, { symbol: false })}</td>
                        <td className="px-2 font-bold">{formatTzs(b.maxAmount, { symbol: false })}</td>
                        <td className="px-2 text-right font-extrabold">{formatTzs(b.fee, { symbol: false })}</td>
                        <td className="px-2 text-right font-extrabold text-teal-700">{formatTzs(b.agentCommission, { symbol: false })}</td>
                        <td className="px-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${b.active ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-700'}`}>{b.active ? 'Live' : 'Inactive'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div role="status" className={`mt-3.5 flex items-center gap-2.5 rounded-[14px] px-3.5 py-3 text-sm font-semibold ${check.ok ? 'bg-teal-50 text-teal-800' : 'bg-amber-50 text-amber-900'}`}>
                {check.ok ? <Check aria-hidden="true" size={18} /> : <TriangleAlert aria-hidden="true" size={18} />}{check.text}
              </div>
            </section>

            <aside className="flex flex-col gap-3.5 rounded-3xl bg-ink p-6 text-white">
              <h2 className="text-lg font-extrabold">Fee preview</h2>
              <label htmlFor="tf-amt" className="text-sm text-slate-300">Amount (TZS)</label>
              <input id="tf-amt" inputMode="decimal" value={preview} onChange={(e) => setPreview(e.target.value)}
                className="h-[52px] rounded-[14px] border border-slate-700 bg-[#111A2E] px-4 text-[22px] font-extrabold text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400" />
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button key={p} type="button" onClick={() => setPreview(p)} className="h-9 rounded-full border border-slate-700 px-3 text-[13px] font-bold hover:bg-[#111A2E] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-400">{formatTzs(p, { symbol: false })}</button>
                ))}
              </div>
              {amount === '' ? <p className="border-t border-slate-800 pt-3 text-sm text-slate-400">Enter an amount to see the fee.</p>
                : !hit ? <p role="status" className="border-t border-slate-800 pt-3 text-sm text-amber-300">No live band covers this amount.</p> : (
                  <>
                    <div className="flex justify-between border-t border-slate-800 py-3 text-base"><span className="text-slate-300">Customer pays</span><b>{formatTzs(hit.fee)}</b></div>
                    <div className="flex justify-between border-t border-slate-800 py-3 text-base"><span className="text-slate-300">Agent earns</span><b className="text-accent">{formatTzs(hit.agentCommission)}</b></div>
                    <div className="flex justify-between border-t border-slate-800 py-3 text-base"><span className="text-slate-300">WalletPesa keeps</span><b>{formatTzs(subtractAmounts(amountOf(hit.fee), amountOf(hit.agentCommission)))}</b></div>
                  </>
                )}
              <p className="text-[13px] leading-relaxed text-slate-400">Changes will need a second approver and an effective date. Customers see the new fee from that date on every confirm screen.</p>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}
