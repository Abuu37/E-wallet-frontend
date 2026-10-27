import { useMemo, useState } from 'react'
import {
  Search,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Building2,
  UserCog,
  Plus,
  Eye,
  CalendarClock,
  Hash,
  Landmark,
  Scale,
  FileText,
  User,
} from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge, { type StatusBadgeVariant } from '../../../components/ui/StatusBadge'
import TypeBadge from '../../../components/ui/TypeBadge'
import Drawer from '../../../components/ui/Drawer'
import Modal from '../../../components/ui/Modal'
import {
  reconciliationRuns as initialRuns,
  buildReconciliationRun,
  getCashierName,
  type ReconciliationRun,
  type ReconciliationScope,
  type ReconciliationStatus,
} from '../data'
import { cashiers } from '../../cashiers/data'

const statusVariant: Record<ReconciliationStatus, StatusBadgeVariant> = {
  Balanced: 'positive',
  Open: 'negative',
  Investigating: 'warning',
  Resolved: 'info',
  'Written Off': 'neutral',
}

const scopeTone = {
  Company: 'blue',
  Cashier: 'amber',
} as const

const scopeOptions: Array<ReconciliationScope | 'All'> = ['All', 'Company', 'Cashier']
const statusOptions: Array<ReconciliationStatus | 'All'> = [
  'All',
  'Balanced',
  'Open',
  'Investigating',
  'Resolved',
  'Written Off',
]
const resolvableStatuses: ReconciliationStatus[] = ['Open', 'Investigating', 'Resolved', 'Written Off']

const currency = (value: number) => `TSh ${Math.round(value).toLocaleString()}`

