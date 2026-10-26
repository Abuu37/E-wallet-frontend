import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Search,
  HandCoins,
  Wallet,
  CircleCheck,
  AlertTriangle,
  MoreVertical,
  Eye,
  CheckCircle2,
  Hash,
  Phone,
  Percent,
  CalendarDays,
  UserCog,
  Tag,
  Plus,
} from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge from '../../../components/ui/StatusBadge'
import Drawer from '../../../components/ui/Drawer'
import Modal from '../../../components/ui/Modal'
import LoanApplicationForm, { type LoanApplicationResult } from './LoanApplicationForm'
import { loans as initialLoans, type Loan, type LoanStatus } from '../data'

const statusVariant = {
  Active: 'positive',
  Overdue: 'warning',
  Paid: 'neutral',
} as const

const statusOptions: Array<LoanStatus | 'All'> = ['All', 'Active', 'Overdue', 'Paid']

const PAGE_SIZE = 10

const formatAmount = (value: number) => `TSh ${Math.round(value).toLocaleString()}`

function addMonths(dateStr: string, months: number) {
  const date = new Date(dateStr)
  date.setMonth(date.getMonth() + months)
  return date.toISOString().slice(0, 10)
}

interface ActionMenuState {
  id: string
  top: number
  left: number
}

interface ConfirmAction {
  id: string
  name: string
}

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>(initialLoans)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<LoanStatus | 'All'>('All')
  const [dueDateFrom, setDueDateFrom] = useState('')
  const [dueDateTo, setDueDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null)
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null)
  const [view, setView] = useState<'list' | 'form'>('list')

  const filtered = useMemo(() => {
    const digitsQuery = query.replace(/\D/g, '')
    return loans.filter((loan) => {
      const matchesQuery =
        loan.customer.toLowerCase().includes(query.toLowerCase()) ||
        loan.id.toLowerCase().includes(query.toLowerCase()) ||
        (digitsQuery.length > 0 && loan.phone.replace(/\D/g, '').includes(digitsQuery))
      const matchesStatus = status === 'All' || loan.status === status
      const matchesDate =
        (!dueDateFrom || loan.dueDate >= dueDateFrom) && (!dueDateTo || loan.dueDate <= dueDateTo)
      return matchesQuery && matchesStatus && matchesDate
    })
  }, [loans, query, status, dueDateFrom, dueDateTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selected: Loan | null = loans.find((loan) => loan.id === selectedId) ?? null

  const totalDisbursed = loans.reduce((sum, loan) => sum + loan.principal, 0)
  const totalOutstanding = loans.reduce((sum, loan) => sum + loan.outstanding, 0)
  const activeCount = loans.filter((loan) => loan.status === 'Active').length
  const overdueCount = loans.filter((loan) => loan.status === 'Overdue').length

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

  const openLoan = (id: string) => {
    setSelectedId(id)
    setDrawerOpen(true)
    closeActionMenu()
  }

  const requestMarkRepaid = (id: string) => {
    const loan = loans.find((item) => item.id === id)
    if (!loan) return
    setConfirmAction({ id, name: loan.customer })
    closeActionMenu()
  }

  const confirmActionHandler = () => {
    if (!confirmAction) return
    setLoans((prev) =>
      prev.map((loan) =>
        loan.id === confirmAction.id ? { ...loan, status: 'Paid', outstanding: 0 } : loan,
      ),
    )
    setConfirmAction(null)
  }

  const nextLoanId = () => {
    const nextNumber = Math.max(0, ...loans.map((loan) => Number(loan.id.replace('LN-', '')) || 0)) + 1
    return `LN-${nextNumber}`
  }

  const openCreate = () => setView('form')
  const backToList = () => setView('list')

  const handleApplicationSubmit = (application: LoanApplicationResult) => {
    const today = new Date().toISOString().slice(0, 10)
    const newLoan: Loan = {
      id: nextLoanId(),
      customer: application.fullName,
      phone: application.phone,
      principal: application.tier.amount,
      interestRate: application.tier.interestRate,
      outstanding: application.tier.amount,
      status: 'Active',
      disbursedDate: today,
      dueDate: addMonths(today, application.tier.lifespanMonths),
      officer: 'Pending Assignment',
    }
    setLoans((prev) => [newLoan, ...prev])
    setView('list')
  }

  if (view === 'form') {
    return <LoanApplicationForm onCancel={backToList} onSubmit={handleApplicationSubmit} />
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Loans</h1>
          <p className="mt-1 text-sm text-muted">
            Track loan disbursements, outstanding principal, and repayment status.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
        >
          <Plus size={16} />
          Apply Loan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={HandCoins}
          tone="brand"
          label="Total Disbursed"
          value={formatAmount(totalDisbursed)}
        />
        <StatCard
          icon={Wallet}
          tone="accent"
          label="Outstanding"
          value={formatAmount(totalOutstanding)}
        />
        <StatCard
          icon={CircleCheck}
          tone="positive"
          label="Active Loans"
          value={String(activeCount)}
        />
        <StatCard
          icon={AlertTriangle}
          tone="negative"
          label="Overdue Loans"
          value={String(overdueCount)}
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
            placeholder="Search by customer, loan ID or phone..."
            className="w-full rounded-full border border-transparent bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 ring-1 ring-line">
            <CalendarDays size={16} className="shrink-0 text-muted" />
            <input
              type="date"
              value={dueDateFrom}
              max={dueDateTo || undefined}
              onChange={(event) => {
                setDueDateFrom(event.target.value)
                resetToFirstPage()
              }}
              className="w-32.5 bg-transparent text-sm text-ink outline-none"
            />
            <span className="text-muted">-</span>
            <input
              type="date"
              value={dueDateTo}
              min={dueDateFrom || undefined}
              onChange={(event) => {
                setDueDateTo(event.target.value)
                resetToFirstPage()
              }}
              className="w-32.5 bg-transparent text-sm text-ink outline-none"
            />
          </div>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as LoanStatus | 'All')
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
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-6 py-3 font-semibold">Loan ID</th>
                <th className="px-6 py-3 font-semibold">Customer</th>
                <th className="px-6 py-3 text-right font-semibold">Principal</th>
                <th className="px-6 py-3 text-right font-semibold">Outstanding</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Due date</th>
                <th className="px-6 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map((loan, index) => (
                <tr key={loan.id}>
                  <td className="px-6 py-3.5 text-xs text-muted">
                    {(page - 1) * PAGE_SIZE + index + 1}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-muted">{loan.id}</td>
                  <td className="px-6 py-3.5 font-medium text-ink">{loan.customer}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-ink">
                    {formatAmount(loan.principal)}
                  </td>
                  <td className="px-6 py-3.5 text-right text-ink/70">{formatAmount(loan.outstanding)}</td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={statusVariant[loan.status]} label={loan.status} />
                  </td>
                  <td className="px-6 py-3.5 text-ink/70">{loan.dueDate}</td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      type="button"
                      ref={(node) => {
                        menuButtonRefs.current[loan.id] = node
                      }}
                      onClick={() => toggleActionMenu(loan.id)}
                      aria-label="Row actions"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink/80 transition-colors hover:border-brand hover:bg-brand hover:text-white"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-muted">
                    No loans match your filters.
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
              className="fixed z-50 w-44 origin-top-right overflow-hidden rounded-xl bg-white py-1 shadow-xl ring-1 ring-line"
              style={{ top: actionMenu.top, left: actionMenu.left }}
            >
              <button
                type="button"
                onClick={() => openLoan(actionMenu.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-brand hover:text-white"
              >
                <Eye size={14} /> View
              </button>
              {(() => {
                const loan = loans.find((item) => item.id === actionMenu.id)
                if (!loan) return null
                return (
                  (loan.status === 'Active' || loan.status === 'Overdue') && (
                    <button
                      type="button"
                      onClick={() => requestMarkRepaid(actionMenu.id)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-green-700 transition-colors hover:bg-green-600 hover:text-white"
                    >
                      <CheckCircle2 size={14} /> Mark as paid
                    </button>
                  )
                )
              })()}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Loan detail"
        footer={
          selected && (selected.status === 'Active' || selected.status === 'Overdue') ? (
            <button
              type="button"
              onClick={() => requestMarkRepaid(selected.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-green-200 bg-green-50 py-2.5 text-sm font-semibold text-green-700"
            >
              <CheckCircle2 size={16} /> Mark as paid
            </button>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <HandCoins size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-ink">{selected.customer}</p>
                <p className="truncate font-mono text-xs text-muted">{selected.id}</p>
              </div>
              <StatusBadge status={statusVariant[selected.status]} label={selected.status} />
            </div>

            <div className="rounded-xl bg-surface p-4 ring-1 ring-line">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Wallet size={14} /> Principal
              </p>
              <p className="mt-1 text-3xl font-extrabold text-ink">{formatAmount(selected.principal)}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-brand"
                  style={{
                    width: `${Math.round(
                      ((selected.principal - selected.outstanding) / selected.principal) * 100,
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-muted">
                {formatAmount(selected.principal - selected.outstanding)} paid of{' '}
                {formatAmount(selected.principal)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Loan Information</p>
              <div className="mt-3 divide-y divide-line rounded-xl ring-1 ring-line">
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Hash size={16} />
                    </span>
                    <p className="text-xs text-muted">Loan ID</p>
                  </div>
                  <p className="shrink-0 truncate font-mono text-sm font-semibold text-ink">{selected.id}</p>
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
                      <Percent size={16} />
                    </span>
                    <p className="text-xs text-muted">Interest Rate</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{selected.interestRate}%</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Wallet size={16} />
                    </span>
                    <p className="text-xs text-muted">Outstanding Balance</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">
                    {formatAmount(selected.outstanding)}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <UserCog size={16} />
                    </span>
                    <p className="text-xs text-muted">Loan Officer</p>
                  </div>
                  <p className="shrink-0 truncate text-sm font-semibold text-ink">{selected.officer}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CalendarDays size={16} />
                    </span>
                    <p className="text-xs text-muted">Disbursed Date</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{selected.disbursedDate}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CalendarDays size={16} />
                    </span>
                    <p className="text-xs text-muted">Due date</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{selected.dueDate}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Tag size={16} />
                    </span>
                    <p className="text-xs text-muted">Status</p>
                  </div>
                  <StatusBadge status={statusVariant[selected.status]} label={selected.status} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-700">
              <CheckCircle2 size={16} />
            </span>
            Mark loan as paid
          </>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmActionHandler}
              className="flex-1 rounded-full bg-green-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700"
            >
              Mark as paid
            </button>
          </>
        }
      >
        <p className="text-sm text-ink/80">
          Are you sure you want to mark{' '}
          <span className="font-semibold text-ink">{confirmAction?.name}</span>&apos;s loan as fully
          paid? The outstanding balance will be cleared to zero.
        </p>
      </Modal>
    </div>
  )
}
