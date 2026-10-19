import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Search,
  Wallet as WalletIcon,
  Landmark,
  CircleCheck,
  ShieldAlert,
  CalendarDays,
  Hash,
  CreditCard,
  Tag,
  Smartphone,
  Banknote,
  Clock,
  Ban,
  ShieldCheck,
  Receipt,
  AlertTriangle,
  User,
  Mail,
  ArrowDownRight,
  ArrowUpRight,
  Send,
  HandCoins,
} from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge from '../../../components/ui/StatusBadge'
import Drawer from '../../../components/ui/Drawer'
import { wallets as initialWallets, type Wallet, type WalletStatus } from '../data'
import { transactions } from '../../transactions/data'
import { customers } from '../../customers/data'
import { getCustomerStatus } from '../../customers/status'
import { maskAccount } from '../../../utils/mask'

const statusVariant = {
  Active: 'positive',
  Frozen: 'warning',
  Blocked: 'negative',
} as const

const statusIconTone = {
  Active: 'bg-green-50 text-green-700',
  Frozen: 'bg-amber-50 text-amber-700',
  Blocked: 'bg-red-50 text-red-700',
} as const

const txStatusVariant = {
  Successful: 'positive',
  Pending: 'warning',
  Failed: 'negative',
} as const

const txTypeIcon = {
  W2W: Send,
  'Cash In': ArrowDownRight,
  'Cash Out': ArrowUpRight,
  'Loan Disbursement': HandCoins,
  'Loan Repayment': HandCoins,
} as const

const statusOptions: Array<WalletStatus | 'All'> = ['All', 'Active', 'Frozen', 'Blocked']

const walletTabs = ['Overview', 'Transactions', 'Owner Details', 'Activity'] as const
type WalletTab = (typeof walletTabs)[number]

const PAGE_SIZE = 10
const TX_PAGE_SIZE = 10

const formatAmount = (value: number) => `TSh ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`