const formatDateTime = (iso: string) => {
  const date = new Date(iso)
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const subjectOf = (run: ReconciliationRun) =>
  run.scope === 'Company' ? 'Company Wallet' : getCashierName(run.cashierId)

export default function Reconciliation() {
  const [runs, setRuns] = useState<ReconciliationRun[]>(initialRuns)
  const [scopeFilter, setScopeFilter] = useState<ReconciliationScope | 'All'>('All')
  const [statusFilter, setStatusFilter] = useState<ReconciliationStatus | 'All'>('All')
  const [query, setQuery] = useState('')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [draftStatus, setDraftStatus] = useState<ReconciliationStatus>('Open')
  const [draftNotes, setDraftNotes] = useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [newScope, setNewScope] = useState<ReconciliationScope>('Company')
  const [newCashierId, setNewCashierId] = useState(cashiers[0]?.id ?? '')
  const [newStatementAmount, setNewStatementAmount] = useState('')
  const [newPerformedBy, setNewPerformedBy] = useState('')

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return runs.filter((run) => {
      const matchesScope = scopeFilter === 'All' || run.scope === scopeFilter
      const matchesStatus = statusFilter === 'All' || run.status === statusFilter
      const matchesQuery =
        run.id.toLowerCase().includes(q) || subjectOf(run).toLowerCase().includes(q)
      return matchesScope && matchesStatus && matchesQuery
    })
  }, [runs, scopeFilter, statusFilter, query])

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => b.asOf.localeCompare(a.asOf)),
    [filtered],
  )

  const openCount = runs.filter((r) => r.status === 'Open' || r.status === 'Investigating').length
  const balancedCount = runs.filter((r) => r.status === 'Balanced').length
  const lastCompanyRun = [...runs]
    .filter((r) => r.scope === 'Company')
    .sort((a, b) => b.asOf.localeCompare(a.asOf))[0]

  const selected = runs.find((r) => r.id === selectedId) ?? null

  const openDetail = (run: ReconciliationRun) => {
    setSelectedId(run.id)
    setDraftStatus(run.status)
    setDraftNotes(run.notes ?? '')
    setDrawerOpen(true)
  }

  const saveResolution = () => {
    if (!selected) return
    setRuns((prev) =>
      prev.map((run) =>
        run.id === selected.id
          ? {
              ...run,
              status: draftStatus,
              notes: draftNotes.trim() || undefined,
              resolvedAt:
                draftStatus === 'Resolved' || draftStatus === 'Written Off'
                  ? run.resolvedAt ?? new Date().toISOString()
                  : run.resolvedAt,
            }
          : run,
      ),
    )
    setDrawerOpen(false)
  }

  const nextRunId = () => {
    const nextNumber = Math.max(0, ...runs.map((r) => Number(r.id.replace('RCN-', '')) || 0)) + 1
    return `RCN-${String(nextNumber).padStart(3, '0')}`
  }

  const openCreate = () => {
    setNewScope('Company')
    setNewCashierId(cashiers[0]?.id ?? '')
    setNewStatementAmount('')
    setNewPerformedBy('')
    setCreateOpen(true)
  }

  const submitCreate = () => {
    const amount = Number(newStatementAmount)
    if (!Number.isFinite(amount) || !newPerformedBy.trim()) return
    const run = buildReconciliationRun({
      id: nextRunId(),
      scope: newScope,
      cashierId: newScope === 'Cashier' ? newCashierId : undefined,
      statementAmount: amount,
      performedBy: newPerformedBy,
    })
    setRuns((prev) => [run, ...prev])
    setCreateOpen(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Reconciliation</h1>
          <p className="mt-1 text-sm text-muted">
            Checks the ledger against real bank statements and cashier cash counts, and tracks
            any gap through to resolution.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
        >
          <Plus size={16} />
          New Reconciliation
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShieldCheck} tone="brand" label="Total Runs" value={String(runs.length)} />
        <StatCard
          icon={AlertTriangle}
          tone={openCount > 0 ? 'negative' : 'positive'}
          label="Open Discrepancies"
          value={String(openCount)}
        />
        <StatCard icon={CheckCircle2} tone="positive" label="Balanced Runs" value={String(balancedCount)} />
        <StatCard
          icon={CalendarClock}
          tone="accent"
          label="Last Company Reconciliation"
          value={lastCompanyRun ? formatDateTime(lastCompanyRun.asOf) : 'Never'}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by run ID or subject..."
            className="w-full rounded-full border border-transparent bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={scopeFilter}
            onChange={(event) => setScopeFilter(event.target.value as ReconciliationScope | 'All')}
            className="rounded-full border border-transparent bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          >
            {scopeOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All scopes' : option}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ReconciliationStatus | 'All')}
            className="rounded-full border border-transparent bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All statuses' : option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-6 py-3 font-semibold">Run ID</th>
                <th className="px-6 py-3 font-semibold">Scope</th>
                <th className="px-6 py-3 font-semibold">Subject</th>
                <th className="px-6 py-3 font-semibold">As Of</th>
                <th className="px-6 py-3 text-right font-semibold">Statement</th>
                <th className="px-6 py-3 text-right font-semibold">Ledger</th>
                <th className="px-6 py-3 text-right font-semibold">Difference</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sorted.map((run, index) => (
                <tr
                  key={run.id}
                  onClick={() => openDetail(run)}
                  className="cursor-pointer transition-colors hover:bg-surface"
                >
                  <td className="px-6 py-3.5 text-xs text-muted">{index + 1}</td>
                  <td className="px-6 py-3.5 font-mono text-xs font-bold text-ink">{run.id}</td>
                  <td className="px-6 py-3.5">
                    <TypeBadge tone={scopeTone[run.scope]} label={run.scope} />
                  </td>
                  <td className="px-6 py-3.5 font-medium text-ink">{subjectOf(run)}</td>
                  <td className="px-6 py-3.5 text-ink/70">{formatDateTime(run.asOf)}</td>
                  <td className="px-6 py-3.5 text-right text-ink/80">{currency(run.statementAmount)}</td>
                  <td className="px-6 py-3.5 text-right text-ink/80">{currency(run.ledgerAmount)}</td>
                  <td
                    className={`px-6 py-3.5 text-right font-semibold ${
                      Math.abs(run.difference) < 0.01 ? 'text-ink' : 'text-red-600'
                    }`}
                  >
                    {currency(run.difference)}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={statusVariant[run.status]} label={run.status} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        openDetail(run)
                      }}
                      aria-label="View run"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink/80 transition-colors hover:border-brand hover:bg-brand hover:text-white"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-sm text-muted">
                    No reconciliation runs match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Reconciliation detail"
        footer={
          selected ? (
            <button
              type="button"
              onClick={saveResolution}
              className="flex-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
            >
              Save
            </button>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                {selected.scope === 'Company' ? <Building2 size={20} /> : <UserCog size={20} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-ink">{runTitle(selected)}</p>
                <p className="text-xs text-muted">{selected.id}</p>
              </div>
              <StatusBadge status={statusVariant[selected.status]} label={selected.status} />
            </div>

            <div className="rounded-xl bg-surface p-4 ring-1 ring-line">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Scale size={14} /> Difference
              </p>
              <p
                className={`mt-1 text-3xl font-extrabold ${
                  Math.abs(selected.difference) < 0.01 ? 'text-ink' : 'text-red-600'
                }`}
              >
                {currency(selected.difference)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Overview</p>
              <div className="mt-3 divide-y divide-line rounded-xl ring-1 ring-line">
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Hash size={16} />
                    </span>
                    <p className="text-xs text-muted">Subject</p>
                  </div>
                  <p className="min-w-0 truncate text-sm font-semibold text-ink">{subjectOf(selected)}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CalendarClock size={16} />
                    </span>
                    <p className="text-xs text-muted">As Of</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{formatDateTime(selected.asOf)}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Landmark size={16} />
                    </span>
                    <p className="text-xs text-muted">
                      {selected.scope === 'Company' ? 'Bank Statement' : 'Cash Counted'}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{currency(selected.statementAmount)}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Scale size={16} />
                    </span>
                    <p className="text-xs text-muted">Ledger Amount</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{currency(selected.ledgerAmount)}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <User size={16} />
                    </span>
                    <p className="text-xs text-muted">Performed By</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{selected.performedBy}</p>
                </div>
              </div>
            </div>

            {Math.abs(selected.difference) >= 0.01 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Resolution</p>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted">Status</label>
                    <select
                      value={draftStatus}
                      onChange={(event) => setDraftStatus(event.target.value as ReconciliationStatus)}
                      className="mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand"
                    >
                      {resolvableStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted">Notes</label>
                    <div className="relative mt-1">
                      <FileText size={16} className="pointer-events-none absolute left-3.5 top-3 text-muted" />
                      <textarea
                        value={draftNotes}
                        onChange={(event) => setDraftNotes(event.target.value)}
                        rows={3}
                        placeholder="What's the explanation for this difference?"
                        className="w-full resize-none rounded-xl border border-transparent bg-surface py-2.5 pl-10 pr-3.5 text-sm outline-none ring-1 ring-line focus:border-brand"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Plus size={16} />
            </span>
            New Reconciliation
          </>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:border-red-600 hover:text-red-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitCreate}
              className="flex-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
            >
              Run Reconciliation
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted">Scope</label>
            <select
              value={newScope}
              onChange={(event) => setNewScope(event.target.value as ReconciliationScope)}
              className="mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand"
            >
              <option value="Company">Company (trust account)</option>
              <option value="Cashier">Cashier (float cash count)</option>
            </select>
          </div>

          {newScope === 'Cashier' && (
            <div>
              <label className="text-xs font-medium text-muted">Cashier</label>
              <select
                value={newCashierId}
                onChange={(event) => setNewCashierId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand"
              >
                {cashiers.map((cashier) => (
                  <option key={cashier.id} value={cashier.id}>
                    {cashier.name} ({cashier.id})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted">
              {newScope === 'Company' ? 'Bank statement amount' : 'Cash counted'}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={newStatementAmount}
              onChange={(event) => setNewStatementAmount(event.target.value)}
              placeholder="e.g. 795966.75"
              className="mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand"
            />
            <p className="mt-1 text-xs text-muted">
              The ledger amount is captured automatically from live data when you submit.
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted">
              Performed by <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newPerformedBy}
              onChange={(event) => setNewPerformedBy(event.target.value)}
              placeholder="e.g. Grace Mahundi"
              className="mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}

function runTitle(run: ReconciliationRun) {
  return run.scope === 'Company' ? 'Company Wallet Reconciliation' : `${getCashierName(run.cashierId)}'s Float`
}
