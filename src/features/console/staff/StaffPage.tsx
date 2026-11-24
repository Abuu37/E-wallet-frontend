import { Ban, ShieldCheck, UserCog, UserX } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { ApiError, api } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { useSession } from '../../../shared/auth/context'
import { formatDateTime } from '../../../shared/lib/dates'
import { downloadCsv } from '../../../shared/lib/csv'
import { maskEmail, maskPhone, toE164Tz } from '../../../shared/lib/phone'
import { Button, EmptyState, ErrorState, Field, LoadingState } from '../../../shared/ui/controls'
import { ExportButton, FilterBar, KpiRow, PageHeader, PersonCell, SearchField, SelectField, TableCard } from '../../../shared/ui/console'
import { rowProps } from '../../../shared/ui/rowProps'
import { DetailRow, SidePanel, StatusBadge } from '../../../shared/ui/SidePanel'
import { toast } from '../../../shared/ui/toast'

interface StaffRow { staffId: string; staffNo: string; firstName: string; middleName: string | null; lastName: string; phoneNumber: string; jobTitle: string; status: string; roleName: string | null }
interface StaffDetail extends StaffRow { userId: string; email: string; createdAt: string; updatedAt: string }

type Panel = { kind: 'add' } | { kind: 'edit'; id: string } | null

