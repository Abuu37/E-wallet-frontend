import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Search,
  Briefcase,
  UserCheck,
  UserX,
  Landmark,
  ClipboardCheck,
  MoreVertical,
  Eye,
  Pencil,
  Ban,
  ShieldCheck,
  Trash2,
  Hash,
  Phone,
  MapPin,
  Tag,
  CalendarDays,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Plus,
} from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge from '../../../components/ui/StatusBadge'
import Drawer from '../../../components/ui/Drawer'
import Modal from '../../../components/ui/Modal'
import FinancialOfficerRegisterForm from './FinancialOfficerRegisterForm'
import { financialOfficers as initialOfficers, type FinancialOfficer, type OfficerStatus } from '../data'
import { settlements } from '../../financial/data'

const statusVariant = {
  Active: 'positive',
  Inactive: 'neutral',
  Suspended: 'negative',
} as const

const statusIconTone = {
  Active: 'bg-green-50 text-green-700',
  Inactive: 'bg-slate-100 text-slate-600',
  Suspended: 'bg-red-50 text-red-700',
} as const

const settlementStatusVariant = {
  Settled: 'positive',
  Pending: 'warning',
  Failed: 'negative',
} as const

const statusOptions: Array<OfficerStatus | 'All'> = ['All', 'Active', 'Inactive', 'Suspended']

const officerTabs = ['Overview', 'Settlements', 'Activity'] as const
type OfficerTab = (typeof officerTabs)[number]

const PAGE_SIZE = 10

const formatAmount = (value: number) => `TSh ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`

interface ActionMenuState {
  id: string
  top: number
  left: number
}

