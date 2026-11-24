import { useMemo, useState, type FormEvent } from 'react'
import { ApiError, api } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { useSession } from '../../../shared/auth/context'
import { formatTzs } from '../../../shared/lib/money'
import { maskPhone } from '../../../shared/lib/phone'
import { toE164Tz } from '../../../shared/lib/phone'
import { Button, EmptyState, ErrorState, Field, LoadingState } from '../../../shared/ui/controls'
import { DetailRow, SidePanel, StatusBadge } from '../../../shared/ui/SidePanel'
import { toast } from '../../../shared/ui/toast'

interface AgentRow {
  agentId: string
  agentNumber: string
  firstName: string
  middleName: string | null
  lastName: string
  phone: string
  regionName: string | null
  districtName: string | null
  status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'
  floatAccount: { accountNumber: string; balance: number | string } | null
  commissionAccount: { accountNumber: string; balance: number | string } | null
}
interface AgentList {
  summary: { totalAgents: number; activeAgents: number; suspendedAgents: number; totalAgentFloatBalance: number | string }
  agents: AgentRow[]
  totalElements: number
}
interface Region { id: string; name: string }
interface District { id: string; name: string; regionId: string }

type Panel = { kind: 'onboard' } | { kind: 'status'; agent: AgentRow } | null

export default function AgentsPage() {
  const { has } = useSession()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [panel, setPanel] = useState<Panel>(null)
  const state = useApi<AgentList>((signal) => api('/agents', { query: { status: status || undefined, size: 100 }, signal }), [status])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (state.data?.agents ?? []).filter((a) => !q || [a.firstName, a.lastName, a.agentNumber, a.phone].some((v) => v?.toLowerCase().includes(q)))
  }, [state.data, search])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Agents</h1>
        {has('USER_CREATE') && <Button onClick={() => setPanel({ kind: 'onboard' })}>Onboard agent</Button>}
      </div>

      {state.data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[['Total agents', String(state.data.summary.totalAgents)], ['Active', String(state.data.summary.activeAgents)],
            ['Suspended', String(state.data.summary.suspendedAgents)], ['Total float', formatTzs(state.data.summary.totalAgentFloatBalance)]].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-line bg-white p-4"><span className="text-[13px] font-semibold text-muted">{k}</span><p className="truncate text-xl font-extrabold tabular-nums">{v}</p></div>
          ))}
        </div>
      )}

      <div role="search" aria-label="Filter agents" className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4">
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-semibold">Search
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, agent code, phone" className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-normal" /></label>
        <label className="flex flex-col gap-1 text-xs font-semibold">Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-2 text-sm font-normal">
            <option value="">All</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="DEACTIVATED">Deactivated</option></select></label>
      </div>

      <section aria-label="Agents" className="rounded-2xl border border-line bg-white">
        {state.loading && !state.data ? <LoadingState /> : state.error && !state.data ? <ErrorState error={state.error} onRetry={state.reload} /> : rows.length === 0 ? (
          <EmptyState title="No agents found" description="Onboard an agent to get started." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead><tr className="text-xs text-muted"><th className="p-3 font-semibold">Agent</th><th className="font-semibold">Phone</th><th className="font-semibold">Location</th><th className="text-right font-semibold">Float (TZS)</th><th className="pl-4 font-semibold">Status</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.agentId} className="border-t border-line hover:bg-surface">
                    <td className="p-3"><b className="block">{a.firstName} {a.lastName}</b><span className="text-xs text-muted">{a.agentNumber}</span></td>
                    <td className="tabular-nums">{maskPhone(a.phone)}</td>
                    <td>{[a.districtName, a.regionName].filter(Boolean).join(', ') || '—'}</td>
                    <td className="text-right font-bold tabular-nums">{formatTzs(a.floatAccount?.balance, { symbol: false })}</td>
                    <td className="pl-4"><StatusBadge status={a.status} /></td>
                    <td className="p-3 text-right">{has('USER_UPDATE') && <Button variant="secondary" className="h-9 px-4 text-sm" onClick={() => setPanel({ kind: 'status', agent: a })}>Manage</Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {panel?.kind === 'onboard' && <OnboardPanel onClose={() => setPanel(null)} onDone={() => { setPanel(null); state.reload() }} />}
      {panel?.kind === 'status' && <StatusPanel agent={panel.agent} onClose={() => setPanel(null)} onDone={() => { setPanel(null); state.reload() }} />}
    </div>
  )
}

