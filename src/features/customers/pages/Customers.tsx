import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  Search,
  Users,
  UserCheck,
  Clock,
  UserX,
  MoreVertical,
  Eye,
  Pencil,
  Ban,
  ShieldCheck,
  ArrowLeft,
  Wallet,
  CreditCard,
  Mail,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  ChevronRight,
  Send,
  Landmark,
  UserCog,
  Receipt,
  User,
  Tag,
  Globe,
  Percent,
  RotateCcw,
  ArrowLeftRight,
  Banknote,
} from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import TypeBadge from '../../../components/ui/TypeBadge'
import StatusBadge from '../../../components/ui/StatusBadge'
import Drawer from '../../../components/ui/Drawer'
import Modal from '../../../components/ui/Modal'
import { customers as initialCustomers, type Customer, type CustomerStatus } from '../data'
import { transactions, type TxStatus, type TxType } from '../../transactions/data'
import { maskAccount } from '../../../utils/mask'

const statusVariant = {
  Active: 'positive',
  Pending: 'warning',
  Suspended: 'negative',
} as const

const statusIconTone = {
  Active: 'bg-green-50 text-green-700',
  Pending: 'bg-amber-50 text-amber-700',
  Suspended: 'bg-red-50 text-red-700',
} as const

const txStatusVariant = {
  Successful: 'positive',
  Pending: 'warning',
  Failed: 'negative',
} as const

const txTypeIcon = {
  'Wallet Transfer': Send,
  'Bank Transfer': Landmark,
  'Cashier Topup': UserCog,
  Withdraw: Banknote,
} as const

const typeTone = {
  'Wallet Transfer': 'blue',
  'Bank Transfer': 'green',
  'Cashier Topup': 'purple',
  Withdraw: 'rose',
} as const

const statusOptions: Array<CustomerStatus | 'All'> = ['All', 'Active', 'Pending', 'Suspended']
const txStatusOptions: Array<TxStatus | 'All'> = ['All', 'Successful', 'Pending', 'Failed']
const txTypeOptions: Array<TxType | 'All'> = [
  'All',
  'Wallet Transfer',
  'Bank Transfer',
  'Cashier Topup',
  'Withdraw',
]

const PAGE_SIZE = 10
const TX_PAGE_SIZE = 10

