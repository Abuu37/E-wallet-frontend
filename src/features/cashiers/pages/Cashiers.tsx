import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Search,
  Users,
  UserCog,
  UserCheck,
  UserX,
  Landmark,
  MoreVertical,
  Eye,
  Pencil,
  Ban,
  ShieldCheck,
  Trash2,
  Hash,
  Phone,
  MapPin,
  CalendarDays,
  Clock,
  PauseCircle,
  Moon,
  AlertTriangle,
  Receipt,
  HandCoins,
  Plus,
} from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge from '../../../components/ui/StatusBadge'
import Drawer from '../../../components/ui/Drawer'
import Modal from '../../../components/ui/Modal'
import TransactionHistoryView from '../../../components/ui/TransactionHistoryView'
import SortIcon, { type SortDirection } from '../../../components/ui/SortIcon'
import CashierRegisterForm from './CashierRegisterForm'
import { cashiers as initialCashiers, type Cashier, type CashierStatus } from '../data'
import { daysSince, getCashierStatus, getLastActiveDate } from '../status'
import { transactions } from '../../transactions/data'
import { getCashierFloatBalance } from '../../ledger/data'

const statusVariant = {
  Active: 'positive',
  Pending: 'warning',
  Idle: 'neutral',
  Dormant: 'info',
  Blocked: 'negative',
} as const

const statusIconTone = {
  Active: 'bg-green-50 text-green-700',
  Pending: 'bg-amber-50 text-amber-700',
  Idle: 'bg-slate-100 text-slate-600',
  Dormant: 'bg-purple-50 text-purple-700',
  Blocked: 'bg-red-100 text-red-800',
} as const

const statusIcon = {
  Active: UserCheck,
  Pending: Clock,
  Idle: PauseCircle,
  Dormant: Moon,
  Blocked: Ban,
} as const

const statusOptions: Array<CashierStatus | 'All'> = ['All', 'Active', 'Idle', 'Dormant', 'Pending', 'Blocked']
type FloatHealthLabel = 'Healthy' | 'Low' | 'Critical'
const floatHealthOptions: Array<FloatHealthLabel | 'All'> = ['All', 'Healthy', 'Low', 'Critical']

const LOW_FLOAT_THRESHOLD = 50000

const PAGE_SIZE = 10

const formatAmount = (value: number) => `TSh ${Math.round(value).toLocaleString()}`

const getFloatHealth = (floatBalance: number) => {
  if (floatBalance <= 0) return { label: 'Critical', variant: 'negative' } as const
  if (floatBalance < LOW_FLOAT_THRESHOLD) return { label: 'Low', variant: 'warning' } as const
  return { label: 'Healthy', variant: 'positive' } as const
}