function OnboardPanel({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [v, setV] = useState({ businessName: '', tinNumber: '', username: '', firstName: '', middleName: '', lastName: '', gender: '', dateOfBirth: '', phone: '', email: '', regionId: '', districtId: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value, ...(k === 'regionId' ? { districtId: '' } : {}) }))

  const regions = useApi<Region[]>((signal) => api('/locations/regions', { anonymous: true, signal }), [])
  const districts = useApi<District[]>((signal) => v.regionId ? api('/locations/districts', { anonymous: true, query: { regionId: v.regionId }, signal }) : Promise.resolve([]), [v.regionId])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErrors({}); setFormError(null)
    try {
      await api('/agents/onboard', { method: 'POST', body: { ...v, middleName: v.middleName || undefined, phone: toE164Tz(v.phone) } })
      toast.success('Agent onboarded', { description: 'A one-time PIN was sent to the agent.' })
      onDone()
    } catch (err) {
      if (err instanceof ApiError) { setErrors(err.fieldErrors); setFormError(err.message) } else setFormError('Could not onboard the agent.')
    } finally { setBusy(false) }
  }

  return (
    <SidePanel open title="Onboard agent" subtitle="Staff-led onboarding" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label="Business name" value={v.businessName} onChange={set('businessName')} error={errors.businessName} required />
        <Field label="TIN" value={v.tinNumber} onChange={set('tinNumber')} error={errors.tinNumber} inputMode="numeric" required />
        <Field label="Username" value={v.username} onChange={set('username')} error={errors.username} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" value={v.firstName} onChange={set('firstName')} error={errors.firstName} required />
          <Field label="Last name" value={v.lastName} onChange={set('lastName')} error={errors.lastName} required />
        </div>
        <Field label="Middle name (optional)" value={v.middleName} onChange={set('middleName')} error={errors.middleName} />
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">Gender
            <select value={v.gender} onChange={set('gender')} required className="h-12 rounded-xl border border-slate-300 px-3 text-base font-semibold">
              <option value="">Select</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select>
            {errors.gender && <span role="alert" className="text-xs text-[#BE123C]">{errors.gender}</span>}</label>
          <Field label="Date of birth" type="date" value={v.dateOfBirth} onChange={set('dateOfBirth')} error={errors.dateOfBirth} required />
        </div>
        <Field label="Phone" inputMode="tel" value={v.phone} onChange={set('phone')} error={errors.phone} hint="+255 is added automatically" required />
        <Field label="Email" type="email" value={v.email} onChange={set('email')} error={errors.email} required />
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">Region
            <select value={v.regionId} onChange={set('regionId')} required className="h-12 rounded-xl border border-slate-300 px-3 text-base font-semibold">
              <option value="">{regions.loading ? 'Loading…' : 'Select'}</option>{regions.data?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
            {errors.regionId && <span role="alert" className="text-xs text-[#BE123C]">{errors.regionId}</span>}</label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">District
            <select value={v.districtId} onChange={set('districtId')} required disabled={!v.regionId} className="h-12 rounded-xl border border-slate-300 px-3 text-base font-semibold disabled:bg-slate-100">
              <option value="">{districts.loading && v.regionId ? 'Loading…' : 'Select'}</option>{districts.data?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
            {errors.districtId && <span role="alert" className="text-xs text-[#BE123C]">{errors.districtId}</span>}</label>
        </div>
        {formError && <p role="alert" className="text-sm font-medium text-[#BE123C]">{formError}</p>}
        <Button type="submit" block loading={busy}>Onboard agent</Button>
        <p className="text-xs text-muted">The agent receives a one-time PIN and must change it at first sign-in.</p>
      </form>
    </SidePanel>
  )
}

function StatusPanel({ agent, onClose, onDone }: { agent: AgentRow; onClose: () => void; onDone: () => void }) {
  const [next, setNext] = useState<'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'>(agent.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true); setError(null)
    try {
      await api(`/agents/${agent.agentId}/status`, { method: 'PATCH', body: { status: next } })
      toast.success(`Agent ${next.toLowerCase()}`)
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change the status.')
    } finally { setBusy(false) }
  }

  return (
    <SidePanel open title={`${agent.firstName} ${agent.lastName}`} subtitle={agent.agentNumber} onClose={onClose}
      footer={<div className="flex flex-col gap-3">{error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
        <Button block variant={next === 'ACTIVE' ? 'primary' : 'danger'} loading={busy} disabled={reason.trim().length < 3 || next === agent.status} onClick={() => void submit()}>
          {next === 'ACTIVE' ? 'Reactivate agent' : next === 'SUSPENDED' ? 'Suspend agent' : 'Deactivate agent'}</Button></div>}>
      <div className="mb-4"><StatusBadge status={agent.status} /></div>
      <DetailRow label="Phone">{maskPhone(agent.phone)}</DetailRow>
      <DetailRow label="Location">{[agent.districtName, agent.regionName].filter(Boolean).join(', ') || '—'}</DetailRow>
      <DetailRow label="Float account">{agent.floatAccount?.accountNumber ?? '—'}</DetailRow>
      <DetailRow label="Float balance">{formatTzs(agent.floatAccount?.balance)}</DetailRow>
      <DetailRow label="Commission balance">{formatTzs(agent.commissionAccount?.balance)}</DetailRow>
      <div className="mt-5 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">Change status to
          <select value={next} onChange={(e) => setNext(e.target.value as typeof next)} className="h-12 rounded-xl border border-slate-300 px-3 text-base font-semibold">
            <option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="DEACTIVATED">Deactivated</option></select></label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">Reason (required)
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={255} className="rounded-xl border border-slate-300 p-3 text-sm font-normal" /></label>
        <p className="text-xs text-muted">The reason is required here. It is stored with the audit log once that feature ships; the status API does not accept it yet.</p>
      </div>
    </SidePanel>
  )
}
