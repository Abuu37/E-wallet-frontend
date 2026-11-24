import { useMemo, useState } from 'react'
import { api } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { downloadCsv } from '../../../shared/lib/csv'
import { formatDate, formatDateTime, formatTime } from '../../../shared/lib/dates'
import { Button, EmptyState, ErrorState, LoadingState } from '../../../shared/ui/controls'
import { DateField, ExportButton, FilterBar, PageHeader, PersonCell, SearchField, SelectField, TableCard } from '../../../shared/ui/console'
import { rowProps } from '../../../shared/ui/rowProps'
import { DetailRow, SidePanel } from '../../../shared/ui/SidePanel'

interface Entry {
  id: string
  createdAt: string
  actorId: string | null
  actorName: string
  module: string
  action: string
  entityId: string | null
  beforeJson: string | null
  afterJson: string | null
  reason: string | null
  ipAddress: string | null
}
interface AuditList { entries: Entry[]; page: number; size: number; totalElements: number }

const MODULE_LABEL: Record<string, string> = { ROLE: 'Roles', TREASURY_REQUEST: 'Treasury', AGENT: 'Agents', CUSTOMER: 'Customers', STAFF: 'Staff' }
const ACTION_LABEL: Record<string, string> = {
  ROLE_PERMISSIONS_UPDATE: 'Changed role permissions',
  ROLE_CREATE: 'Created a role',
  TREASURY_REQUEST_CREATE: 'Raised a treasury request',
  TREASURY_REQUEST_APPROVE: 'Approved a treasury request',
  TREASURY_REQUEST_REJECT: 'Rejected a treasury request',
  AGENT_STATUS_CHANGE: 'Changed an agent status',
  CUSTOMER_STATUS_CHANGE: 'Changed a customer status',
}
const moduleLabel = (m: string) => MODULE_LABEL[m] ?? m.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())
const actionLabel = (a: string) => ACTION_LABEL[a] ?? a.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())