export default function StaffPage() {
  const { has } = useSession()
  const [panel, setPanel] = useState<Panel>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const state = useApi<StaffRow[] | { staff?: StaffRow[] }>((signal) => api('/staff', { signal }), [])
  const all: StaffRow[] = useMemo(() => (Array.isArray(state.data) ? state.data : state.data?.staff ?? []), [state.data])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return all.filter((s) => (!status || s.status === status)
      && (!q || [`${s.firstName} ${s.lastName}`, s.staffNo, s.phoneNumber, s.jobTitle].some((v) => v?.toLowerCase().includes(q))))
  }, [all, search, status])
  const count = (st: string) => all.filter((s) => s.status === st).length

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Staff" subtitle="Back-office users. Each person has one role; permissions come from the role."
        action={has('USER_CREATE') ? <Button onClick={() => setPanel({ kind: 'add' })}>Add staff</Button> : undefined} />

      {state.data && <KpiRow items={[
        { label: 'Total staff', value: String(all.length), icon: UserCog },
        { label: 'Active', value: String(count('ACTIVE')), icon: ShieldCheck },
        { label: 'Suspended', value: String(count('SUSPENDED')), icon: Ban },
        { label: 'Disabled', value: String(count('DISABLED')), icon: UserX },
      ]} />}

      <FilterBar label="Filter staff" active={Boolean(search || status)} onClear={() => { setSearch(''); setStatus('') }}>
        <SearchField id="kf-q" value={search} onChange={setSearch} placeholder="Search by name, staff number or phone" />
        <SelectField id="kf-status" label="Status" value={status} onChange={setStatus} options={[['', 'All statuses'], ['ACTIVE', 'Active'], ['SUSPENDED', 'Suspended'], ['DISABLED', 'Disabled']]} />
      </FilterBar>

      <TableCard title="All staff" countText={state.data ? `${rows.length} of ${all.length} staff` : undefined} action={<ExportButton disabled={rows.length === 0} onClick={() => exportCsv(rows)} />}>
        {state.loading && !state.data ? <LoadingState /> : state.error && !state.data ? <ErrorState error={state.error} onRetry={state.reload} /> : rows.length === 0 ? (
          <EmptyState title="Nothing matches these filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead><tr className="text-xs text-muted"><th className="px-5 py-2 font-semibold">#</th><th className="font-semibold">Staff member</th><th className="font-semibold">Staff no</th><th className="font-semibold">Job title</th><th className="font-semibold">Role</th><th className="font-semibold">Phone</th><th className="px-5 font-semibold">Status</th></tr></thead>
              <tbody>
                {rows.map((s, i) => (
                  <tr key={s.staffId} {...rowProps(() => setPanel({ kind: 'edit', id: s.staffId }), `Open ${s.firstName} ${s.lastName}`)}>
                    <td className="px-5 py-3 text-muted">{i + 1}</td>
                    <td><PersonCell name={`${s.firstName} ${s.lastName}`} sub={s.jobTitle} /></td>
                    <td className="font-mono text-xs">{s.staffNo}</td>
                    <td>{s.jobTitle}</td>
                    <td><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">{s.roleName ?? '—'}</span></td>
                    <td className="tabular-nums">{maskPhone(s.phoneNumber)}</td>
                    <td className="px-5"><StatusBadge status={s.status} label={s.status.charAt(0) + s.status.slice(1).toLowerCase()} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {panel?.kind === 'add' && <AddPanel onClose={() => setPanel(null)} onDone={() => { setPanel(null); state.reload() }} />}
      {panel?.kind === 'edit' && <EditPanel id={panel.id} canEdit={has('USER_UPDATE')} onClose={() => setPanel(null)} onDone={() => { setPanel(null); state.reload() }} />}
    </div>
  )
}

function AddPanel({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [v, setV] = useState({ username: '', firstName: '', middleName: '', lastName: '', email: '', phone: '', jobTitle: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV((p) => ({ ...p, [k]: e.target.value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true); setErrors({}); setFormError(null)
    try {
      await api('/staff/onboard', { method: 'POST', body: { ...v, middleName: v.middleName || undefined, phone: toE164Tz(v.phone) } })
      toast.success('Staff member added', { description: 'Their one-time PIN was emailed to them.' })
      onDone()
    } catch (err) {
      if (err instanceof ApiError) { setErrors(err.fieldErrors); setFormError(err.message) } else setFormError('Could not add the staff member.')
    } finally { setBusy(false) }
  }

  return (
    <SidePanel open title="Add staff member" onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        <Field label="Username" value={v.username} onChange={set('username')} error={errors.username} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" value={v.firstName} onChange={set('firstName')} error={errors.firstName} required />
          <Field label="Last name" value={v.lastName} onChange={set('lastName')} error={errors.lastName} required />
        </div>
        <Field label="Middle name (optional)" value={v.middleName} onChange={set('middleName')} error={errors.middleName} />
        <Field label="Email" type="email" value={v.email} onChange={set('email')} error={errors.email} required />
        <Field label="Phone" inputMode="tel" value={v.phone} onChange={set('phone')} error={errors.phone} hint="+255 is added automatically" required />
        <Field label="Job title" value={v.jobTitle} onChange={set('jobTitle')} error={errors.jobTitle} required />
        {formError && <p role="alert" className="text-sm font-medium text-[#BE123C]">{formError}</p>}
        <Button type="submit" block loading={busy}>Add staff member</Button>
        <p className="text-xs text-muted">A one-time PIN is emailed to the new staff member and must be changed at first sign-in.</p>
      </form>
    </SidePanel>
  )
}

function EditPanel({ id, canEdit, onClose, onDone }: { id: string; canEdit: boolean; onClose: () => void; onDone: () => void }) {
  const detail = useApi<StaffDetail>((signal) => api(`/staff/${id}`, { signal }), [id])
  const [draft, setDraft] = useState<{ firstName: string; middleName: string; lastName: string; jobTitle: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const d = detail.data
  const form = draft ?? (d ? { firstName: d.firstName, middleName: d.middleName ?? '', lastName: d.lastName, jobTitle: d.jobTitle } : null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!form) return
    setBusy(true); setError(null)
    try {
      await api(`/staff/${id}`, { method: 'PUT', body: { ...form, middleName: form.middleName || undefined } })
      toast.success('Staff member updated')
      onDone()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the changes.')
    } finally { setBusy(false) }
  }

  return (
    <SidePanel open title={d ? `${d.firstName} ${d.lastName}` : 'Staff member'} subtitle={d?.staffNo} onClose={onClose}>
      {detail.loading ? <LoadingState /> : detail.error ? <ErrorState error={detail.error} onRetry={detail.reload} /> : d && form && (
        <form onSubmit={submit} className="flex flex-col gap-3.5">
          <StatusBadge status={d.status} />
          {/* Identity fields are read-only: they cannot change after onboarding. */}
          <DetailRow label="Email">{maskEmail(d.email)}</DetailRow>
          <DetailRow label="Phone">{maskPhone(d.phoneNumber)}</DetailRow>
          <DetailRow label="Added">{formatDateTime(d.createdAt)}</DetailRow>
          <Field label="First name" value={form.firstName} disabled={!canEdit} onChange={(e) => setDraft({ ...form, firstName: e.target.value })} />
          <Field label="Middle name" value={form.middleName} disabled={!canEdit} onChange={(e) => setDraft({ ...form, middleName: e.target.value })} />
          <Field label="Last name" value={form.lastName} disabled={!canEdit} onChange={(e) => setDraft({ ...form, lastName: e.target.value })} />
          <Field label="Job title" value={form.jobTitle} disabled={!canEdit} onChange={(e) => setDraft({ ...form, jobTitle: e.target.value })} />
          {error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
          {canEdit && <Button type="submit" block loading={busy} disabled={!draft}>Save changes</Button>}
        </form>
      )}
    </SidePanel>
  )
}

function exportCsv(rows: StaffRow[]) {
  downloadCsv('staff.csv',
    ['Staff number', 'Staff member', 'Job title', 'Role', 'Phone', 'Status'],
    rows.map((s) => [s.staffNo, `${s.firstName} ${s.lastName}`, s.jobTitle, s.roleName, maskPhone(s.phoneNumber), s.status]))
}