const formatLastActive = (dateValue: string) => {
  const days = daysSince(dateValue)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

interface ActionMenuState {
  id: string
  top: number
  left: number
}

type CashierSortKey =
  | 'id'
  | 'name'
  | 'floatBalance'
  | 'floatHealth'
  | 'commissionBalance'
  | 'transactions'
  | 'lastActive'
  | 'status'

export default function Cashiers() {
  const [cashiers, setCashiers] = useState<Cashier[]>(initialCashiers)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<CashierStatus | 'All'>('All')
  const [floatHealthFilter, setFloatHealthFilter] = useState<FloatHealthLabel | 'All'>('All')
  const [sortKey, setSortKey] = useState<CashierSortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [view, setView] = useState<'list' | 'form' | 'history'>('list')
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')

  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null)
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [confirmReport, setConfirmReport] = useState<{ id: string; name: string; report: boolean } | null>(
    null,
  )
  const [deleteTarget, setDeleteTarget] = useState<Cashier | null>(null)

  const filtered = useMemo(() => {
    const digitsQuery = query.replace(/\D/g, '')
    return cashiers.filter((cashier) => {
      const matchesQuery =
        cashier.name.toLowerCase().includes(query.toLowerCase()) ||
        cashier.id.toLowerCase().includes(query.toLowerCase()) ||
        (digitsQuery.length > 0 && cashier.phone.replace(/\D/g, '').includes(digitsQuery))
      const matchesStatus = status === 'All' || getCashierStatus(cashier) === status
      const matchesFloatHealth =
        floatHealthFilter === 'All' || getFloatHealth(getCashierFloatBalance(cashier)).label === floatHealthFilter
      return matchesQuery && matchesStatus && matchesFloatHealth
    })
  }, [cashiers, query, status, floatHealthFilter])

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    const direction = sortDir === 'asc' ? 1 : -1
    const txCountOf = (cashier: Cashier) =>
      transactions.filter((tx) => tx.recipientName === cashier.name).length
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'id':
          return a.id.localeCompare(b.id) * direction
        case 'name':
          return a.name.localeCompare(b.name) * direction
        case 'floatBalance':
          return (getCashierFloatBalance(a) - getCashierFloatBalance(b)) * direction
        case 'floatHealth':
          return (
            getFloatHealth(getCashierFloatBalance(a)).label.localeCompare(
              getFloatHealth(getCashierFloatBalance(b)).label,
            ) * direction
          )
        case 'commissionBalance':
          return (a.commissionPayable - b.commissionPayable) * direction
        case 'transactions':
          return (txCountOf(a) - txCountOf(b)) * direction
        case 'lastActive':
          return getLastActiveDate(a).localeCompare(getLastActiveDate(b)) * direction
        case 'status':
          return getCashierStatus(a).localeCompare(getCashierStatus(b)) * direction
        default:
          return 0
      }
    })
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key: CashierSortKey) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortKey(null)
      setSortDir(null)
    }
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageItems = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selected: Cashier | null = cashiers.find((cashier) => cashier.id === selectedId) ?? null
  const selectedStatus: CashierStatus | null = selected ? getCashierStatus(selected) : null

  const selectedTransactions = useMemo(
    () => (selected ? transactions.filter((tx) => tx.recipientName === selected.name) : []),
    [selected],
  )

  const totalCashiers = cashiers.length
  const activeCount = cashiers.filter((cashier) => getCashierStatus(cashier) === 'Active').length
  const pendingCount = cashiers.filter((cashier) => getCashierStatus(cashier) === 'Pending').length
  const idleCount = cashiers.filter((cashier) => getCashierStatus(cashier) === 'Idle').length
  const dormantCount = cashiers.filter((cashier) => getCashierStatus(cashier) === 'Dormant').length
  const blockedCount = cashiers.filter((cashier) => getCashierStatus(cashier) === 'Blocked').length
  const lowFloatCount = cashiers.filter((cashier) => getCashierFloatBalance(cashier) < LOW_FLOAT_THRESHOLD).length
  const totalFloat = cashiers.reduce((sum, cashier) => sum + getCashierFloatBalance(cashier), 0)
  const totalCommission = cashiers.reduce((sum, cashier) => sum + cashier.commissionPayable, 0)

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

  const openCashier = (id: string) => {
    setSelectedId(id)
    setDrawerOpen(true)
    closeActionMenu()
  }

  const nextCashierId = () => {
    const nextNumber =
      Math.max(0, ...cashiers.map((cashier) => Number(cashier.id.replace('CSH-', '')) || 0)) + 1
    return `CSH-${nextNumber}`
  }

  const openEdit = (id: string) => {
    const cashier = cashiers.find((item) => item.id === id)
    if (!cashier) return
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

  const openTransactions = (id: string) => {
    setSelectedId(id)
    setView('history')
    setDrawerOpen(false)
    closeActionMenu()
  }

  const handleFormSubmit = (cashier: Cashier) => {
    if (formMode === 'edit') {
      setCashiers((prev) => prev.map((item) => (item.id === cashier.id ? cashier : item)))
    } else {
      setCashiers((prev) => [cashier, ...prev])
    }
    setView('list')
  }

  const requestReportToggle = (id: string) => {
    const cashier = cashiers.find((item) => item.id === id)
    if (!cashier) return
    setConfirmReport({ id, name: cashier.name, report: !cashier.unauthorizedReported })
    closeActionMenu()
  }

  const confirmReportToggle = () => {
    if (!confirmReport) return
    setCashiers((prev) =>
      prev.map((cashier) =>
        cashier.id === confirmReport.id
          ? { ...cashier, unauthorizedReported: confirmReport.report }
          : cashier,
      ),
    )
    setConfirmReport(null)
  }

  const requestDelete = (id: string) => {
    const cashier = cashiers.find((item) => item.id === id)
    if (!cashier) return
    setDeleteTarget(cashier)
    closeActionMenu()
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setCashiers((prev) => prev.filter((cashier) => cashier.id !== deleteTarget.id))
    if (selectedId === deleteTarget.id) {
      setDrawerOpen(false)
    }
    setDeleteTarget(null)
  }

  if (view === 'history' && selected) {
    return (
      <TransactionHistoryView
        subjectName={selected.name}
        subjectPhone={selected.phone}
        statusBadge={selectedStatus ? { variant: statusVariant[selectedStatus], label: selectedStatus } : null}
        onBack={backToList}
        backAriaLabel="Back to cashiers"
        transactions={selectedTransactions}
        emptyMessage="No transactions processed by this cashier yet."
      />
    )
  }

  if (view === 'form') {
    return (
      <CashierRegisterForm
        mode={formMode}
        initialCashier={formMode === 'edit' ? selected ?? undefined : undefined}
        defaultCashierId={nextCashierId()}
        onCancel={backToList}
        onSubmit={handleFormSubmit}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Cashiers</h1>
        <p className="mt-1 text-sm text-muted">
          Manage cashier accounts, float balances, and transaction activity.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          tone="brand"
          label="Total Cashiers"
          value={String(totalCashiers)}
        />
        <StatCard
          icon={UserCheck}
          tone="positive"
          label="Active Cashiers"
          value={String(activeCount)}
        />
        <StatCard
          icon={Clock}
          tone="warning"
          label="Pending Cashiers"
          value={String(pendingCount)}
        />
        <StatCard
          icon={PauseCircle}
          tone="warning"
          label="Idle Cashiers"
          value={String(idleCount)}
          deltaLabel={`${dormantCount} dormant`}
        />
        <StatCard
          icon={UserX}
          tone="negative"
          label="Blocked Cashiers"
          value={String(blockedCount)}
        />
        <StatCard
          icon={Landmark}
          tone="accent"
          label="Total Float Balance"
          value={formatAmount(totalFloat)}
        />
        <StatCard
          icon={AlertTriangle}
          tone="negative"
          label="Low-Float Cashiers"
          value={String(lowFloatCount)}
          deltaLabel={`Below ${formatAmount(LOW_FLOAT_THRESHOLD)} float`}
        />
        <StatCard
          icon={HandCoins}
          tone="positive"
          label="Total Commission"
          value={formatAmount(totalCommission)}
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
              setStatus(event.target.value as CashierStatus | 'All')
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

          <select
            value={floatHealthFilter}
            onChange={(event) => {
              setFloatHealthFilter(event.target.value as FloatHealthLabel | 'All')
              resetToFirstPage()
            }}
            className="rounded-full border border-transparent bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          >
            {floatHealthOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All float health' : option}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
          >
            <Plus size={16} />
            Create cashier
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">#</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('id')}
                    className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                  >
                    Cashier ID
                    <SortIcon direction={sortKey === 'id' ? sortDir : null} />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('name')}
                    className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                  >
                    Name
                    <SortIcon direction={sortKey === 'name' ? sortDir : null} />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Phone</th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('floatBalance')}
                    className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                  >
                    Float Balance
                    <SortIcon direction={sortKey === 'floatBalance' ? sortDir : null} />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('floatHealth')}
                    className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                  >
                    Float Health
                    <SortIcon direction={sortKey === 'floatHealth' ? sortDir : null} />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('commissionBalance')}
                    className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                  >
                    Commission Balance
                    <SortIcon direction={sortKey === 'commissionBalance' ? sortDir : null} />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('transactions')}
                    className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                  >
                    Transactions
                    <SortIcon direction={sortKey === 'transactions' ? sortDir : null} />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('lastActive')}
                    className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                  >
                    Last Active
                    <SortIcon direction={sortKey === 'lastActive' ? sortDir : null} />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('status')}
                    className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                  >
                    Status
                    <SortIcon direction={sortKey === 'status' ? sortDir : null} />
                  </button>
                </th>
                <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map((cashier, index) => {
                const floatHealth = getFloatHealth(getCashierFloatBalance(cashier))
                const txCount = transactions.filter((tx) => tx.recipientName === cashier.name).length
                const cashierStatus = getCashierStatus(cashier)
                const lastActiveDate = getLastActiveDate(cashier)
                return (
                  <tr
                    key={cashier.id}
                    onClick={() => openCashier(cashier.id)}
                    className="cursor-pointer transition-colors hover:bg-surface"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-muted">
                      {cashier.id}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-medium text-ink">{cashier.name}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-ink/70">{cashier.phone}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink">
                      {formatAmount(getCashierFloatBalance(cashier))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <StatusBadge status={floatHealth.variant} label={floatHealth.label} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink">
                      {formatAmount(cashier.commissionPayable)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          openTransactions(cashier.id)
                        }}
                        className="font-semibold text-brand underline-offset-2 hover:underline"
                      >
                        {txCount} transaction{txCount === 1 ? '' : 's'}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <StatusBadge
                        status={statusVariant[cashierStatus]}
                        label={formatLastActive(lastActiveDate)}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <StatusBadge status={statusVariant[cashierStatus]} label={cashierStatus} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <button
                        type="button"
                        ref={(node) => {
                          menuButtonRefs.current[cashier.id] = node
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleActionMenu(cashier.id)
                        }}
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
                  <td colSpan={11} className="px-6 py-8 text-center text-sm text-muted">
                    No cashiers match your filters.
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
                onClick={() => openCashier(actionMenu.id)}
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
        title="Cashier detail"
        footer={
          selected ? (
            selected.unauthorizedReported ? (
              <button
                type="button"
                onClick={() => requestReportToggle(selected.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-green-200 bg-green-50 py-2.5 text-sm font-semibold text-green-700"
              >
                <ShieldCheck size={16} /> Unblock
              </button>
            ) : (
              <button
                type="button"
                onClick={() => requestReportToggle(selected.id)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700"
              >
                <Ban size={16} /> Block
              </button>
            )
          ) : null
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <UserCog size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-ink">{selected.name}</p>
                <p className="truncate font-mono text-xs text-muted">{selected.id}</p>
              </div>
              {selectedStatus && <StatusBadge status={statusVariant[selectedStatus]} label={selectedStatus} />}
            </div>

            <div className="rounded-xl bg-surface p-4 ring-1 ring-line">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Landmark size={14} /> Assigned Float
              </p>
              <p className="mt-1 text-3xl font-extrabold text-ink">{formatAmount(getCashierFloatBalance(selected))}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Cashier Information
              </p>
              <div className="mt-3 divide-y divide-line rounded-xl ring-1 ring-line">
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Hash size={16} />
                      </span>
                      <p className="text-xs text-muted">Cashier ID</p>
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
                        <HandCoins size={16} />
                      </span>
                      <p className="text-xs text-muted">Commission Account</p>
                    </div>
                    <p className="shrink-0 font-mono text-sm font-semibold text-ink">
                      {selected.commissionAccount}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Landmark size={16} />
                      </span>
                      <p className="text-xs text-muted">Float Account</p>
                    </div>
                    <p className="shrink-0 font-mono text-sm font-semibold text-ink">
                      {selected.floatAccount}
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
                    <p className="shrink-0 text-sm font-semibold text-ink">
                      {formatLastActive(getLastActiveDate(selected))}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          selectedStatus ? statusIconTone[selectedStatus] : ''
                        }`}
                      >
                        {selectedStatus &&
                          (() => {
                            const Icon = statusIcon[selectedStatus]
                            return <Icon size={16} />
                          })()}
                      </span>
                      <p className="text-xs text-muted">Status</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-ink">{selectedStatus}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Receipt size={16} />
                      </span>
                      <p className="text-xs text-muted">Total Transactions</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openTransactions(selected.id)}
                      className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                    >
                      {selectedTransactions.length} transaction{selectedTransactions.length === 1 ? '' : 's'}
                    </button>
                  </div>
                </div>
              </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={!!confirmReport}
        onClose={() => setConfirmReport(null)}
        title={
          <>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                confirmReport?.report ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
              }`}
            >
              {confirmReport?.report ? <Ban size={16} /> : <ShieldCheck size={16} />}
            </span>
            {confirmReport?.report ? 'Block cashier' : 'Unblock cashier'}
          </>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmReport(null)}
              className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmReportToggle}
              className={`flex-1 rounded-full py-2.5 text-sm font-semibold text-white transition-colors ${
                confirmReport?.report ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {confirmReport?.report ? 'Block' : 'Unblock'}
            </button>
          </>
        }
      >
        <p className="text-sm text-ink/80">
          {confirmReport?.report ? (
            <>
              Are you sure you want to block{' '}
              <span className="font-semibold text-ink">{confirmReport?.name}</span>? Their terminal
              access will be blocked immediately.
            </>
          ) : (
            <>
              Are you sure you want to unblock{' '}
              <span className="font-semibold text-ink">{confirmReport?.name}</span>? They will regain
              terminal access immediately.
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
            Delete cashier
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
          remove the cashier and their float wallet assignment. This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