export default function FinancialOfficers() {
  const [officers, setOfficers] = useState<FinancialOfficer[]>(initialOfficers)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<OfficerStatus | 'All'>('All')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<OfficerTab>('Overview')
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  const [view, setView] = useState<'list' | 'form'>('list')
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')

  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null)
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [confirmSuspend, setConfirmSuspend] = useState<{ id: string; name: string; suspend: boolean } | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<FinancialOfficer | null>(null)

  const filtered = useMemo(() => {
    return officers.filter((officer) => {
      const matchesQuery =
        officer.name.toLowerCase().includes(query.toLowerCase()) ||
        officer.id.toLowerCase().includes(query.toLowerCase()) ||
        officer.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
      const matchesStatus = status === 'All' || officer.status === status
      return matchesQuery && matchesStatus
    })
  }, [officers, query, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selected: FinancialOfficer | null = officers.find((officer) => officer.id === selectedId) ?? null

  const officerSettlements = useMemo(
    () => (selected ? settlements.filter((row) => row.officer === selected.name) : []),
    [selected],
  )

  useLayoutEffect(() => {
    const node = tabRefs.current[activeTab]
    if (node) setIndicator({ left: node.offsetLeft, width: node.offsetWidth })
  }, [activeTab, drawerOpen, selectedId])

  useEffect(() => {
    const handleResize = () => {
      const node = tabRefs.current[activeTab]
      if (node) setIndicator({ left: node.offsetLeft, width: node.offsetWidth })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeTab])

  const totalOfficers = officers.length
  const activeCount = officers.filter((officer) => officer.status === 'Active').length
  const totalPortfolio = officers.reduce((sum, officer) => sum + officer.assignedPortfolio, 0)
  const todayReviews = officers.reduce((sum, officer) => sum + officer.todayApprovals + officer.todayFlagged, 0)

  const resetToFirstPage = () => setPage(1)

  const closeActionMenu = () => setActionMenu(null)

  const toggleActionMenu = (id: string) => {
    if (actionMenu?.id === id) {
      closeActionMenu()
      return
    }
    const button = menuButtonRefs.current[id]
    if (!button) return
    const rect = button.getBoundingClientRect()
    setActionMenu({ id, top: rect.bottom + 6, left: rect.right - 160 })
  }

  const openOfficer = (id: string) => {
    setSelectedId(id)
    setActiveTab('Overview')
    setDrawerOpen(true)
    closeActionMenu()
  }

  const nextOfficerId = () => {
    const nextNumber =
      Math.max(0, ...officers.map((officer) => Number(officer.id.replace('OFC-', '')) || 0)) + 1
    return `OFC-${nextNumber}`
  }

  const openEdit = (id: string) => {
    const officer = officers.find((item) => item.id === id)
    if (!officer) return
    setSelectedId(id)
    setFormMode('edit')
    setView('form')
    closeActionMenu()
  }

  const openCreate = () => {
    setSelectedId(null)
    setFormMode('create')
    setView('form')
  }

  const backToList = () => setView('list')

  const openSettlements = (id: string) => {
    setSelectedId(id)
    setActiveTab('Settlements')
    setDrawerOpen(true)
  }

  const handleFormSubmit = (officer: FinancialOfficer) => {
    if (formMode === 'edit') {
      setOfficers((prev) => prev.map((item) => (item.id === officer.id ? officer : item)))
    } else {
      setOfficers((prev) => [officer, ...prev])
    }
    setView('list')
  }

  const requestSuspendToggle = (id: string) => {
    const officer = officers.find((item) => item.id === id)
    if (!officer) return
    setConfirmSuspend({ id, name: officer.name, suspend: officer.status !== 'Suspended' })
    closeActionMenu()
  }

  const confirmSuspendToggle = () => {
    if (!confirmSuspend) return
    setOfficers((prev) =>
      prev.map((officer) =>
        officer.id === confirmSuspend.id
          ? { ...officer, status: confirmSuspend.suspend ? 'Suspended' : 'Active' }
          : officer,
      ),
    )
    setConfirmSuspend(null)
  }

  const requestDelete = (id: string) => {
    const officer = officers.find((item) => item.id === id)
    if (!officer) return
    setDeleteTarget(officer)
    closeActionMenu()
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setOfficers((prev) => prev.filter((officer) => officer.id !== deleteTarget.id))
    if (selectedId === deleteTarget.id) {
      setDrawerOpen(false)
    }
    setDeleteTarget(null)
  }

  const setSelectedStatus = (nextStatus: OfficerStatus) => {
    if (!selected) return
    setOfficers((prev) =>
      prev.map((officer) => (officer.id === selected.id ? { ...officer, status: nextStatus } : officer)),
    )
  }

  if (view === 'form') {
    return (
      <FinancialOfficerRegisterForm
        mode={formMode}
        initialOfficer={formMode === 'edit' ? selected ?? undefined : undefined}
        defaultOfficerId={nextOfficerId()}
        onCancel={backToList}
        onSubmit={handleFormSubmit}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Financial Officers</h1>
        <p className="mt-1 text-sm text-muted">
          Manage financial officer accounts, roles, and activity across the platform.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Briefcase}
          tone="brand"
          label="Total Officers"
          value={String(totalOfficers)}
          delta={3.6}
        />
        <StatCard
          icon={UserCheck}
          tone="positive"
          label="Active Officers"
          value={String(activeCount)}
          delta={2.1}
        />
        <StatCard
          icon={Landmark}
          tone="accent"
          label="Total Portfolio"
          value={formatAmount(totalPortfolio)}
          delta={5.4}
        />
        <StatCard
          icon={ClipboardCheck}
          tone="warning"
          label="Today's Reviews"
          value={formatAmount(todayReviews)}
          delta={1.8}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              resetToFirstPage()
            }}
            placeholder="Search by name, ID or phone..."
            className="w-full rounded-full border border-transparent bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as OfficerStatus | 'All')
              resetToFirstPage()
            }}
            className="rounded-full border border-transparent bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All statuses' : option}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
          >
            <Plus size={16} />
            Create officer
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">ID</th>
                <th className="px-6 py-3 font-semibold">Officer ID</th>
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">Phone</th>
                <th className="px-6 py-3 font-semibold">Branch</th>
                <th className="px-6 py-3 font-semibold">Portfolio Account</th>
                <th className="px-6 py-3 text-right font-semibold">Assigned Portfolio</th>
                <th className="px-6 py-3 text-right font-semibold">Settlements</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map((officer, index) => {
                const settlementCount = settlements.filter((row) => row.officer === officer.name).length
                return (
                  <tr key={officer.id}>
                    <td className="px-6 py-3.5 text-xs text-muted">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-muted">{officer.id}</td>
                    <td className="px-6 py-3.5 font-medium text-ink">{officer.name}</td>
                    <td className="px-6 py-3.5 font-mono text-ink/70">{officer.phone}</td>
                    <td className="px-6 py-3.5 text-ink/70">{officer.branch}</td>
                    <td className="px-6 py-3.5 font-mono text-ink/70">{officer.portfolioAccount}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-ink">
                      {formatAmount(officer.assignedPortfolio)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openSettlements(officer.id)}
                        className="block w-full text-right font-semibold text-brand underline-offset-2 hover:underline"
                      >
                        {settlementCount}
                      </button>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={statusVariant[officer.status]} label={officer.status} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        ref={(node) => {
                          menuButtonRefs.current[officer.id] = node
                        }}
                        onClick={() => toggleActionMenu(officer.id)}
                        aria-label="Row actions"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink/80 transition-colors hover:border-brand hover:bg-brand hover:text-white"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-sm text-muted">
                    No officers match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-line px-6 py-4 text-sm text-muted">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-full border border-line px-3 py-1.5 font-medium text-ink/80 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink/80"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              className="rounded-full border border-line px-3 py-1.5 font-medium text-ink/80 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink/80"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {actionMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeActionMenu} />
            <motion.div
              key="action-menu"
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="fixed z-50 w-40 origin-top-right overflow-hidden rounded-xl bg-white py-1 shadow-xl ring-1 ring-line"
              style={{ top: actionMenu.top, left: actionMenu.left }}
            >
              <button
                type="button"
                onClick={() => openOfficer(actionMenu.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-brand hover:text-white"
              >
                <Eye size={14} /> View
              </button>
              <button
                type="button"
                onClick={() => openEdit(actionMenu.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-brand hover:text-white"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                type="button"
                onClick={() => requestDelete(actionMenu.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white"
              >
                <Trash2 size={14} /> Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Officer detail"
        size="lg"
        footer={
          selected ? (
            selected.status === 'Inactive' ? (
              <button
                type="button"
                onClick={() => setSelectedStatus('Active')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-green-200 bg-green-50 py-2.5 text-sm font-semibold text-green-700"
              >
                <ShieldCheck size={16} /> Activate officer
              </button>
            ) : selected.status === 'Active' ? (
              <button
                type="button"
                onClick={() => requestSuspendToggle(selected.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700"
              >
                <Ban size={16} /> Suspend officer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => requestSuspendToggle(selected.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-green-200 bg-green-50 py-2.5 text-sm font-semibold text-green-700"
              >
                <ShieldCheck size={16} /> Reactivate officer
              </button>
            )
          ) : null
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <Briefcase size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-ink">{selected.name}</p>
                <p className="truncate font-mono text-xs text-muted">{selected.id}</p>
              </div>
              <StatusBadge status={statusVariant[selected.status]} label={selected.status} />
            </div>

            <div className="rounded-xl bg-surface p-4 ring-1 ring-line">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Landmark size={14} /> Assigned Portfolio
              </p>
              <p className="mt-1 text-3xl font-extrabold text-ink">
                {formatAmount(selected.assignedPortfolio)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-line">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                  <CheckCircle2 size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted">Today's approvals</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-ink">
                    {formatAmount(selected.todayApprovals)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-line">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
                  <AlertTriangle size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted">Today's flagged</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-ink">
                    {formatAmount(selected.todayFlagged)}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative flex flex-wrap items-center gap-1 rounded-full bg-surface p-1 ring-1 ring-line">
              <span
                className="absolute inset-y-1 rounded-full bg-brand shadow-sm transition-all duration-300 ease-out"
                style={{ left: indicator.left, width: indicator.width }}
              />
              {officerTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  ref={(node) => {
                    tabRefs.current[tab] = node
                  }}
                  onClick={() => setActiveTab(tab)}
                  className={`relative z-10 flex-1 rounded-full px-3 py-1.5 text-center text-xs font-semibold transition-colors duration-300 ${
                    activeTab === tab ? 'text-white' : 'text-muted hover:text-ink'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === 'Overview' && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Officer Information
                </p>
                <div className="mt-3 divide-y divide-line rounded-xl ring-1 ring-line">
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Hash size={16} />
                      </span>
                      <p className="text-xs text-muted">Officer ID</p>
                    </div>
                    <p className="shrink-0 truncate font-mono text-sm font-semibold text-ink">
                      {selected.id}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Phone size={16} />
                      </span>
                      <p className="text-xs text-muted">Phone Number</p>
                    </div>
                    <p className="shrink-0 truncate font-mono text-sm font-semibold text-ink">
                      {selected.phone}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <MapPin size={16} />
                      </span>
                      <p className="text-xs text-muted">Branch</p>
                    </div>
                    <p className="shrink-0 truncate text-sm font-semibold text-ink">{selected.branch}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Tag size={16} />
                      </span>
                      <p className="text-xs text-muted">Desk Code</p>
                    </div>
                    <p className="shrink-0 font-mono text-sm font-semibold text-ink">{selected.deskCode}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Landmark size={16} />
                      </span>
                      <p className="text-xs text-muted">Portfolio Account</p>
                    </div>
                    <p className="shrink-0 font-mono text-sm font-semibold text-ink">
                      {selected.portfolioAccount}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <CalendarDays size={16} />
                      </span>
                      <p className="text-xs text-muted">Joined</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-ink">{selected.joined}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Clock size={16} />
                      </span>
                      <p className="text-xs text-muted">Last activity</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-ink">{selected.lastActivity}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          statusIconTone[selected.status]
                        }`}
                      >
                        {selected.status === 'Active' ? (
                          <UserCheck size={16} />
                        ) : selected.status === 'Suspended' ? (
                          <Ban size={16} />
                        ) : (
                          <UserX size={16} />
                        )}
                      </span>
                      <p className="text-xs text-muted">Status</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-ink">{selected.status}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'Settlements' && (
              <div className="divide-y divide-line rounded-xl ring-1 ring-line">
                {officerSettlements.length === 0 ? (
                  <p className="p-3 text-sm text-muted">No settlements reviewed by this officer yet.</p>
                ) : (
                  officerSettlements.map((row) => (
                    <div key={row.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            row.direction === 'Credit'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {row.direction === 'Credit' ? (
                            <ArrowDownRight size={16} />
                          ) : (
                            <ArrowUpRight size={16} />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{row.description}</p>
                          <p className="truncate font-mono text-xs text-muted">
                            {row.id} · {row.date}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={`font-semibold ${
                            row.direction === 'Credit' ? 'text-green-700' : 'text-red-600'
                          }`}
                        >
                          {row.direction === 'Credit' ? '+' : '-'}
                          {formatAmount(row.amount)}
                        </p>
                        <div className="mt-1">
                          <StatusBadge status={settlementStatusVariant[row.status]} label={row.status} />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'Activity' && (
              <div className="divide-y divide-line rounded-xl ring-1 ring-line">
                <div className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                      <CheckCircle2 size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">Approvals processed today</p>
                      <p className="text-xs text-muted">{selected.branch}</p>
                    </div>
                  </div>
                  <p className="shrink-0 font-semibold text-green-700">
                    +{formatAmount(selected.todayApprovals)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
                      <AlertTriangle size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">Items flagged today</p>
                      <p className="text-xs text-muted">{selected.branch}</p>
                    </div>
                  </div>
                  <p className="shrink-0 font-semibold text-red-600">
                    -{formatAmount(selected.todayFlagged)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Clock size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">Last seen active</p>
                      <p className="text-xs text-muted">Desk {selected.deskCode}</p>
                    </div>
                  </div>
                  <p className="shrink-0 font-semibold text-ink">{selected.lastActivity}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Modal
        open={!!confirmSuspend}
        onClose={() => setConfirmSuspend(null)}
        title={
          <>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                confirmSuspend?.suspend ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
              }`}
            >
              {confirmSuspend?.suspend ? <Ban size={16} /> : <ShieldCheck size={16} />}
            </span>
            {confirmSuspend?.suspend ? 'Suspend officer' : 'Reactivate officer'}
          </>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmSuspend(null)}
              className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmSuspendToggle}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold text-white transition-colors ${
                confirmSuspend?.suspend ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {confirmSuspend?.suspend ? 'Suspend' : 'Reactivate'}
            </button>
          </>
        }
      >
        <p className="text-sm text-ink/80">
          {confirmSuspend?.suspend ? (
            <>
              Are you sure you want to suspend{' '}
              <span className="font-semibold text-ink">{confirmSuspend?.name}</span>? Their desk access
              will be revoked until reactivated.
            </>
          ) : (
            <>
              Are you sure you want to reactivate{' '}
              <span className="font-semibold text-ink">{confirmSuspend?.name}</span>? They will regain
              desk access immediately.
            </>
          )}
        </p>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={16} />
            </span>
            Delete officer
          </>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-ink/80">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-ink">{deleteTarget?.name}</span>? This will permanently
          remove the officer and their portfolio assignment. This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
