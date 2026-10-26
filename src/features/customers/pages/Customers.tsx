import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Search,
  Users,
  Landmark,
  CircleCheck,
  Clock,
  UserX,
  MoreVertical,
  Eye,
  Pencil,
  Ban,
  Wallet,
  CreditCard,
  Mail,
  CalendarDays,
  ArrowUpRight,
  CheckCircle2,
  Receipt,
} from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge from '../../../components/ui/StatusBadge'
import Drawer from '../../../components/ui/Drawer'
import Modal from '../../../components/ui/Modal'
import TransactionHistoryView from '../../../components/ui/TransactionHistoryView'
import SortIcon, { type SortDirection } from '../../../components/ui/SortIcon'
import { customers as initialCustomers, type Customer, type CustomerStatus } from '../data'
import { daysSince, getCustomerStatus, getLastActiveDate } from '../status'
import { transactions, formatTxDateTime } from '../../transactions/data'
import { getCustomerBalance } from '../../ledger/data'
import { maskAccount } from '../../../utils/mask'

const statusVariant = {
  Active: 'positive',
  Dormant: 'info',
  Inactive: 'warning',
} as const

const statusIconTone = {
  Active: 'bg-green-50 text-green-700',
  Dormant: 'bg-purple-50 text-purple-700',
  Inactive: 'bg-amber-50 text-amber-700',
} as const

const statusOptions: Array<CustomerStatus | 'All'> = ['All', 'Active', 'Dormant', 'Inactive']

const PAGE_SIZE = 10

const formatAmount = (value: number) => `TSh ${Math.round(value).toLocaleString()}`

