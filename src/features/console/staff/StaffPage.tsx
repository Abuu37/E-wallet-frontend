import { useState, type FormEvent } from 'react'
import { ApiError, api } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { useSession } from '../../../shared/auth/context'
import { formatDateTime } from '../../../shared/lib/dates'
import { maskEmail, maskPhone, toE164Tz } from '../../../shared/lib/phone'
import { Button, EmptyState, ErrorState, Field, LoadingState } from '../../../shared/ui/controls'
import { DetailRow, SidePanel, StatusBadge } from '../../../shared/ui/SidePanel'
import { toast } from '../../../lib/toast'

interface StaffRow { staffId: string; staffNo: string; firstName: string; middleName: string | null; lastName: string; phoneNumber: string; jobTitle: string; status: string }
interface StaffDetail extends StaffRow { userId: string; email: string; createdAt: string; updatedAt: string }

type Panel = { kind: 'add' } | { kind: 'edit'; id: string } | null

export default function StaffPage() {
  const { has } = useSession()
  const [panel, setPanel] = useState<Panel>(null)
  const state = useApi<StaffRow[] | { staff?: StaffRow[] }>((signal) => api('/staff', { signal }), [])
  const rows: StaffRow[] = Array.isArray(state.data) ? state.data : state.data?.staff ?? []

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight">Staff</h1>
        {has('USER_CREATE') && <Button onClick={() => setPanel({ kind: 'add' })}>Add staff member</Button>}
      </div>

      <section aria-label="Staff" className="rounded-2xl border border-line bg-white">
        {state.loading && !state.data ? <LoadingState /> : state.error && !state.data ? <ErrorState error={state.error} onRetry={state.reload} /> : rows.length === 0 ? (
          <EmptyState title="No staff members yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead><tr className="text-xs text-muted"><th className="p-3 font-semibold">Staff</th><th className="font-semibold">Job title</th><th className="font-semibold">Phone</th><th className="font-semibold">Status</th><th className="p-3"><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.staffId} className="border-t border-line hover:bg-surface">
                    <td className="p-3"><b className="block">{s.firstName} {s.lastName}</b><span className="text-xs text-muted">{s.staffNo}</span></td>
                    <td>{s.jobTitle}</td>
                    <td className="tabular-nums">{maskPhone(s.phoneNumber)}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td className="p-3 text-right"><Button variant="secondary" className="h-9 px-4 text-sm" onClick={() => setPanel({ kind: 'edit', id: s.staffId })}>{has('USER_UPDATE') ? 'Edit' : 'View'}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

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