function parse(json: string | null): Record<string, unknown> | null {
  if (!json) return null
  try {
    const value = JSON.parse(json)
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** A readable name for what the entry acted on, taken from what the action recorded. */
function targetOf(e: Entry): string {
  const data = parse(e.afterJson) ?? parse(e.beforeJson)
  const named = data?.role ?? data?.ref
  return typeof named === 'string' ? named : e.entityId ? e.entityId.slice(0, 8) : '—'
}

const show = (v: unknown) => (Array.isArray(v) ? v.join(', ') || '(none)' : v === null || v === undefined ? '—' : String(v))

export default function AuditPage() {
  const [search, setSearch] = useState('')
  const [module, setModule] = useState('')
  const [staff, setStaff] = useState('')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(0)
  /** Changing a filter returns to the first page. */
  const reset = (set: (v: string) => void) => (v: string) => { set(v); setPage(0) }
  const [open, setOpen] = useState<Entry | null>(null)
  const state = useApi<AuditList>((signal) => api('/audit-logs', { query: { size: 200 }, signal }), [], 30_000)

  const all = useMemo(() => state.data?.entries ?? [], [state.data])
  const modules = useMemo(() => [...new Set(all.map((e) => e.module))].sort(), [all])
  const people = useMemo(() => [...new Set(all.map((e) => e.actorName))].sort(), [all])
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return all.filter((e) => (!module || e.module === module) && (!staff || e.actorName === staff) && (!date || e.createdAt.slice(0, 10) === date)
      && (!q || [e.actorName, actionLabel(e.action), targetOf(e), e.reason].some((v) => v?.toLowerCase().includes(q))))
  }, [all, search, module, staff, date])

  const PAGE = 15
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const shown = rows.slice(page * PAGE, page * PAGE + PAGE)

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Audit log" subtitle="Every staff action and status change: who, what, before and after, when. Entries cannot be edited or deleted." />

      <FilterBar label="Filter the audit log" active={Boolean(search || module || staff || date)} onClear={() => { setPage(0); setSearch(''); setModule(''); setStaff(''); setDate('') }}>
        <SearchField id="kf-q" value={search} onChange={reset(setSearch)} placeholder="Search by staff, action, target or reason" />
        <SelectField id="kf-module" label="Module" value={module} onChange={reset(setModule)} options={[['', 'All modules'], ...modules.map((m): [string, string] => [m, moduleLabel(m)])]} />
        <SelectField id="kf-staff" label="Staff" value={staff} onChange={reset(setStaff)} options={[['', 'All staff'], ...people.map((p): [string, string] => [p, p])]} />
        <DateField id="kf-date" label="Date" value={date} onChange={reset(setDate)} />
      </FilterBar>

      <TableCard title="Entries" countText={state.data ? `${rows.length} of ${state.data.totalElements}` : undefined}
        action={<ExportButton disabled={rows.length === 0} onClick={() => exportCsv(rows)} />}>
        {state.loading && !state.data ? <LoadingState /> : state.error && !state.data ? <ErrorState error={state.error} onRetry={state.reload} /> : rows.length === 0 ? (
          <EmptyState title={all.length === 0 ? 'No entries yet' : 'Nothing matches these filters.'} description={all.length === 0 ? 'Staff actions such as role changes, treasury decisions and status changes appear here.' : undefined} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead><tr className="text-xs text-muted"><th className="px-5 py-2 font-semibold">#</th><th className="font-semibold">When</th><th className="font-semibold">Staff</th><th className="font-semibold">Module</th><th className="font-semibold">Action</th><th className="px-5 font-semibold">Target</th></tr></thead>
                <tbody>
                  {shown.map((e, i) => (
                    <tr key={e.id} {...rowProps(() => setOpen(e), `Open entry: ${actionLabel(e.action)} by ${e.actorName}`)}>
                      <td className="px-5 py-3 text-muted">{page * PAGE + i + 1}</td>
                      <td>{formatDate(e.createdAt)} {formatTime(e.createdAt)}<br /><span className="font-mono text-[11px] text-muted">{e.id.slice(0, 8)}</span></td>
                      <td><PersonCell name={e.actorName} /></td>
                      <td><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold">{moduleLabel(e.module)}</span></td>
                      <td className="font-bold">{actionLabel(e.action)}</td>
                      <td className="px-5">{targetOf(e)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm">
              <span className="text-muted">Page {page + 1} of {pages}</span>
              <div className="flex gap-2">
                <Button variant="secondary" className="h-9 px-4 text-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="secondary" className="h-9 px-4 text-sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          </>
        )}
      </TableCard>

      {open && <EntryPanel entry={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function EntryPanel({ entry: e, onClose }: { entry: Entry; onClose: () => void }) {
  const before = parse(e.beforeJson)
  const after = parse(e.afterJson)
  const keys = [...new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})])]
  return (
    <SidePanel open title={actionLabel(e.action)} subtitle={`${moduleLabel(e.module)} · ${e.id.slice(0, 8)}`} onClose={onClose}>
      <DetailRow label="Staff">{e.actorName}</DetailRow>
      <DetailRow label="When">{formatDateTime(e.createdAt)}</DetailRow>
      <DetailRow label="Target">{targetOf(e)}</DetailRow>
      <DetailRow label="From address">{e.ipAddress ?? '—'}</DetailRow>
      <DetailRow label="Reason">{e.reason ?? '—'}</DetailRow>

      <h3 className="mb-2 mt-5 text-sm font-extrabold">What changed</h3>
      {keys.length === 0 ? <p className="text-sm text-muted">No before or after values were recorded.</p> : (
        <ul className="flex flex-col gap-3">
          {keys.map((k) => {
            const b = before?.[k]
            const a = after?.[k]
            if (Array.isArray(b) || Array.isArray(a)) {
              const bs = (Array.isArray(b) ? b : []).map(String)
              const as = (Array.isArray(a) ? a : []).map(String)
              const added = as.filter((x) => !bs.includes(x))
              const removed = bs.filter((x) => !as.includes(x))
              return (
                <li key={k}><span className="text-xs font-bold uppercase tracking-wide text-muted">{k}</span>
                  {added.length === 0 && removed.length === 0 ? <p className="text-sm text-muted">No difference</p> : (
                    <ul className="mt-1 flex flex-col gap-1 font-mono text-xs">
                      {added.map((x) => <li key={`+${x}`} className="rounded-lg bg-teal-50 px-2.5 py-1.5 text-teal-800">+ {x}</li>)}
                      {removed.map((x) => <li key={`-${x}`} className="rounded-lg bg-rose-50 px-2.5 py-1.5 text-rose-800">− {x}</li>)}
                    </ul>
                  )}
                </li>
              )
            }
            return (
              <li key={k} className="text-sm"><span className="text-xs font-bold uppercase tracking-wide text-muted">{k}</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1.5"><span className="block text-[11px] text-muted">Before</span>{show(b)}</span>
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1.5"><span className="block text-[11px] text-muted">After</span>{show(a)}</span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <p className="mt-5 text-xs text-muted">This entry is read-only. The database refuses any change or deletion.</p>
    </SidePanel>
  )
}

function exportCsv(rows: Entry[]) {
  downloadCsv('audit-log.csv', ['When', 'Staff', 'Module', 'Action', 'Target', 'Reason', 'From address'],
    rows.map((e) => [formatDateTime(e.createdAt), e.actorName, moduleLabel(e.module), actionLabel(e.action), targetOf(e), e.reason, e.ipAddress]))
}