const formatLastActive = (customer: Customer) => {
  const days = daysSince(getLastActiveDate(customer))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')

interface ActionMenuState {
  id: string
  top: number
  left: number
}

type CustomerSortKey = 'name' | 'balance' | 'transactions' | 'lastActive' | 'status'

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<CustomerStatus | 'All'>('All')
  const [sortKey, setSortKey] = useState<CustomerSortKey | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>(null)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null)
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  const [view, setView] = useState<'list' | 'history'>('list')

  const filtered = useMemo(() => {
    const digitsQuery = query.replace(/\D/g, '')
    return customers.filter((customer) => {
      const matchesQuery =
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.id.toLowerCase().includes(query.toLowerCase()) ||
        (digitsQuery.length > 0 && customer.phone.replace(/\D/g, '').includes(digitsQuery))
      const matchesStatus = status === 'All' || getCustomerStatus(customer) === status
      return matchesQuery && matchesStatus
    })
  }, [customers, query, status])

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    const direction = sortDir === 'asc' ? 1 : -1
    const txCountOf = (customer: Customer) =>
      transactions.filter((tx) => tx.customer === customer.name).length
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return a.name.localeCompare(b.name) * direction
        case 'balance':
          return (getCustomerBalance(a) - getCustomerBalance(b)) * direction
        case 'transactions':
          return (txCountOf(a) - txCountOf(b)) * direction
        case 'lastActive':
          return getLastActiveDate(a).localeCompare(getLastActiveDate(b)) * direction
        case 'status':
          return getCustomerStatus(a).localeCompare(getCustomerStatus(b)) * direction
        default:
          return 0
      }
    })
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key: CustomerSortKey) => {
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

  const selected: Customer | null = customers.find((customer) => customer.id === selectedId) ?? null
  const selectedStatus: CustomerStatus | null = selected ? getCustomerStatus(selected) : null

  const selectedTransactions = useMemo(
    () => (selected ? transactions.filter((tx) => tx.customer === selected.name) : []),
    [selected],
  )

  const lastTransaction = useMemo(
    () =>
      selectedTransactions.length === 0
        ? null
        : selectedTransactions.reduce((latest, tx) =>
            `${tx.date} ${tx.time}` > `${latest.date} ${latest.time}` ? tx : latest,
          ),
    [selectedTransactions],
  )

  const totalCustomers = customers.length
  const totalBalance = customers.reduce((sum, customer) => sum + getCustomerBalance(customer), 0)
  const activeCount = customers.filter((customer) => getCustomerStatus(customer) === 'Active').length
  const inactiveCount = customers.filter((customer) => getCustomerStatus(customer) === 'Inactive').length
  const dormantCount = customers.filter((customer) => getCustomerStatus(customer) === 'Dormant').length

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

  const openCustomer = (id: string) => {
    setSelectedId(id)
    setDrawerOpen(true)
    closeActionMenu()
  }

  const openEdit = (id: string) => {
    const customer = customers.find((item) => item.id === id)
    if (!customer) return
    setSelectedId(id)
    setEditName(customer.name)
    setEditEmail(customer.email)
    setEditPhone(customer.phone)
    setEditOpen(true)
    closeActionMenu()
  }

  const openTransactions = (id: string) => {
    setSelectedId(id)
    setView('history')
    setDrawerOpen(false)
    closeActionMenu()
  }

  const backToList = () => setView('list')

  const saveEdit = () => {
    if (!selected) return
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === selected.id
          ? {
              ...customer,
              name: editName.trim() || customer.name,
              email: editEmail.trim() || customer.email,
              phone: editPhone.trim() || customer.phone,
            }
          : customer,
      ),
    )
    setEditOpen(false)
  }

  if (view === 'history' && selected) {
    return (
      <TransactionHistoryView
        subjectName={selected.name}
        subjectPhone={selected.phone}
        statusBadge={selectedStatus ? { variant: statusVariant[selectedStatus], label: selectedStatus } : null}
        onBack={backToList}
        backAriaLabel="Back to customers"
        transactions={selectedTransactions}
        emptyMessage="No transactions recorded for this customer yet."
        showRecipient
      />
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Customers</h1>
        <p className="mt-1 text-sm text-muted">
          Manage customer accounts, balances, and transaction history.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          icon={Users}
          tone="brand"
          label="Total Customer"
          value={String(totalCustomers)}
          delta={6.4}
        />
        <StatCard
          icon={Landmark}
          tone="accent"
          label="Total Wallet Balance"
          value={formatAmount(totalBalance)}
          delta={9.3}
        />
        <StatCard
          icon={CircleCheck}
          tone="positive"
          label="Active Wallet"
          value={String(activeCount)}
          delta={3.8}
        />
        <StatCard
          icon={Clock}
          tone="warning"
          label="Dormant Wallet"
          value={String(dormantCount)}
          delta={1.2}
        />
        <StatCard
          icon={UserX}
          tone="negative"
          label="Inactive Wallet"
          value={String(inactiveCount)}
          delta={-2.5}
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
            placeholder="Search by name, ID or account no..."
            className="w-full rounded-full border border-transparent bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          />
        </div>

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as CustomerStatus | 'All')
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

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-6 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('name')}
                    className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                  >
                    Name
                    <SortIcon direction={sortKey === 'name' ? sortDir : null} />
                  </button>
                </th>
                <th className="px-6 py-3 font-semibold">Account Number</th>
                <th className="px-6 py-3 text-right font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('balance')}
                    className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                  >
                    Balance
                    <SortIcon direction={sortKey === 'balance' ? sortDir : null} />
                  </button>
                </th>
                <th className="px-6 py-3 text-right font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('transactions')}
                    className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                  >
                    Transactions
                    <SortIcon direction={sortKey === 'transactions' ? sortDir : null} />
                  </button>
                </th>
                <th className="px-6 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('lastActive')}
                    className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                  >
                    Last Active
                    <SortIcon direction={sortKey === 'lastActive' ? sortDir : null} />
                  </button>
                </th>
                <th className="px-6 py-3 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggleSort('status')}
                    className="inline-flex items-center gap-1 font-semibold transition-colors hover:text-ink"
                  >
                    Status
                    <SortIcon direction={sortKey === 'status' ? sortDir : null} />
                  </button>
                </th>
                <th className="px-6 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map((customer, index) => {
                const txCount = transactions.filter((tx) => tx.customer === customer.name).length
                const customerStatus = getCustomerStatus(customer)
                return (
                  <tr
                    key={customer.id}
                    onClick={() => openCustomer(customer.id)}
                    className="cursor-pointer transition-colors hover:bg-surface"
                  >
                    <td className="px-6 py-3.5 text-xs text-muted">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-ink">{customer.name}</td>
                    <td className="px-6 py-3.5 font-mono text-ink/70">{maskAccount(customer.phone)}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-ink">
                      {formatAmount(getCustomerBalance(customer))}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          openTransactions(customer.id)
                        }}
                        className="block w-full text-right font-semibold text-brand underline-offset-2 hover:underline"
                      >
                        {txCount} transaction{txCount === 1 ? '' : 's'}
                      </button>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge
                        status={statusVariant[customerStatus]}
                        label={formatLastActive(customer)}
                      />
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={statusVariant[customerStatus]} label={customerStatus} />
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        ref={(node) => {
                          menuButtonRefs.current[customer.id] = node
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleActionMenu(customer.id)
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
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-muted">
                    No customers match your filters.
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
                onClick={() => openCustomer(actionMenu.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-brand hover:text-white"
              >
                <Eye size={14} /> View
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Customer detail"
        footer={
          selected ? (
            <button
              type="button"
              onClick={() => openEdit(selected.id)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              <Pencil size={16} /> Edit customer
            </button>
          ) : null
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-sm font-bold text-brand ring-1 ring-brand/15">
                {initials(selected.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-ink">{selected.name}</p>
              </div>
            </div>

            <div className="rounded-xl bg-surface p-4 ring-1 ring-line">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Wallet size={14} /> Wallet Balance
              </p>
              <p className="mt-1 text-3xl font-extrabold text-ink">{formatAmount(getCustomerBalance(selected))}</p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Overview</p>
              <div className="mt-3 divide-y divide-line rounded-xl ring-1 ring-line">
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CreditCard size={16} />
                    </span>
                    <p className="text-xs text-muted">Account No</p>
                  </div>
                  <p className="shrink-0 truncate font-mono text-sm font-semibold text-ink">
                    {selected.phone}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Mail size={16} />
                    </span>
                    <p className="text-xs text-muted">Email</p>
                  </div>
                  <p className="min-w-0 truncate text-sm font-semibold text-ink">{selected.email}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CalendarDays size={16} />
                    </span>
                    <p className="text-xs text-muted">Join Date</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{selected.joined}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Clock size={16} />
                    </span>
                    <p className="text-xs text-muted">Last Transaction</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">
                    {lastTransaction ? formatTxDateTime(lastTransaction) : 'No transactions yet'}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        statusIconTone[selectedStatus!]
                      }`}
                    >
                      {selectedStatus === 'Active' ? (
                        <CheckCircle2 size={16} />
                      ) : selectedStatus === 'Dormant' ? (
                        <Clock size={16} />
                      ) : (
                        <Ban size={16} />
                      )}
                    </span>
                    <p className="text-xs text-muted">Account status</p>
                  </div>
                  <StatusBadge status={statusVariant[selectedStatus!]} label={selectedStatus!} />
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Receipt size={16} />
                    </span>
                    <p className="text-xs text-muted">Total Transaction Count</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openTransactions(selected.id)}
                    className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
                  >
                    {selectedTransactions.length} transaction{selectedTransactions.length === 1 ? '' : 's'}
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </Drawer>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Pencil size={16} />
            </span>
            Edit customer
          </>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:border-red-600 hover:text-red-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveEdit}
              className="flex-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
            >
              Save changes
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted">Full name</label>
            <input
              type="text"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              className="mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={(event) => setEditEmail(event.target.value)}
              className="mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Account No</label>
            <input
              type="text"
              value={editPhone}
              onChange={(event) => setEditPhone(event.target.value)}
              className="mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
