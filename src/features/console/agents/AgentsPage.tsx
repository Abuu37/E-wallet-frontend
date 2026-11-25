import { Banknote, Store, UserCheck, UserX } from 'lucide-react'
import { useFormik } from 'formik'
import { useMemo, useState } from 'react'
import { ApiError, api } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { useSession } from '../../../shared/auth/context'
import { formatDate } from '../../../shared/lib/dates'
import { downloadCsv } from '../../../shared/lib/csv'
import { formatTzs } from '../../../shared/lib/money'
import { maskEmail, maskPhone, toE164Tz } from '../../../shared/lib/phone'
import { Button, EmptyState, ErrorState, Field, LoadingState } from '../../../shared/ui/controls'
import { Avatar, BalanceBlock, DateField, ExportButton, FilterBar, KpiRow, PageHeader, PersonCell, SearchField, SelectField, TableCard } from '../../../shared/ui/console'
import { rowProps } from '../../../shared/ui/rowProps'
import { Modal } from '../../../shared/ui/Modal'
import { DetailRow, SidePanel, StatusBadge } from '../../../shared/ui/SidePanel'
import { reportError, toast } from '../../../shared/ui/toast'
import { formatTin, makeAgentUsername, onboardAgentSchema, type OnboardAgentValues } from './onboardSchema'

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
  createdAt: string
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
  const [date, setDate] = useState('')
  const [search, setSearch] = useState('')
  const [panel, setPanel] = useState<Panel>(null)
  const state = useApi<AgentList>((signal) => api('/agents', { query: { status: status || undefined, size: 100 }, signal }), [status])

  const regions = useMemo(() => [...new Set((state.data?.agents ?? []).map((a) => a.regionName).filter((r): r is string => Boolean(r)))].sort(), [state.data])
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (state.data?.agents ?? []).filter((a) =>
      (!region || a.regionName === region) && (!date || a.createdAt?.slice(0, 10) === date)
      && (!q || [`${a.firstName} ${a.lastName}`, a.agentNumber, a.phone].some((v) => v?.toLowerCase().includes(q))))
  }, [state.data, search, region, date])

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

      <FilterBar label="Filter agents" active={Boolean(search || status || region || date)} onClear={() => { setSearch(''); setStatus(''); setRegion(''); setDate('') }}>
        <SearchField id="f-q" value={search} onChange={setSearch} placeholder="Search by agent ID, name or phone" />
        <SelectField id="f-status" label="Status" value={status} onChange={setStatus} options={[['', 'All statuses'], ['ACTIVE', 'Active'], ['SUSPENDED', 'Suspended'], ['DEACTIVATED', 'Deactivated']]} />
        <SelectField id="f-region" label="Region" value={region} onChange={setRegion} options={[['', 'All regions'], ...regions.map((r): [string, string] => [r, r])]} />
        <DateField id="f-date" value={date} onChange={setDate} />
      </FilterBar>

      <TableCard title="All agents" countText={state.data ? `${rows.length} of ${s?.totalAgents ?? rows.length} agents` : undefined} action={<ExportButton disabled={rows.length === 0} onClick={() => exportCsv(rows)} />}>
        {state.loading && !state.data ? <LoadingState /> : state.error && !state.data ? <ErrorState error={state.error} onRetry={state.reload} /> : rows.length === 0 ? (
          <EmptyState title="Nobody matches these filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead><tr className="text-xs text-muted"><th className="px-5 py-2 font-semibold">#</th><th className="font-semibold">Agent ID</th><th className="font-semibold">Agent</th><th className="font-semibold">Region</th><th className="font-semibold">Phone</th><th className="text-right font-semibold">Float (TZS)</th><th className="font-semibold">Status</th><th className="px-5 font-semibold">Joined</th></tr></thead>
              <tbody>
                {rows.map((a, i) => (
                  <tr key={a.agentId} {...rowProps(() => setPanel({ kind: 'status', agent: a }), `Open ${a.firstName} ${a.lastName}`)}>
                    <td className="px-5 py-3 text-muted">{i + 1}</td>
                    <td className="font-mono text-xs">{a.agentNumber}</td>
                    <td><PersonCell name={`${a.firstName} ${a.lastName}`} sub={a.districtName} /></td>
                    <td>{a.regionName ?? '—'}</td>
                    <td className="tabular-nums">{maskPhone(a.phone)}</td>
                    <td className="text-right font-bold tabular-nums">{formatTzs(a.floatAccount?.balance, { symbol: false })}</td>
                    <td><StatusBadge status={a.status} label={a.status.charAt(0) + a.status.slice(1).toLowerCase()} /></td>
                    <td className="px-5 text-xs">{formatDate(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {panel?.kind === 'onboard' && <OnboardDialog onClose={() => setPanel(null)} onDone={() => { setPanel(null); state.reload() }} />}
      {panel?.kind === 'status' && <StatusPanel agent={panel.agent} canUpdate={canUpdate} onClose={() => setPanel(null)} onDone={() => { setPanel(null); state.reload() }} />}
    </div>
  )
}

const INITIAL: OnboardAgentValues = { businessName: '', tinNumber: '', firstName: '', middleName: '', lastName: '', gender: '', dateOfBirth: '', phone: '', email: '', regionId: '', districtId: '' }
const SELECT = 'h-12 rounded-xl border bg-white px-3 text-base font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:bg-slate-100'

function SectionTitle({ children }: { children: string }) {
  return <h3 className="col-span-2 mb-0.5 mt-3 text-xs font-bold uppercase tracking-wider text-muted first:mt-0">{children}</h3>
}

function OnboardDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const f = useFormik<OnboardAgentValues>({
    initialValues: INITIAL,
    validationSchema: onboardAgentSchema,
    onSubmit: async (values, { setErrors }) => {
      const v = onboardAgentSchema.cast(values)
      try {
        let attempt = 0
        for (;;) {
          try {
            await api('/agents/onboard', {
              method: 'POST',
              body: {
                username: makeAgentUsername(v.businessName), businessName: v.businessName, tinNumber: formatTin(v.tinNumber),
                firstName: v.firstName, middleName: v.middleName || undefined, lastName: v.lastName, gender: v.gender,
                dateOfBirth: v.dateOfBirth, phone: toE164Tz(v.phone), email: v.email.toLowerCase(), regionId: v.regionId, districtId: v.districtId,
              },
            })
            break
          } catch (err) {
            // The generated login name collided with someone else's: try another one.
            if (err instanceof ApiError && err.status === 409 && /username/i.test(err.message) && attempt++ < 3) continue
            throw err
          }
        }
        toast.success('Agent onboarded', { description: `${v.businessName} is active. A one-time PIN was emailed to ${maskEmail(v.email)}.` })
        onDone()
      } catch (err) {
        if (err instanceof ApiError) {
          // Duplicates come back as a message; put them under the field they belong to.
          const fields: Record<string, string> = { ...err.fieldErrors }
          if (!Object.keys(fields).length && err.status === 409) {
            if (/phone/i.test(err.message)) fields.phone = 'This phone already belongs to another user'
            else if (/email/i.test(err.message)) fields.email = 'Email already exists'
          }
          if (Object.keys(fields).length) {
            setErrors(fields)
            toast.error('Please check the highlighted fields', { description: Object.values(fields)[0] })
            return
          }
        }
        reportError(err, 'Could not onboard the agent', 'Could not onboard the agent.')
      }
    },
  })

  const regions = useApi<Region[]>((signal) => api('/locations/regions', { signal }), [])
  const districts = useApi<District[]>((signal) => f.values.regionId ? api('/locations/districts', { query: { regionId: f.values.regionId }, signal }) : Promise.resolve([]), [f.values.regionId])

  // Errors show once a submit was attempted, like the other forms.
  const err = (k: keyof OnboardAgentValues) => (f.submitCount > 0 ? f.errors[k] : undefined)
  const bad = f.submitCount > 0 ? Object.keys(f.errors).length : 0
  const text = (k: keyof OnboardAgentValues) => ({ id: `ob-${k}`, name: k, value: f.values[k], onChange: f.handleChange, error: err(k) })

  return (
    <Modal open title="Onboard agent" onClose={onClose}
      subtitle="The agent is active as soon as you save. A one-time PIN is emailed to the owner."
      footer={<>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" form="onboard-form" loading={f.isSubmitting}>Onboard agent and send PIN</Button>
      </>}>
      <form id="onboard-form" onSubmit={f.handleSubmit} noValidate className="grid grid-cols-2 gap-x-4 gap-y-3.5">
        <SectionTitle>Business</SectionTitle>
        <Field label="Business name" placeholder="e.g. Tegeta Mobile Point" {...text('businessName')} />
        <Field label="TIN" inputMode="numeric" placeholder="123-456-789" {...text('tinNumber')} />

        <SectionTitle>Owner</SectionTitle>
        <Field label="First name" autoComplete="off" {...text('firstName')} />
        <Field label="Middle name (optional)" autoComplete="off" {...text('middleName')} />
        <Field label="Last name" autoComplete="off" {...text('lastName')} />
        <label className="flex flex-col gap-1.5 text-sm font-semibold">Gender
          <select name="gender" value={f.values.gender} onChange={f.handleChange} aria-invalid={err('gender') ? true : undefined} className={`${SELECT} ${err('gender') ? 'border-[#E11D48]' : 'border-slate-300'}`}>
            <option value="">Choose</option><option value="FEMALE">Female</option><option value="MALE">Male</option></select>
          {err('gender') && <span role="alert" className="text-xs font-medium text-[#BE123C]">{err('gender')}</span>}</label>
        <Field label="Date of birth" type="date" {...text('dateOfBirth')} />
        <Field label="Phone" type="tel" inputMode="tel" placeholder="0713 880 412" {...text('phone')} />
        <div className="col-span-2"><Field label="Email" type="email" inputMode="email" placeholder="owner@example.com" {...text('email')} /></div>

        <SectionTitle>Location</SectionTitle>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">Region
          <select name="regionId" value={f.values.regionId} onChange={(e) => { void f.setValues({ ...f.values, regionId: e.target.value, districtId: '' }) }}
            aria-invalid={err('regionId') ? true : undefined} className={`${SELECT} ${err('regionId') ? 'border-[#E11D48]' : 'border-slate-300'}`}>
            <option value="">{regions.loading ? 'Loading…' : 'Choose region'}</option>{regions.data?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
          {err('regionId') && <span role="alert" className="text-xs font-medium text-[#BE123C]">{err('regionId')}</span>}</label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">District
          <select name="districtId" value={f.values.districtId} onChange={f.handleChange} disabled={!f.values.regionId}
            aria-invalid={err('districtId') ? true : undefined} className={`${SELECT} ${err('districtId') ? 'border-[#E11D48]' : 'border-slate-300'}`}>
            <option value="">{!f.values.regionId ? 'Choose a region first' : districts.loading ? 'Loading…' : 'Choose district'}</option>{districts.data?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          {err('districtId') && <span role="alert" className="text-xs font-medium text-[#BE123C]">{err('districtId')}</span>}</label>

        <div className="col-span-2 mt-1 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-3 text-[13px] leading-normal text-blue-900">
          The agent gets an agent number, a float wallet at 0 TZS and a commission wallet. They can serve customers after their first float top-up. Saving is written to the audit log.
        </div>
        <p role="alert" className="col-span-2 min-h-[20px] text-[13px] font-semibold text-[#DC2626]">{bad ? `Fix the ${bad} highlighted field${bad > 1 ? 's' : ''}.` : ''}</p>
      </form>
    </Modal>
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
      await api(`/agents/${agent.agentId}/status`, { method: 'PATCH', body: { status: next, reason: reason.trim() } })
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
        <p className="text-xs text-muted">The reason is required and is recorded in the audit log with your name.</p>
      </div>}
    </SidePanel>
  )
}

function exportCsv(rows: AgentRow[]) {
  downloadCsv('agents.csv',
    ['Agent ID', 'Agent', 'District', 'Region', 'Phone', 'Float (TZS)', 'Commission (TZS)', 'Status', 'Joined'],
    rows.map((a) => [a.agentNumber, `${a.firstName} ${a.lastName}`, a.districtName, a.regionName, maskPhone(a.phone),
      formatTzs(a.floatAccount?.balance, { symbol: false }), formatTzs(a.commissionAccount?.balance, { symbol: false }), a.status, formatDate(a.createdAt)]))
}
