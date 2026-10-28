import { useMemo, useState } from 'react'
import {
  Pencil,
  Search,
  Plus,
  Wallet,
  TrendingUp,
  HandCoins,
  Hash,
  Settings,
  CheckCircle2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import TypeBadge from '../../../components/ui/TypeBadge'
import Modal from '../../../components/ui/Modal'
import {
  feeTiers as initialFeeTiers,
  feeOverviewStats,
  type FeeTier,
  type FeeApplyType,
  type TransactionType,
} from '../data'

type TileTone = 'brand' | 'positive' | 'accent' | 'warning'

const tileToneStyles: Record<TileTone, string> = {
  brand: 'bg-brand/10 text-brand',
  accent: 'bg-accent/10 text-accent',
  positive: 'bg-positive/10 text-positive',
  warning: 'bg-amber-50 text-amber-700',
}

interface StatTileProps {
  icon: LucideIcon
  tone: TileTone
  label: string
  value: string
  statusIcon: LucideIcon
  statusText: string
}

function StatTile({ icon: Icon, tone, label, value, statusIcon: StatusIcon, statusText }: StatTileProps) {
  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tileToneStyles[tone]}`}>
          <Icon size={18} />
        </span>
        <p className="truncate text-sm font-semibold text-ink/80">{label}</p>
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-ink">{value}</p>
      <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
        <StatusIcon size={12} />
        {statusText}
      </span>
    </div>
  )
}

const transactionTypeTone = {
  'Cash In': 'green',
  'Cash Out': 'rose',
  W2W: 'blue',
  W2B: 'rose',
} as const

const transactionTypeOptions: TransactionType[] = ['Cash In', 'Cash Out', 'W2W', 'W2B']
const transactionTypeFilterOptions: Array<TransactionType | 'All'> = ['All', ...transactionTypeOptions]

const formatAmount = (value: number) =>
  `${value < 0 ? '−' : ''}TSh ${Math.round(Math.abs(value)).toLocaleString()}`
const formatRange = (min: number, max: number) => `${formatAmount(min)} – ${formatAmount(max)}`

const SHARE_RATE = 0.5
const PAGE_SIZE = 10

export default function Fees() {
  const [feeTiers, setFeeTiers] = useState<FeeTier[]>(initialFeeTiers)
  const [query, setQuery] = useState('')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionType | 'All'>('All')
  const [page, setPage] = useState(1)

  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editType, setEditType] = useState<FeeApplyType>('Flat')
  const [editTransactionType, setEditTransactionType] = useState<TransactionType>('Cash In')
  const [editRangeMin, setEditRangeMin] = useState('')
  const [editRangeMax, setEditRangeMax] = useState('')
  const [editCustomerFee, setEditCustomerFee] = useState('')

  const filtered = useMemo(() => {
    return feeTiers.filter((tier) => {
      const matchesQuery =
        tier.transactionType.toLowerCase().includes(query.toLowerCase()) ||
        tier.type.toLowerCase().includes(query.toLowerCase()) ||
        formatRange(tier.rangeMin, tier.rangeMax).includes(query)
      const matchesTransactionType =
        transactionTypeFilter === 'All' || tier.transactionType === transactionTypeFilter
      return matchesQuery && matchesTransactionType
    })
  }, [feeTiers, query, transactionTypeFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const resetToFirstPage = () => setPage(1)

  const averageFeePerTransaction = feeTiers.length
    ? Math.round(feeTiers.reduce((sum, tier) => sum + tier.customerFee, 0) / feeTiers.length)
    : 0

  const nextTierId = () => {
    const nextNumber = Math.max(0, ...feeTiers.map((tier) => Number(tier.id.replace('TIER-', '')) || 0)) + 1
    return `TIER-${nextNumber}`
  }

  const openCreate = () => {
    setFormMode('create')
    setEditId(null)
    setEditType('Flat')
    setEditTransactionType('Cash In')
    setEditRangeMin('')
    setEditRangeMax('')
    setEditCustomerFee('')
  }

  const openEdit = (tier: FeeTier) => {
    setFormMode('edit')
    setEditId(tier.id)
    setEditType(tier.type)
    setEditTransactionType(tier.transactionType)
    setEditRangeMin(String(tier.rangeMin))
    setEditRangeMax(String(tier.rangeMax))
    setEditCustomerFee(String(tier.customerFee))
  }

  const closeForm = () => {
    setFormMode(null)
    setEditId(null)
  }

  const saveForm = () => {
    if (formMode === 'edit' && editId) {
      setFeeTiers((prev) =>
        prev.map((tier) =>
          tier.id === editId
            ? {
                ...tier,
                type: editType,
                transactionType: editTransactionType,
                rangeMin: Number(editRangeMin) || tier.rangeMin,
                rangeMax: Number(editRangeMax) || tier.rangeMax,
                customerFee: Number(editCustomerFee) || tier.customerFee,
              }
            : tier,
        ),
      )
    } else if (formMode === 'create') {
      const newTier: FeeTier = {
        id: nextTierId(),
        type: editType,
        transactionType: editTransactionType,
        rangeMin: Number(editRangeMin) || 0,
        rangeMax: Number(editRangeMax) || 0,
        customerFee: Number(editCustomerFee) || 0,
      }
      setFeeTiers((prev) => [newTier, ...prev])
      resetToFirstPage()
    }
    closeForm()
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Fees</h1>
          <p className="mt-1 text-sm text-muted">
            Configure the flat fee schedule charged to customers by transaction type and amount range.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
        >
          <Plus size={16} />
          Create New Fee
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatTile
          icon={Wallet}
          tone="brand"
          label="Total Revenue Generated"
          value={formatAmount(feeOverviewStats.totalFeeRevenue)}
          statusIcon={TrendingUp}
          statusText={`+${feeOverviewStats.totalFeeRevenueDelta}% vs last month`}
        />
        <StatTile
          icon={HandCoins}
          tone="accent"
          label="Average Fee per Transaction"
          value={formatAmount(averageFeePerTransaction)}
          statusIcon={Hash}
          statusText={`Across ${feeTiers.length} fee rules`}
        />
        <StatTile
          icon={Settings}
          tone="warning"
          label="Active Rules"
          value={`${feeTiers.length} Rules Configured`}
          statusIcon={CheckCircle2}
          statusText="All Systems Normal"
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
            placeholder="Search by transaction type, fee type or range..."
            className="w-full rounded-full border border-transparent bg-white py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          />
        </div>

        <select
          value={transactionTypeFilter}
          onChange={(event) => {
            setTransactionTypeFilter(event.target.value as TransactionType | 'All')
            resetToFirstPage()
          }}
          className="rounded-full border border-transparent bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
        >
          {transactionTypeFilterOptions.map((option) => (
            <option key={option} value={option}>
              {option === 'All' ? 'All transaction types' : option}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
        <div className="border-b border-line px-6 py-3 text-xs text-muted">
          <span className="font-semibold text-ink/70">W2W</span> = Wallet-to-Wallet ·{' '}
          <span className="font-semibold text-ink/70">W2B</span> = Wallet-to-Bank
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">#</th>
                <th className="px-6 py-3 font-semibold">Transaction Type</th>
                <th className="px-6 py-3 font-semibold">Range</th>
                <th className="px-6 py-3 text-right font-semibold">Customer Fee</th>
                <th className="px-6 py-3 text-right font-semibold">Agent Share</th>
                <th className="px-6 py-3 text-right font-semibold">Company Earns</th>
                <th className="px-6 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map((tier, index) => {
                const isCashIn = tier.transactionType === 'Cash In'
                // Only Cash In/Cash Out go through a cashier — W2W and W2B are self-service, so
                // there's no agent to split the fee with (see rolePermissions.ts).
                const isCashierServed = isCashIn || tier.transactionType === 'Cash Out'
                return (
                  <tr key={tier.id}>
                    <td className="px-6 py-3.5 text-xs text-muted">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="px-6 py-3.5">
                      <TypeBadge tone={transactionTypeTone[tier.transactionType]} label={tier.transactionType} />
                    </td>
                    <td className="px-6 py-3.5 tabular-nums text-ink/70">
                      {formatRange(tier.rangeMin, tier.rangeMax)}
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums">
                      {isCashIn ? (
                        <span className="text-muted">Free</span>
                      ) : (
                        <span className="font-semibold text-ink">{formatAmount(tier.customerFee)}</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right tabular-nums text-ink/70">
                      {isCashIn && <>{formatAmount(tier.customerFee)}</>}
                      {!isCashIn && isCashierServed && <>{formatAmount(tier.customerFee * SHARE_RATE)}</>}
                      {!isCashierServed && <span className="text-muted">No agent</span>}
                    </td>
                    <td
                      className={`px-6 py-3.5 text-right tabular-nums ${isCashIn ? 'text-red-500' : 'text-ink/70'}`}
                    >
                      {formatAmount(
                        isCashIn
                          ? -tier.customerFee
                          : isCashierServed
                            ? tier.customerFee * SHARE_RATE
                            : tier.customerFee,
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(tier)}
                        aria-label="Edit fee tier"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink/80 transition-colors hover:border-brand hover:bg-brand hover:text-white"
                      >
                        <Pencil size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted">
                    No fee tiers match your filters.
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

      <Modal
        open={formMode !== null}
        onClose={closeForm}
        title={
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              {formMode === 'create' ? <Plus size={16} /> : <Pencil size={16} />}
            </span>
            {formMode === 'create' ? 'Create New Fee' : 'Edit Fee Tier'}
          </>
        }
        footer={
          <>
            <button
              type="button"
              onClick={closeForm}
              className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveForm}
              className="flex-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
            >
              {formMode === 'create' ? 'Create Fee' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted">Transaction Type</label>
            <select
              value={editTransactionType}
              onChange={(event) => setEditTransactionType(event.target.value as TransactionType)}
              className="mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand"
            >
              {transactionTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted">Range Min</label>
              <input
                type="number"
                value={editRangeMin}
                onChange={(event) => setEditRangeMin(event.target.value)}
                className="mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted">Range Max</label>
              <input
                type="number"
                value={editRangeMax}
                onChange={(event) => setEditRangeMax(event.target.value)}
                className="mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">
              {editTransactionType === 'Cash In' ? 'Agent Commission' : 'Customer Fee'}
            </label>
            <input
              type="number"
              value={editCustomerFee}
              onChange={(event) => setEditCustomerFee(event.target.value)}
              className="mt-1 w-full rounded-xl border border-transparent bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 ring-line focus:border-brand"
            />
          </div>
        </div>
      </Modal>
    </div>
  )
}
