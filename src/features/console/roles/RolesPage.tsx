import { useMemo, useState } from 'react'
import { ApiError, api } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { useSession } from '../../../shared/auth/context'
import { Button, ErrorState, Field, LoadingState } from '../../../shared/ui/controls'
import { PageHeader } from '../../../shared/ui/console'
import { SidePanel } from '../../../shared/ui/SidePanel'
import { toast } from '../../../shared/ui/toast'

interface RoleItem { id: string; name: string; description: string; permissionCount: number; userCount: number; permissions: string[] }
interface ModuleGroup { name: string; description: string; permissions: { name: string; description: string }[] }
interface RolesResponse { roles: RoleItem[]; modules: ModuleGroup[] }

/** Lets an admin always reach this screen again. The server enforces the same rule. */
const LOCKOUT = ['ROLE_VIEW', 'ROLE_ASSIGN']

export default function RolesPage() {
  const { has, session } = useSession()
  const canEdit = has('ROLE_ASSIGN')
  const state = useApi<RolesResponse>((signal) => api('/roles', { signal }), [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, string[]>>({})
  const [panel, setPanel] = useState<'new' | 'save' | null>(null)

  const roles = useMemo(() => state.data?.roles ?? [], [state.data])
  const selected = roles.find((r) => r.id === selectedId) ?? roles[0]
  const draftFor = (r: RoleItem) => drafts[r.id] ?? r.permissions

  const diffs = useMemo(() => roles.flatMap((r) => {
    const draft = drafts[r.id]
    if (!draft) return []
    const added = draft.filter((p) => !r.permissions.includes(p)).sort()
    const removed = r.permissions.filter((p) => !draft.includes(p)).sort()
    return added.length || removed.length ? [{ role: r, added, removed }] : []
  }), [roles, drafts])
  const changes = diffs.reduce((n, d) => n + d.added.length + d.removed.length, 0)

  if (state.loading && !state.data) return <LoadingState label="Loading roles…" />
  if (state.error && !state.data) return <ErrorState error={state.error} onRetry={state.reload} />
  if (!state.data || !selected) return null

  const protectedRole = selected.name === 'ADMIN' || (session?.roles ?? []).includes(selected.name as never)

  function toggle(role: RoleItem, permission: string) {
    const current = draftFor(role)
    const next = current.includes(permission) ? current.filter((p) => p !== permission) : [...current, permission]
    setDrafts((d) => ({ ...d, [role.id]: next }))
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Roles & access" subtitle="One role per user. Permissions are grouped by module."
        action={canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setPanel('new')}>+ New role</Button>
            <Button disabled={changes === 0} onClick={() => setPanel('save')}>Save changes · {changes}</Button>
          </div>
        ) : undefined} />

      {!canEdit && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">You can view roles but cannot change them. Ask an administrator for ROLE_ASSIGN.</p>}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav aria-label="Roles" className="flex flex-row gap-2 overflow-x-auto lg:flex-col">
          {roles.map((r) => {
            const on = r.id === selected.id
            const count = draftFor(r).length
            return (
              <button key={r.id} type="button" aria-pressed={on} onClick={() => setSelectedId(r.id)}
                className={`flex min-w-40 flex-col gap-0.5 rounded-2xl border px-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 ${on ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:bg-slate-50'}`}>
                <span className="text-[15px] font-extrabold">{r.name}{drafts[r.id] && diffs.some((d) => d.role.id === r.id) ? ' •' : ''}</span>
                <span className={`text-[13px] ${on ? 'text-slate-400' : 'text-slate-600'}`}>{count} permissions · {r.userCount} {r.userCount === 1 ? 'user' : 'users'}</span>
              </button>
            )
          })}
        </nav>

        <section aria-label="Permissions" className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {state.data.modules.map((m) => {
            const mine = draftFor(selected)
            const on = m.permissions.filter((p) => mine.includes(p.name)).length
            const noBackend = m.name === 'LOAN'
            return (
              <fieldset key={m.name} className={`m-0 flex flex-col gap-1 rounded-[18px] border border-line bg-white px-4 py-3.5 ${noBackend ? 'opacity-60' : ''}`}>
                <legend className="float-left flex w-full justify-between pb-1.5 text-[13px] font-extrabold uppercase tracking-wider text-slate-600">
                  <span>{m.name}</span><span className="font-bold normal-case tracking-normal">{on}/{m.permissions.length}</span>
                </legend>
                {m.permissions.map((p) => {
                  const locked = protectedRole && LOCKOUT.includes(p.name)
                  return (
                    <label key={p.name} title={p.description} className={`flex min-h-9 items-center gap-2.5 font-mono text-[12.5px] ${locked || !canEdit ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input type="checkbox" checked={mine.includes(p.name)} disabled={!canEdit || locked} onChange={() => toggle(selected, p.name)} className="h-[18px] w-[18px] accent-brand" />
                      {p.name}
                    </label>
                  )
                })}
                {noBackend && <span className="font-sans text-xs font-semibold text-orange-700">Hidden in the app: Loans has no backend yet</span>}
                {m.name === 'ROLE' && protectedRole && <span className="font-sans text-xs font-semibold text-orange-700">Locked on this role so admins can always manage roles</span>}
              </fieldset>
            )
          })}
        </section>
      </div>

      {panel === 'new' && <NewRolePanel onClose={() => setPanel(null)} onDone={(id) => { setPanel(null); setSelectedId(id); state.reload() }} />}
      {panel === 'save' && (
        <SavePanel diffs={diffs} drafts={drafts} onClose={() => setPanel(null)}
          onDone={() => { setPanel(null); setDrafts({}); state.reload() }} />
      )}
    </div>
  )
}

function NewRolePanel({ onClose, onDone }: { onClose: () => void; onDone: (id: string) => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  async function submit() {
    setBusy(true); setError(null); setErrors({})
    try {
      const created = await api<RoleItem>('/roles', { method: 'POST', body: { name: name.trim(), description: description.trim() || undefined } })
      toast.success('Role created', { description: 'It has no permissions yet. Tick the ones it needs, then save.' })
      onDone(created.id)
    } catch (err) {
      if (err instanceof ApiError) { setErrors(err.fieldErrors); setError(err.message) } else setError('Could not create the role.')
    } finally { setBusy(false) }
  }

  return (
    <SidePanel open title="New role" subtitle="Starts with no permissions" onClose={onClose}
      footer={<div className="flex flex-col gap-3">{error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
        <Button block loading={busy} disabled={name.trim().length < 3} onClick={() => void submit()}>Create role</Button></div>}>
      <div className="flex flex-col gap-4">
        <Field label="Role name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} hint="Capital letters, digits and underscores, e.g. OPS_LEAD" maxLength={50} />
        <Field label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} maxLength={255} />
        <p className="text-xs text-muted">Staff and agents are still onboarded into their own roles. A new role can be configured now and assigned to people when role assignment is added.</p>
      </div>
    </SidePanel>
  )
}

function SavePanel({ diffs, drafts, onClose, onDone }: {
  diffs: { role: RoleItem; added: string[]; removed: string[] }[]
  drafts: Record<string, string[]>
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setBusy(true); setError(null)
    const done: string[] = []
    try {
      for (const d of diffs) {
        await api(`/roles/${d.role.id}/permissions`, { method: 'PUT', body: { permissions: drafts[d.role.id], reason: reason.trim() || undefined } })
        done.push(d.role.name)
      }
      toast.success('Roles updated', { description: 'Signed-in users receive the change within 15 minutes.' })
      onDone()
    } catch (err) {
      const failedAt = diffs[done.length]?.role.name
      setError(`${failedAt ? `${failedAt}: ` : ''}${err instanceof ApiError ? err.message : 'Could not save.'}${done.length ? ` Already saved: ${done.join(', ')}.` : ''}`)
    } finally { setBusy(false) }
  }

  return (
    <SidePanel open title="Review changes" subtitle="Every change is written to the audit log" onClose={onClose}
      footer={<div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">Reason <span className="font-normal text-muted">(recorded with the change)</span>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={500} className="rounded-xl border border-slate-300 p-3 text-sm font-normal" /></label>
        {error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
        <Button block loading={busy} onClick={() => void save()}>Save {diffs.length} {diffs.length === 1 ? 'role' : 'roles'}</Button></div>}>
      <div className="flex flex-col gap-5">
        {diffs.map(({ role, added, removed }) => (
          <section key={role.id} aria-label={role.name}>
            <h3 className="mb-1.5 text-sm font-extrabold">{role.name}</h3>
            <ul className="flex flex-col gap-1 font-mono text-xs">
              {added.map((p) => <li key={p} className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-teal-800">+ {p}</li>)}
              {removed.map((p) => <li key={p} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-rose-800">− {p}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </SidePanel>
  )
}
