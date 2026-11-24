import { Banknote, Store, UserCheck, UserX } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { ApiError, api } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { useSession } from '../../../shared/auth/context'
import { formatTzs } from '../../../shared/lib/money'
import { maskPhone, toE164Tz } from '../../../shared/lib/phone'
import { Button, EmptyState, ErrorState, Field, LoadingState } from '../../../shared/ui/controls'
import { Avatar, BalanceBlock, FilterBar, KpiRow, PageHeader, PersonCell, SearchField, SelectField, TableCard } from '../../../shared/ui/console'
import { rowProps } from '../../../shared/ui/rowProps'
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
  const [region, setRegion] = useState('')
  const [search, setSearch] = useState('')
  const [panel, setPanel] = useState<Panel>(null)
  const state = useApi<AgentList>((signal) => api('/agents', { query: { status: status || undefined, size: 100 }, signal }), [status])

  const regions = useMemo(() => [...new Set((state.data?.agents ?? []).map((a) => a.regionName).filter((r): r is string => Boolean(r)))].sort(), [state.data])
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (state.data?.agents ?? []).filter((a) =>
      (!region || a.regionName === region)
      && (!q || [`${a.firstName} ${a.lastName}`, a.agentNumber, a.phone].some((v) => v?.toLowerCase().includes(q))))
  }, [state.data, search, region])

  const s = state.data?.summary
  const canUpdate = has('USER_UPDATE')
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Agents" subtitle="Staff onboard agents. Float and commission are live ledger balances."
        action={has('USER_CREATE') ? <Button onClick={() => setPanel({ kind: 'onboard' })}>Onboard agent</Button> : undefined} />

      {s && <KpiRow items={[
        { label: 'Total agents', value: String(s.totalAgents), icon: Store },
        { label: 'Active', value: String(s.activeAgents), icon: UserCheck },
        { label: 'Suspended', value: String(s.suspendedAgents), icon: UserX },
        { label: 'Total float', value: formatTzs(s.totalAgentFloatBalance, { symbol: false }), unit: 'TZS', icon: Banknote },
      ]} />}

      <FilterBar label="Filter agents" active={Boolean(search || status || region)} onClear={() => { setSearch(''); setStatus(''); setRegion('') }}>
        <SearchField id="f-q" value={search} onChange={setSearch} placeholder="Search by agent ID, name or phone" />
        <SelectField id="f-status" label="Status" value={status} onChange={setStatus} options={[['', 'All statuses'], ['ACTIVE', 'Active'], ['SUSPENDED', 'Suspended'], ['DEACTIVATED', 'Deactivated']]} />
        <SelectField id="f-region" label="Region" value={region} onChange={setRegion} options={[['', 'All regions'], ...regions.map((r): [string, string] => [r, r])]} />
      </FilterBar>

      <TableCard title="All agents" countText={state.data ? `${rows.length} of ${s?.totalAgents ?? rows.length} agents` : undefined}>
        {state.loading && !state.data ? <LoadingState /> : state.error && !state.data ? <ErrorState error={state.error} onRetry={state.reload} /> : rows.length === 0 ? (
          <EmptyState title="Nobody matches these filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead><tr className="text-xs text-muted"><th className="px-5 py-2 font-semibold">#</th><th className="font-semibold">Agent ID</th><th className="font-semibold">Agent</th><th className="font-semibold">Region</th><th className="font-semibold">Phone</th><th className="text-right font-semibold">Float (TZS)</th><th className="px-5 font-semibold">Status</th></tr></thead>
              <tbody>
                {rows.map((a, i) => (
                  <tr key={a.agentId} {...rowProps(() => setPanel({ kind: 'status', agent: a }), `Open ${a.firstName} ${a.lastName}`)}>
                    <td className="px-5 py-3 text-muted">{i + 1}</td>
                    <td className="font-mono text-xs">{a.agentNumber}</td>
                    <td><PersonCell name={`${a.firstName} ${a.lastName}`} sub={a.districtName} /></td>
                    <td>{a.regionName ?? '—'}</td>
                    <td className="tabular-nums">{maskPhone(a.phone)}</td>
                    <td className="text-right font-bold tabular-nums">{formatTzs(a.floatAccount?.balance, { symbol: false })}</td>
                    <td className="px-5"><StatusBadge status={a.status} label={a.status.charAt(0) + a.status.slice(1).toLowerCase()} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {panel?.kind === 'onboard' && <OnboardPanel onClose={() => setPanel(null)} onDone={() => { setPanel(null); state.reload() }} />}
      {panel?.kind === 'status' && <StatusPanel agent={panel.agent} canUpdate={canUpdate} onClose={() => setPanel(null)} onDone={() => { setPanel(null); state.reload() }} />}
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

function StatusPanel({ agent, canUpdate, onClose, onDone }: { agent: AgentRow; canUpdate: boolean; onClose: () => void; onDone: () => void }) {
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
      footer={canUpdate ? <div className="flex flex-col gap-3">{error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
        <Button block variant={next === 'ACTIVE' ? 'primary' : 'danger'} loading={busy} disabled={reason.trim().length < 3 || next === agent.status} onClick={() => void submit()}>
          {next === 'ACTIVE' ? 'Reactivate agent' : next === 'SUSPENDED' ? 'Suspend agent' : 'Deactivate agent'}</Button></div> : undefined}>
      <div className="mb-4 flex items-center gap-3"><Avatar name={`${agent.firstName} ${agent.lastName}`} size={48} /><StatusBadge status={agent.status} /></div>
      <BalanceBlock label="Float balance" value={formatTzs(agent.floatAccount?.balance)} note={agent.floatAccount ? `Account •••• ${agent.floatAccount.accountNumber.slice(-4)}` : undefined} />
      <DetailRow label="Phone">{maskPhone(agent.phone)}</DetailRow>
      <DetailRow label="Location">{[agent.districtName, agent.regionName].filter(Boolean).join(', ') || '—'}</DetailRow>
      <DetailRow label="Float account">{agent.floatAccount?.accountNumber ?? '—'}</DetailRow>
      <DetailRow label="Float balance">{formatTzs(agent.floatAccount?.balance)}</DetailRow>
      <DetailRow label="Commission balance">{formatTzs(agent.commissionAccount?.balance)}</DetailRow>
      {canUpdate && <div className="mt-5 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">Change status to
          <select value={next} onChange={(e) => setNext(e.target.value as typeof next)} className="h-12 rounded-xl border border-slate-300 px-3 text-base font-semibold">
            <option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="DEACTIVATED">Deactivated</option></select></label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">Reason (required)
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={255} className="rounded-xl border border-slate-300 p-3 text-sm font-normal" /></label>
        <p className="text-xs text-muted">The reason is required here. It is stored with the audit log once that feature ships; the status API does not accept it yet.</p>
      </div>}
    </SidePanel>
  )
}
