import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Link } from 'react-router-dom'
import {
  Banknote,
  HandCoins,
  Wallet,
  Download,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  Eye,
  MoreVertical,
  ArrowLeftRight,
  User,
  CreditCard,
  Tag,
  Globe,
  Percent,
  Send,
  UserCog,
  Receipt,
  RotateCcw,
  CirclePlus,
  FileText,
  Landmark,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge from '../../../components/ui/StatusBadge'
import TypeBadge from '../../../components/ui/TypeBadge'
import Drawer from '../../../components/ui/Drawer'
import {
  transactions,
  getAmountTone,
  formatTxDateTime,
  getTotalDeposits,
  getTotalWithdrawals,
  getNetAdjustment,
  getTotalWalletBalance,
} from '../../transactions/data'
import { chartOfAccounts, getAccountBalance, getCustomerBalance, getCashierFloatBalance } from '../../ledger/data'
import { customers } from '../../customers/data'
import { cashiers } from '../../cashiers/data'
import { maskAccount } from '../../../utils/mask'

const txStatusVariant = {
  Successful: 'positive',
  Pending: 'warning',
  Failed: 'negative',
} as const

const typeTone = {
  W2W: 'blue',
  'Cash In': 'green',
  'Cash Out': 'rose',
  W2B: 'rose',
  'Loan Disbursement': 'orange',
  'Loan Repayment': 'amber',
} as const

const txTypeIcon = {
  W2W: Send,
  'Cash In': ArrowDownRight,
  'Cash Out': ArrowUpRight,
  W2B: Landmark,
  'Loan Disbursement': HandCoins,
  'Loan Repayment': HandCoins,
} as const

const recipientLabel = {
  W2W: 'Recipient wallet',
  'Cash In': 'Served by (cashier)',
  'Cash Out': 'Served by (cashier)',
  W2B: 'Bank account',
  'Loan Disbursement': 'Loan account',
  'Loan Repayment': 'Loan account',
} as const

// Types where the recorded counterparty is actually the source of funds (money flows
// INTO the customer's wallet), so the usual customer→recipient direction is reversed.
const incomingTypes = new Set(['Cash In', 'Loan Disbursement'])

const quickActions = [
  { label: 'Top-Up Cashier Float', icon: CirclePlus, tone: 'bg-green-100 text-green-600', to: '/dashboard/cashiers' },
  { label: 'Loan Management', icon: HandCoins, tone: 'bg-orange-100 text-orange-600', to: '/dashboard/loans' },
  { label: 'View Reports', icon: FileText, tone: 'bg-ink text-white', to: null },
] as const

const floatIcon = {
  'Company Equity': Banknote,
  'Customer Wallet': Wallet,
  'Cashier Float': UserCog,
} as const

const RECENT_TRANSACTIONS_PAGE_SIZE = 10

function currency(value: number) {
  return `TSh ${Math.round(value).toLocaleString()}`
}

function escapeCsvCell(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// Cashiers use their float account code (e.g. "FA-384021"), not a phone number, so only
// mask values that actually look like a phone number; masking a float code would just
// mangle it into something unrecognizable.
function displayAccount(value: string) {
  return value.startsWith('+') ? maskAccount(value) : value
}

function getTxFlow(tx: (typeof transactions)[number]) {
  if (incomingTypes.has(tx.type)) {
    return {
      fromName: tx.recipientName ?? tx.customer,
      fromAccount: tx.recipientAccount ?? tx.phone,
      toName: tx.customer,
    }
  }
  return {
    fromName: tx.customer,
    fromAccount: tx.phone,
    toName: tx.recipientName ?? 'N/A',
  }
}

function exportTransactionsCsv(rows: typeof transactions) {
  const header = [
    'Transaction ID',
    'From',
    'Account',
    'Type',
    'To',
    'Channel',
    'Amount',
    'Fee',
    'Status',
    'Date',
  ]
  const lines = [
    header,
    ...rows.map((row) => {
      const { fromName, fromAccount, toName } = getTxFlow(row)
      return [
        row.id,
        fromName,
        fromAccount,
        row.type,
        toName,
        row.channel,
        row.amount.toFixed(2),
        row.fee.toFixed(2),
        row.status,
        row.date,
      ]
    }),
  ]
  const csv = lines.map((line) => line.map(escapeCsvCell).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `recent-financial-transactions-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

interface QuickActionProps {
  action: {
    label: string
    icon: LucideIcon
    tone: string
    to: string | null
  }
}

function ActionRow({ action }: QuickActionProps) {
  const content = (
    <>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${action.tone}`}>
        <action.icon size={18} />
      </span>
      <span className="min-w-0 flex-1 text-sm font-semibold text-ink">{action.label}</span>
      <ChevronRight size={16} className="shrink-0 text-muted" />
    </>
  )

  if (action.to) {
    return (
      <Link
        to={action.to}
        className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:rounded-xl hover:bg-surface"
      >
        {content}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:rounded-xl hover:bg-surface"
    >
      {content}
    </button>
  )
}

export default function Financial() {
  const successfulTransactions = transactions.filter((tx) => tx.status === 'Successful')

  // Same ledger figures as the Company Wallet screen — see features/wallets/pages/CompanyWallet.tsx.
  const balanceOf = (accountId: string) => {
    const account = chartOfAccounts.find((item) => item.id === accountId)
    return account ? getAccountBalance(account) : 0
  }
  // Fee income minus commission expense — the company's own retained earnings, not a wallet
  // balance like the two rows below it. Kept here as "Equity" (matching the Company Wallet
  // page's own terminology) rather than "Company Wallet", since it isn't money anyone's owed.
  const companyEquityBalance = balanceOf('4000') - balanceOf('5000')
  const customerWalletBalance = customers.reduce((sum, c) => sum + getCustomerBalance(c), 0)
  const cashierFloatBalance = cashiers.reduce((sum, c) => sum + getCashierFloatBalance(c), 0)

  const floatRows = [
    { label: 'Company Equity' as const, value: companyEquityBalance },
    { label: 'Customer Wallet' as const, value: customerWalletBalance },
    { label: 'Cashier Float' as const, value: cashierFloatBalance },
  ]

  const [recentPage, setRecentPage] = useState(1)
  const recentTotalPages = Math.max(1, Math.ceil(successfulTransactions.length / RECENT_TRANSACTIONS_PAGE_SIZE))
  const recentTransactions = successfulTransactions.slice(
    (recentPage - 1) * RECENT_TRANSACTIONS_PAGE_SIZE,
    recentPage * RECENT_TRANSACTIONS_PAGE_SIZE,
  )

  const [selectedTxId, setSelectedTxId] = useState<string | null>(null)
  const [txDrawerOpen, setTxDrawerOpen] = useState(false)
  const selectedTx = successfulTransactions.find((tx) => tx.id === selectedTxId) ?? null

  const openTxDetail = (id: string) => {
    setSelectedTxId(id)
    setTxDrawerOpen(true)
  }

  const [actionMenu, setActionMenu] = useState<{ id: string; top: number; left: number } | null>(null)
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Financial Management</h1>
        <p className="mt-1 text-sm text-muted">
          Monitor financial activities, manage float, and track platform settlements.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={Wallet}
          tone="brand"
          label="Net E-Money Movement"
          value={currency(getTotalWalletBalance(transactions))}
        />
        <StatCard
          icon={ArrowDownRight}
          tone="positive"
          label="Total Deposits"
          value={currency(getTotalDeposits(transactions))}
        />
        <StatCard
          icon={ArrowUpRight}
          tone="accent"
          label="Total Withdrawals"
          value={currency(getTotalWithdrawals(transactions))}
        />
        <StatCard
          icon={Banknote}
          tone="warning"
          label="Net Adjustment"
          value={currency(getNetAdjustment(transactions))}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
          <h2 className="text-base font-bold text-ink">Float Management</h2>
          <div className="mt-1 divide-y divide-line">
            {floatRows.map((account) => {
              const Icon = floatIcon[account.label]
              return (
                <div key={account.label} className="flex items-center gap-3 py-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Icon size={18} />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm text-muted">{account.label}</p>
                  <p className="shrink-0 text-sm font-bold text-ink">{currency(account.value)}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
          <h2 className="text-base font-bold text-ink">Quick Actions</h2>
          <div className="mt-3 divide-y divide-line">
            {quickActions.map((action) => (
              <ActionRow key={action.label} action={action} />
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <div className="flex items-center justify-between px-6 py-5">
          <h2 className="text-base font-bold text-ink">Recent Financial Transactions</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => exportTransactionsCsv(successfulTransactions)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-brand ring-1 ring-line transition-colors hover:bg-surface"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-6 py-3 font-semibold">Transaction ID</th>
                <th className="px-6 py-3 font-semibold">From</th>
                <th className="px-6 py-3 font-semibold">Account</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">To</th>
                <th className="px-6 py-3 text-right font-semibold">Amount</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recentTransactions.map((tx, index) => {
                const { fromName, fromAccount, toName } = getTxFlow(tx)
                return (
                  <tr
                    key={tx.id}
                    onClick={() => openTxDetail(tx.id)}
                    className="cursor-pointer transition-colors hover:bg-surface"
                  >
                    <td className="px-6 py-3.5 text-xs text-muted">
                      {(recentPage - 1) * RECENT_TRANSACTIONS_PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-muted">{tx.id}</td>
                    <td className="px-6 py-3.5 font-medium text-ink">{fromName}</td>
                    <td className="px-6 py-3.5 font-mono text-ink/70">{displayAccount(fromAccount)}</td>
                    <td className="px-6 py-3.5">
                      <TypeBadge tone={typeTone[tx.type]} label={tx.type} />
                    </td>
                    <td className="px-6 py-3.5 text-ink/70">{toName}</td>
                    <td className="px-6 py-3.5 text-right font-semibold text-ink">
                      {currency(tx.amount)}
                    </td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={txStatusVariant[tx.status]} label={tx.status} />
                    </td>
                    <td className="px-6 py-3.5 text-ink/70">{formatTxDateTime(tx)}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        ref={(node) => {
                          menuButtonRefs.current[tx.id] = node
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleActionMenu(tx.id)
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
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-line px-6 py-4 text-sm text-muted">
          <span>
            Page {recentPage} of {recentTotalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={recentPage === 1}
              onClick={() => setRecentPage((prev) => Math.max(1, prev - 1))}
              className="rounded-full border border-line px-3 py-1.5 font-medium text-ink/80 transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink/80"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={recentPage === recentTotalPages}
              onClick={() => setRecentPage((prev) => Math.min(recentTotalPages, prev + 1))}
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
                onClick={() => {
                  openTxDetail(actionMenu.id)
                  closeActionMenu()
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-brand hover:text-white"
              >
                <Eye size={14} /> View
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Drawer
        open={txDrawerOpen}
        onClose={() => setTxDrawerOpen(false)}
        title="Transaction detail"
        footer={
          selectedTx ? (
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
        {selectedTx && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <ArrowLeftRight size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">Transaction ID</p>
                <p className="truncate font-mono text-base font-bold text-ink">{selectedTx.id}</p>
              </div>
              <StatusBadge status={txStatusVariant[selectedTx.status]} label={selectedTx.status} />
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
                  <p className="min-w-0 truncate text-sm font-semibold text-ink">{selectedTx.customer}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CreditCard size={16} />
                    </span>
                    <p className="text-xs text-muted">Account Number</p>
                  </div>
                  <p className="shrink-0 truncate font-mono text-sm font-semibold text-ink">
                    {selectedTx.phone}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Wallet size={16} />
                    </span>
                    <p className="text-xs text-muted">Amount</p>
                  </div>
                  <p className={`shrink-0 text-sm font-semibold ${getAmountTone(selectedTx.type)}`}>
                    {currency(selectedTx.amount)}
                  </p>
                </div>
                {selectedTx.recipientName &&
                  (() => {
                    const RecipientIcon = txTypeIcon[selectedTx.type]
                    return (
                      <div className="flex items-center justify-between gap-3 p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                            <RecipientIcon size={16} />
                          </span>
                          <p className="text-xs text-muted">{recipientLabel[selectedTx.type]}</p>
                        </div>
                        <div className="min-w-0 shrink-0 text-right">
                          <p className="truncate text-sm font-semibold text-ink">
                            {selectedTx.recipientName}
                          </p>
                          <p className="truncate font-mono text-xs text-muted">
                            {selectedTx.recipientAccount}
                          </p>
                        </div>
                      </div>
                    )
                  })()}
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Tag size={16} />
                    </span>
                    <p className="text-xs text-muted">Transaction Type</p>
                  </div>
                  <TypeBadge tone={typeTone[selectedTx.type]} label={selectedTx.type} />
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Globe size={16} />
                    </span>
                    <p className="text-xs text-muted">Channel</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{selectedTx.channel}</p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Percent size={16} />
                    </span>
                    <p className="text-xs text-muted">Fee</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">
                    {selectedTx.fee > 0 ? currency(selectedTx.fee) : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <CalendarDays size={16} />
                    </span>
                    <p className="text-xs text-muted">Date &amp; Time</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{formatTxDateTime(selectedTx)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}
