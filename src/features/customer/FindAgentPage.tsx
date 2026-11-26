import { Copy, MapPin, Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { Button, EmptyState, ErrorState, LoadingState } from '../../shared/ui/controls'
import { toast } from '../../shared/ui/toast'
import { groupTill, type NearbyAgent } from './types'

interface Region { id: string; name: string }

/** Find an agent (W30): region filter and search. "Withdraw here" fills the till on the withdraw page. */
export default function FindAgentPage() {
  const navigate = useNavigate()
  const [region, setRegion] = useState('')
  const [q, setQ] = useState('')
  const regions = useApi<Region[]>((signal) => api('/locations/regions', { signal }), [])
  const agents = useApi<NearbyAgent[]>((signal) => api('/agents/nearby', { query: { region, q: q.trim() }, signal }), [region, q])

  async function copy(till: string) {
    try { await navigator.clipboard.writeText(till); toast.success('Till copied', { description: groupTill(till) }) } catch { toast.error('Could not copy', { description: 'Select the number and copy it by hand.' }) }
  }

  return (
    <div className="flex flex-col gap-5">
      <div><h1 className="text-[26px] font-extrabold tracking-tight">Find an agent</h1><p className="text-sm text-muted">Pick an agent, then withdraw with their till number.</p></div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><span className="sr-only">Search agents</span>
          <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, till or area" className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-base focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200" /></label>
        <label className="sm:w-56"><span className="sr-only">Region</span>
          <select value={region} onChange={(e) => setRegion(e.target.value)} className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-base font-semibold focus-visible:border-brand focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
            <option value="">All regions</option>{regions.data?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
      </div>

      {agents.loading && !agents.data ? <LoadingState label="Finding agents…" /> : agents.error && !agents.data ? <ErrorState error={agents.error} onRetry={agents.reload} />
        : (agents.data?.length ?? 0) === 0 ? <EmptyState title="No agents match" description="Try another region or clear the search." /> : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {agents.data!.map((a) => (
              <li key={a.tillNumber} className="flex flex-col gap-3 rounded-[22px] border border-line bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><b className="block truncate text-lg">{a.name}</b><span className="flex items-center gap-1 text-sm text-slate-600"><MapPin aria-hidden="true" size={14} /> {a.district}, {a.region}</span></div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${a.open ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{a.open ? 'Open' : 'Closed'}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-2.5"><span className="text-sm text-muted">Till number</span><b className="text-lg tracking-wide tabular-nums">{groupTill(a.tillNumber)}</b></div>
                <div className="flex gap-2.5">
                  <Button block onClick={() => navigate(`/app/withdraw?till=${a.tillNumber}`)}>Withdraw here</Button>
                  <Button variant="secondary" aria-label={`Copy till ${groupTill(a.tillNumber)}`} onClick={() => void copy(a.tillNumber)}><Copy aria-hidden="true" size={16} /> Copy till</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
    </div>
  )
}