export default function Wallets() {
  const [wallets, setWallets] = useState<Wallet[]>(initialWallets)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<WalletStatus | 'All'>('All')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<WalletTab>('Overview')
  const [txPage, setTxPage] = useState(1)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  const filtered = useMemo(() => {
    return wallets.filter((wallet) => {
      const matchesQuery =
        wallet.holder.toLowerCase().includes(query.toLowerCase()) ||
        wallet.id.toLowerCase().includes(query.toLowerCase()) ||
        wallet.phone.includes(query)
      const matchesStatus = status === 'All' || wallet.status === status
      const matchesDate = !date || wallet.opened === date
      return matchesQuery && matchesStatus && matchesDate
    })
  }, [wallets, query, status, date])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const selected: Wallet | null = wallets.find((wallet) => wallet.id === selectedId) ?? null

  const ownerCustomer = useMemo(
    () => (selected ? customers.find((customer) => customer.name === selected.holder) ?? null : null),
    [selected],
  )

  const walletTransactions = useMemo(
    () => (selected ? transactions.filter((tx) => tx.customer === selected.holder) : []),
    [selected],
  )

  const walletTxTotalPages = Math.max(1, Math.ceil(walletTransactions.length / TX_PAGE_SIZE))
  const walletTxPageItems = walletTransactions.slice(
    (txPage - 1) * TX_PAGE_SIZE,
    txPage * TX_PAGE_SIZE,
  )

  useLayoutEffect(() => {
    const node = tabRefs.current[activeTab]
    if (node) {
      setIndicator({ left: node.offsetLeft, width: node.offsetWidth })
    }
  }, [activeTab, drawerOpen, selectedId])

  useEffect(() => {
    const handleResize = () => {
      const node = tabRefs.current[activeTab]
      if (node) setIndicator({ left: node.offsetLeft, width: node.offsetWidth })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [activeTab])

  const totalWallets = wallets.length
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0)
  const activeCount = wallets.filter((wallet) => wallet.status === 'Active').length
  const restrictedCount = wallets.filter((wallet) => wallet.status !== 'Active').length

  const resetToFirstPage = () => setPage(1)

  const openWallet = (id: string) => {
    setSelectedId(id)
    setActiveTab('Overview')
    setTxPage(1)
    setDrawerOpen(true)
  }

  const toggleFreeze = () => {
    if (!selected || selected.status === 'Blocked') return
    const nextStatus: WalletStatus = selected.status === 'Active' ? 'Frozen' : 'Active'
    setWallets((prev) =>
      prev.map((wallet) => (wallet.id === selected.id ? { ...wallet, status: nextStatus } : wallet)),
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Wallets</h1>
        <p className="mt-1 text-sm text-muted">
          View and manage customer and cashier wallet balances.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={WalletIcon}
          tone="brand"
          label="Total Wallet"
          value={String(totalWallets)}
          delta={5.1}
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
          delta={4.0}
        />
        <StatCard
          icon={ShieldAlert}
          tone="negative"
          label="Restricted Wallet"
          value={String(restrictedCount)}
          delta={-6.2}
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
            placeholder="Search by holder, ID or phone..."
            className="w-full rounded-full border border-transparent bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as WalletStatus | 'All')
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

          <div className="relative">
            <CalendarDays
              size={16}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value)
                resetToFirstPage()
              }}
              className="rounded-full border border-transparent bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">ID</th>
                <th className="px-6 py-3 font-semibold">Wallet ID</th>
                <th className="px-6 py-3 font-semibold">Holder Name</th>
                <th className="px-6 py-3 font-semibold">Account Number</th>
                <th className="px-6 py-3 font-semibold">Wallet Type</th>
                <th className="px-6 py-3 font-semibold">Instrument</th>
                <th className="px-6 py-3 text-right font-semibold">Balance</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Date Created</th>
                <th className="px-6 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map((wallet, index) => (
                <tr key={wallet.id}>
                  <td className="px-6 py-3.5 text-xs text-muted">
                    {(page - 1) * PAGE_SIZE + index + 1}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs text-muted">{wallet.id}</td>
                  <td className="px-6 py-3.5 font-medium text-ink">{wallet.holder}</td>
                  <td className="px-6 py-3.5 font-mono text-ink/70">{maskAccount(wallet.phone)}</td>
                  <td className="px-6 py-3.5 text-ink/70">{wallet.walletType}</td>
                  <td className="px-6 py-3.5 text-ink/70">{wallet.instrument}</td>
                  <td className="px-6 py-3.5 text-right font-semibold text-ink">
                    {formatAmount(wallet.balance)}
                  </td>
                  <td className="px-6 py-3.5">
                    <StatusBadge status={statusVariant[wallet.status]} label={wallet.status} />
                  </td>
                  <td className="px-6 py-3.5 text-ink/70">{wallet.opened}</td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => openWallet(wallet.id)}
                      className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:border-brand"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-sm text-muted">
                    No wallets match your filters.
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

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Wallet detail"
        size="lg"
        footer={
          selected?.status === 'Blocked' ? (
            <button
              type="button"
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              <AlertTriangle size={16} /> Contact Compliance
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={toggleFreeze}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full border py-2.5 text-sm font-semibold ${
                  selected?.status === 'Active'
                    ? 'border-red-200 bg-red-50 text-red-700'
                    : 'border-green-200 bg-green-50 text-green-700'
                }`}
              >
                {selected?.status === 'Active' ? (
                  <>
                    <Ban size={16} /> Freeze wallet
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} /> Unfreeze wallet
                  </>
                )}
              </button>
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
              >
                <Receipt size={16} /> Full history
              </button>
            </>
          )
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <WalletIcon size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-ink">{selected.holder}</p>
                <p className="truncate font-mono text-xs text-muted">{selected.id}</p>
              </div>
              <StatusBadge status={statusVariant[selected.status]} label={selected.status} />
            </div>

            <div className="rounded-xl bg-surface p-4 ring-1 ring-line">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <WalletIcon size={14} /> Current Wallet Balance
              </p>
              <p className="mt-1 text-3xl font-extrabold text-ink">{formatAmount(selected.balance)}</p>
              <p className="mt-1 text-xs text-muted">{selected.currency}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-line">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                  <ArrowDownRight size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted">Total received</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-ink">
                    {formatAmount(selected.totalReceived)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-line">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
                  <ArrowUpRight size={16} />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted">Total sent</p>
                  <p className="mt-0.5 truncate text-sm font-bold text-ink">
                    {formatAmount(selected.totalSent)}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative flex flex-wrap items-center gap-1 rounded-full bg-surface p-1 ring-1 ring-line">
              <span
                className="absolute inset-y-1 rounded-full bg-brand shadow-sm transition-all duration-300 ease-out"
                style={{ left: indicator.left, width: indicator.width }}
              />
              {walletTabs.map((tab) => (
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
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Wallet Information
                  </p>
                  <div className="mt-3 divide-y divide-line rounded-xl ring-1 ring-line">
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <Hash size={16} />
                        </span>
                        <p className="text-xs text-muted">Wallet ID</p>
                      </div>
                      <p className="shrink-0 truncate font-mono text-sm font-semibold text-ink">
                        {selected.id}
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
                        {selected.phone}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <Tag size={16} />
                        </span>
                        <p className="text-xs text-muted">Wallet type</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-ink">{selected.walletType}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <Smartphone size={16} />
                        </span>
                        <p className="text-xs text-muted">Instrument</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-ink">{selected.instrument}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <Banknote size={16} />
                        </span>
                        <p className="text-xs text-muted">Currency</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-ink">{selected.currency}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <CalendarDays size={16} />
                        </span>
                        <p className="text-xs text-muted">Created</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-ink">{selected.opened}</p>
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
                            <CircleCheck size={16} />
                          ) : selected.status === 'Blocked' ? (
                            <Ban size={16} />
                          ) : (
                            <Clock size={16} />
                          )}
                        </span>
                        <p className="text-xs text-muted">Wallet status</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-ink">{selected.status}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Linked card</p>
                  {selected.instrument === 'Physical Card' ? (
                    <div className="mt-3 rounded-2xl bg-gradient-to-br from-ink to-ink/80 p-5 text-white shadow-lg shadow-ink/20">
                      <div className="flex items-center justify-between">
                        <span className="flex h-8 w-10 items-center justify-center rounded-md bg-white/15">
                          <CreditCard size={16} className="text-white/80" />
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
                          {selected.walletType === 'Cashier' ? 'Staff card' : 'Wallet card'}
                        </span>
                      </div>
                      <p className="mt-6 font-mono text-lg tracking-[0.2em]">{selected.cardNumber}</p>
                      <div className="mt-5 flex items-end justify-between text-xs">
                        <div>
                          <p className="text-white/50">Card holder</p>
                          <p className="mt-1 font-semibold uppercase tracking-wide">{selected.holder}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/50">Expires</p>
                          <p className="mt-1 font-semibold">{selected.cardExpiry}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-3 rounded-xl p-4 ring-1 ring-line">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-muted">
                        <CreditCard size={16} />
                      </span>
                      <p className="text-sm text-muted">No physical card issued for this wallet yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'Transactions' && (
              <div>
                <div className="divide-y divide-line rounded-xl ring-1 ring-line">
                  {walletTxPageItems.length === 0 ? (
                    <p className="p-3 text-sm text-muted">No transactions recorded for this wallet yet.</p>
                  ) : (
                    walletTxPageItems.map((tx) => {
                      const TypeIcon = txTypeIcon[tx.type]
                      return (
                        <div key={tx.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                              <TypeIcon size={16} />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-ink">{tx.type}</p>
                              <p className="truncate font-mono text-xs text-muted">
                                {tx.id} · {tx.date}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-semibold text-ink">{formatAmount(tx.amount)}</p>
                            <div className="mt-1">
                              <StatusBadge status={txStatusVariant[tx.status]} label={tx.status} />
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {walletTransactions.length > 0 && (
                  <div className="mt-3 flex items-center justify-between text-sm text-muted">
                    <span>
                      Page {txPage} of {walletTxTotalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={txPage === 1}
                        onClick={() => setTxPage((prev) => Math.max(1, prev - 1))}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink/80 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink/80"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={txPage === walletTxTotalPages}
                        onClick={() => setTxPage((prev) => Math.min(walletTxTotalPages, prev + 1))}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink/80 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink/80"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'Owner Details' && (
              <div className="divide-y divide-line rounded-xl ring-1 ring-line">
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <User size={16} />
                    </span>
                    <p className="text-xs text-muted">Name</p>
                  </div>
                  <p className="min-w-0 truncate text-sm font-semibold text-ink">{selected.holder}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CreditCard size={16} />
                    </span>
                    <p className="text-xs text-muted">Account Number</p>
                  </div>
                  <p className="shrink-0 truncate font-mono text-sm font-semibold text-ink">
                    {selected.phone}
                  </p>
                </div>
                {ownerCustomer ? (
                  <>
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <Mail size={16} />
                        </span>
                        <p className="text-xs text-muted">Email</p>
                      </div>
                      <p className="min-w-0 truncate text-sm font-semibold text-ink">{ownerCustomer.email}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                          <CalendarDays size={16} />
                        </span>
                        <p className="text-xs text-muted">Customer since</p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-ink">{ownerCustomer.joined}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            getCustomerStatus(ownerCustomer) === 'Active'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {getCustomerStatus(ownerCustomer) === 'Active' ? (
                            <CircleCheck size={16} />
                          ) : (
                            <Ban size={16} />
                          )}
                        </span>
                        <p className="text-xs text-muted">Customer status</p>
                      </div>
                      <StatusBadge
                        status={getCustomerStatus(ownerCustomer) === 'Active' ? 'positive' : 'negative'}
                        label={getCustomerStatus(ownerCustomer)}
                      />
                    </div>
                  </>
                ) : (
                  <p className="p-3 text-xs text-muted">
                    {selected.walletType === 'Cashier'
                      ? 'Staff cashier account. Not listed in the customer directory.'
                      : 'No matching customer record found.'}
                  </p>
                )}
              </div>
            )}

            {activeTab === 'Activity' && (
              <div className="divide-y divide-line rounded-xl ring-1 ring-line">
                <div className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
                      <Send size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">W2W</p>
                      <p className="text-xs text-muted">Today · 10:42 AM</p>
                    </div>
                  </div>
                  <p className="shrink-0 font-semibold text-red-600">-TSh 45.00</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                      <ArrowDownRight size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">Wallet top-up</p>
                      <p className="text-xs text-muted">Yesterday · 4:15 PM</p>
                    </div>
                  </div>
                  <p className="shrink-0 font-semibold text-green-700">+TSh 200.00</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3 text-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700">
                      <ArrowUpRight size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">Cash Out</p>
                      <p className="text-xs text-muted">Yesterday · 9:03 AM</p>
                    </div>
                  </div>
                  <p className="shrink-0 font-semibold text-red-600">-TSh 18.50</p>
                </div>
              </div>
            )}

            {selected.status === 'Blocked' && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-700">Blocked by Compliance</p>
                <p className="mt-1 text-xs leading-relaxed text-red-700/80">
                  This wallet is held under an active compliance case and cannot be unblocked from
                  here. Contact the compliance team to review.
                </p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