const formatAmount = (value: number) => `TSh ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`

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

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<CustomerStatus | 'All'>('All')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editBalance, setEditBalance] = useState('')
  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null)
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [confirmSuspend, setConfirmSuspend] = useState<{ id: string; name: string; suspend: boolean } | null>(
    null,
  )

  const [view, setView] = useState<'list' | 'history'>('list')
  const [txQuery, setTxQuery] = useState('')
  const [txStatus, setTxStatus] = useState<TxStatus | 'All'>('All')
  const [txType, setTxType] = useState<TxType | 'All'>('All')
  const [txPage, setTxPage] = useState(1)
  const [txDetailId, setTxDetailId] = useState<string | null>(null)
  const [txDetailOpen, setTxDetailOpen] = useState(false)

  const filtered = useMemo(() => {
    return customers.filter((customer) => {
      const matchesQuery =
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.id.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone.replace(/\D/g, '').includes(query.replace(/\D/g, ''))
      const matchesStatus = status === 'All' || customer.status === status
      return matchesQuery && matchesStatus
    })
  }, [customers, query, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selected: Customer | null = customers.find((customer) => customer.id === selectedId) ?? null

  const selectedTransactions = useMemo(
    () => (selected ? transactions.filter((tx) => tx.customer === selected.name) : []),
    [selected],
  )

  const selectedTxDetail = useMemo(
    () => (txDetailId ? transactions.find((tx) => tx.id === txDetailId) ?? null : null),
    [txDetailId],
  )

  const openTxDetail = (id: string) => {
    setTxDetailId(id)
    setTxDetailOpen(true)
  }

  const txSummary = useMemo(
    () => ({
      total: selectedTransactions.length,
      successful: selectedTransactions.filter((tx) => tx.status === 'Successful').length,
      pending: selectedTransactions.filter((tx) => tx.status === 'Pending').length,
      failed: selectedTransactions.filter((tx) => tx.status === 'Failed').length,
    }),
    [selectedTransactions],
  )

  const filteredTx = useMemo(() => {
    const q = txQuery.toLowerCase()
    return selectedTransactions.filter((tx) => {
      const matchesQuery = tx.id.toLowerCase().includes(q) || tx.type.toLowerCase().includes(q)
      const matchesStatus = txStatus === 'All' || tx.status === txStatus
      const matchesType = txType === 'All' || tx.type === txType
      return matchesQuery && matchesStatus && matchesType
    })
  }, [selectedTransactions, txQuery, txStatus, txType])

  const txTotalPages = Math.max(1, Math.ceil(filteredTx.length / TX_PAGE_SIZE))
  const txPageItems = filteredTx.slice((txPage - 1) * TX_PAGE_SIZE, txPage * TX_PAGE_SIZE)

  const totalCustomers = customers.length
  const activeCount = customers.filter((customer) => customer.status === 'Active').length
  const pendingCount = customers.filter((customer) => customer.status === 'Pending').length
  const suspendedCount = customers.filter((customer) => customer.status === 'Suspended').length

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
    setEditBalance(String(customer.balance))
    setEditOpen(true)
    closeActionMenu()
  }

  const openTransactions = (id: string) => {
    setSelectedId(id)
    setTxQuery('')
    setTxStatus('All')
    setTxType('All')
    setTxPage(1)
    setView('history')
    setDrawerOpen(false)
    closeActionMenu()
  }

  const backToList = () => setView('list')

  const requestSuspendToggle = (id: string) => {
    const customer = customers.find((item) => item.id === id)
    if (!customer) return
    setConfirmSuspend({ id, name: customer.name, suspend: customer.status !== 'Suspended' })
    closeActionMenu()
  }

  const confirmSuspendToggle = () => {
    if (!confirmSuspend) return
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === confirmSuspend.id
          ? { ...customer, status: confirmSuspend.suspend ? 'Suspended' : 'Active' }
          : customer,
      ),
    )
    setConfirmSuspend(null)
  }

  const setSelectedStatus = (nextStatus: CustomerStatus) => {
    if (!selected) return
    setCustomers((prev) =>
      prev.map((customer) => (customer.id === selected.id ? { ...customer, status: nextStatus } : customer)),
    )
  }

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
              balance: Number(editBalance) || 0,
            }
          : customer,
      ),
    )
    setEditOpen(false)
  }

  if (view === 'history' && selected) {
    return (
      <div className="space-y-5">
        <div className="overflow-hidden bg-white ring-1 ring-line">
          <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={backToList}
                aria-label="Back to customers"
                className="group flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand text-white transition-colors hover:bg-brand/90"
              >
                <ArrowLeft size={18} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
              </button>
              <div>
                <h2 className="text-base font-bold text-ink">Transaction History</h2>
                <p className="mt-0.5 text-xs text-muted">
                  {selected.name} · {selected.phone}
                </p>
              </div>
            </div>
            <StatusBadge status={statusVariant[selected.status]} label={selected.status} />
          </div>

          <div className="grid grid-cols-2 divide-x divide-y divide-line border-b border-line sm:grid-cols-4 sm:divide-y-0">
            <div className="px-6 py-5">
              <p className="text-xs text-muted">Total Transactions</p>
              <p className="mt-1 text-2xl font-extrabold text-ink">{txSummary.total}</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-muted">Successful</p>
              <p className="mt-1 text-2xl font-extrabold text-green-700">{txSummary.successful}</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-muted">Pending</p>
              <p className="mt-1 text-2xl font-extrabold text-amber-600">{txSummary.pending}</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-muted">Failed</p>
              <p className="mt-1 text-2xl font-extrabold text-red-600">{txSummary.failed}</p>
            </div>
          </div>

          <div className="px-6 pt-5">
            <p className="text-sm font-semibold text-ink">Transaction Records</p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:max-w-xs">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="search"
                  value={txQuery}
                  onChange={(event) => {
                    setTxQuery(event.target.value)
                    setTxPage(1)
                  }}
                  placeholder="Search transaction ID or type..."
                  className="w-full rounded-full border border-transparent bg-surface py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
                />
              </div>

              <select
                value={txType}
                onChange={(event) => {
                  setTxType(event.target.value as TxType | 'All')
                  setTxPage(1)
                }}
                className="rounded-full border border-transparent bg-surface px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
              >
                {txTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'All types' : option}
                  </option>
                ))}
              </select>

              <select
                value={txStatus}
                onChange={(event) => {
                  setTxStatus(event.target.value as TxStatus | 'All')
                  setTxPage(1)
                }}
                className="rounded-full border border-transparent bg-surface px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
              >
                {txStatusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'All' ? 'All statuses' : option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-line px-6 py-2">
            {txPageItems.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">
                {selectedTransactions.length === 0
                  ? 'No transactions recorded for this customer yet.'
                  : 'No transactions match your filters.'}
              </p>
            ) : (
              txPageItems.map((tx, index) => {
                const TypeIcon = txTypeIcon[tx.type]
                return (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => openTxDetail(tx.id)}
                    className="flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-surface"
                  >
                    <span className="w-6 shrink-0 text-xs font-medium text-muted">
                      {(txPage - 1) * TX_PAGE_SIZE + index + 1}
                    </span>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <TypeIcon size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-sm font-bold text-ink">{tx.id}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {tx.type} · {tx.date}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-ink">{formatAmount(tx.amount)}</p>
                      <div className="mt-1">
                        <StatusBadge status={txStatusVariant[tx.status]} label={tx.status} />
                      </div>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-muted" />
                  </button>
                )
              })
            )}
          </div>

          <div className="flex items-center justify-between border-t border-line px-6 py-4 text-sm text-muted">
            <span>
              Page {txPage} of {txTotalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={txPage === 1}
                onClick={() => setTxPage((prev) => Math.max(1, prev - 1))}
                className="rounded-full border border-line px-3 py-1.5 font-medium text-ink/80 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink/80"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={txPage === txTotalPages}
                onClick={() => setTxPage((prev) => Math.min(txTotalPages, prev + 1))}
                className="rounded-full border border-line px-3 py-1.5 font-medium text-ink/80 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink/80"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <Drawer
          open={txDetailOpen}
          onClose={() => setTxDetailOpen(false)}
          title="Transaction detail"
          footer={
            selectedTxDetail ? (
              <>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
                >
                  <Receipt size={16} /> Receipt
                </button>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700"
                >
                  <RotateCcw size={16} /> Reverse
                </button>
              </>
            ) : null
          }
        >
          {selectedTxDetail && (
            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                  <ArrowLeftRight size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-base font-bold text-ink">{selectedTxDetail.id}</p>
                </div>
                <StatusBadge
                  status={txStatusVariant[selectedTxDetail.status]}
                  label={selectedTxDetail.status}
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Overview</p>
                <div className="mt-3 divide-y divide-line rounded-xl ring-1 ring-line">
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <User size={16} />
                      </span>
                      <p className="text-xs text-muted">Customer</p>
                    </div>
                    <p className="min-w-0 truncate text-sm font-semibold text-ink">
                      {selectedTxDetail.customer}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <CreditCard size={16} />
                      </span>
                      <p className="text-xs text-muted">Account Number</p>
                    </div>
                    <p className="shrink-0 truncate font-mono text-sm font-semibold text-ink">
                      {selectedTxDetail.phone}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Wallet size={16} />
                      </span>
                      <p className="text-xs text-muted">Amount</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-ink">
                      {formatAmount(selectedTxDetail.amount)}
                    </p>
                  </div>
                  {(selectedTxDetail.type === 'Wallet Transfer' ||
                    selectedTxDetail.type === 'Bank Transfer' ||
                    selectedTxDetail.type === 'Cashier Topup') &&
                    selectedTxDetail.recipientName && (
                      <div className="flex items-center justify-between gap-3 p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                            {selectedTxDetail.type === 'Wallet Transfer' ? (
                              <Send size={16} />
                            ) : selectedTxDetail.type === 'Bank Transfer' ? (
                              <Landmark size={16} />
                            ) : (
                              <UserCog size={16} />
                            )}
                          </span>
                          <p className="text-xs text-muted">
                            {selectedTxDetail.type === 'Wallet Transfer'
                              ? 'Recipient wallet'
                              : selectedTxDetail.type === 'Bank Transfer'
                                ? 'Recipient bank'
                                : 'Topped up by (cashier)'}
                          </p>
                        </div>
                        <div className="min-w-0 shrink-0 text-right">
                          <p className="truncate text-sm font-semibold text-ink">
                            {selectedTxDetail.recipientName}
                          </p>
                          <p className="truncate font-mono text-xs text-muted">
                            {selectedTxDetail.recipientAccount}
                          </p>
                        </div>
                      </div>
                    )}
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Tag size={16} />
                      </span>
                      <p className="text-xs text-muted">Type</p>
                    </div>
                    <TypeBadge tone={typeTone[selectedTxDetail.type]} label={selectedTxDetail.type} />
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Globe size={16} />
                      </span>
                      <p className="text-xs text-muted">Channel</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-ink">{selectedTxDetail.channel}</p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Percent size={16} />
                      </span>
                      <p className="text-xs text-muted">Fee</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-ink">
                      {selectedTxDetail.fee > 0 ? formatAmount(selectedTxDetail.fee) : 'N/A'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <CalendarDays size={16} />
                      </span>
                      <p className="text-xs text-muted">Date</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-ink">{selectedTxDetail.date}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-line pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Ledger entries</p>
                <div className="mt-3 divide-y divide-line rounded-xl ring-1 ring-line">
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
                        <ArrowUpRight size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">Debit</p>
                        <p className="truncate text-xs text-muted">{selectedTxDetail.customer} wallet</p>
                      </div>
                    </div>
                    <p className="shrink-0 font-mono text-sm font-semibold text-red-600">
                      -{formatAmount(selectedTxDetail.amount)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                        <ArrowDownRight size={16} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">Credit</p>
                        <p className="truncate text-xs text-muted">Fee income account</p>
                      </div>
                    </div>
                    <p className="shrink-0 font-mono text-sm font-semibold text-green-700">
                      +{selectedTxDetail.fee > 0 ? formatAmount(selectedTxDetail.fee) : 'TSh 0.00'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Drawer>
      </div>
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Users}
          tone="brand"
          label="Total Customer"
          value={String(totalCustomers)}
          delta={6.4}
        />
        <StatCard
          icon={UserCheck}
          tone="positive"
          label="Active Customer"
          value={String(activeCount)}
          delta={3.8}
        />
        <StatCard
          icon={Clock}
          tone="warning"
          label="Pending Customer"
          value={String(pendingCount)}
          delta={1.2}
        />
        <StatCard
          icon={UserX}
          tone="negative"
          label="Suspended Customer"
          value={String(suspendedCount)}
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
                <th className="px-6 py-3 font-semibold">ID</th>
                <th className="px-6 py-3 font-semibold">Customer ID</th>
                <th className="px-6 py-3 font-semibold">Customer Name</th>
                <th className="px-6 py-3 font-semibold">Account No</th>
                <th className="px-6 py-3 text-right font-semibold">Wallet Balance</th>
                <th className="px-6 py-3 text-right font-semibold">Transactions</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Join Date</th>
                <th className="px-6 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map((customer, index) => {
                const txCount = transactions.filter((tx) => tx.customer === customer.name).length
                return (
                  <tr key={customer.id}>
                    <td className="px-6 py-3.5 text-xs text-muted">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-muted">{customer.id}</td>
                    <td className="px-6 py-3.5 font-medium text-ink">{customer.name}</td>
                    <td className="px-6 py-3.5 font-mono text-ink/70">{maskAccount(customer.phone)}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-ink">
                      {formatAmount(customer.balance)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openTransactions(customer.id)}
                        className="block w-full text-right font-semibold text-brand underline-offset-2 hover:underline"
                      >
                        {txCount} transaction{txCount === 1 ? '' : 's'}
                      </button>
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={statusVariant[customer.status]} label={customer.status} />
                    </td>
                    <td className="px-6 py-3.5 text-ink/70">{customer.joined}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        ref={(node) => {
                          menuButtonRefs.current[customer.id] = node
                        }}
                        onClick={() => toggleActionMenu(customer.id)}
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
                  <td colSpan={9} className="px-6 py-8 text-center text-sm text-muted">
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
              <button
                type="button"
                onClick={() => openEdit(actionMenu.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-brand hover:text-white"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                type="button"
                onClick={() => requestSuspendToggle(actionMenu.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-red-600 transition-colors hover:bg-red-600 hover:text-white"
              >
                {customers.find((customer) => customer.id === actionMenu.id)?.status === 'Suspended' ? (
                  <>
                    <ShieldCheck size={14} /> Reactivate
                  </>
                ) : (
                  <>
                    <Ban size={14} /> Suspend
                  </>
                )}
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
            selected.status === 'Pending' ? (
              <button
                type="button"
                onClick={() => setSelectedStatus('Active')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-green-200 bg-green-50 py-2.5 text-sm font-semibold text-green-700"
              >
                <CheckCircle2 size={16} /> Approve customer
              </button>
            ) : selected.status === 'Active' ? (
              <button
                type="button"
                onClick={() => setSelectedStatus('Suspended')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700"
              >
                <Ban size={16} /> Suspend customer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSelectedStatus('Active')}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-green-200 bg-green-50 py-2.5 text-sm font-semibold text-green-700"
              >
                <ShieldCheck size={16} /> Reactivate customer
              </button>
            )
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
                <p className="truncate font-mono text-xs text-muted">{selected.id}</p>
              </div>
              <StatusBadge status={statusVariant[selected.status]} label={selected.status} />
            </div>

            <div className="rounded-xl bg-surface p-4 ring-1 ring-line">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Wallet size={14} /> Wallet Balance
              </p>
              <p className="mt-1 text-3xl font-extrabold text-ink">{formatAmount(selected.balance)}</p>
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
                    <p className="text-xs text-muted">Join date</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{selected.joined}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                        statusIconTone[selected.status]
                      }`}
                    >
                      {selected.status === 'Active' ? (
                        <CheckCircle2 size={16} />
                      ) : selected.status === 'Suspended' ? (
                        <Ban size={16} />
                      ) : (
                        <Clock size={16} />
                      )}
                    </span>
                    <p className="text-xs text-muted">Account status</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{selected.status}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-line pt-4">
              <button
                type="button"
                onClick={() => openTransactions(selected.id)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
              >
                View full transaction history ({selectedTransactions.length})
                <ArrowUpRight size={14} />
              </button>
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
          <div>
            <label className="text-xs font-medium text-muted">Wallet balance</label>
            <input
              type="number"
              step="0.01"
              value={editBalance}
              onChange={(event) => setEditBalance(event.target.value)}
              className="mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand"
            />
          </div>
        </div>
      </Modal>

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
            {confirmSuspend?.suspend ? 'Suspend customer' : 'Reactivate customer'}
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
              Are you sure you want to suspend <span className="font-semibold text-ink">{confirmSuspend?.name}</span>?
              They will lose access to their wallet until reactivated.
            </>
          ) : (
            <>
              Are you sure you want to reactivate{' '}
              <span className="font-semibold text-ink">{confirmSuspend?.name}</span>? Their wallet access will be
              restored immediately.
            </>
          )}
        </p>
      </Modal>
    </div>
  )
}
