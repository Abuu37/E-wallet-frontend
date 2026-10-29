import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import Swal from 'sweetalert2'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
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
  MoreVertical,
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

interface FeeFormValues {
  type: FeeApplyType
  transactionType: TransactionType
  rangeMin: string
  rangeMax: string
  customerFee: string
}

const blankFeeForm: FeeFormValues = {
  type: 'Flat',
  transactionType: 'Cash In',
  rangeMin: '',
  rangeMax: '',
  customerFee: '',
}

const feeFormSchema = Yup.object({
  transactionType: Yup.mixed<TransactionType>().oneOf(transactionTypeOptions).required(),
  rangeMin: Yup.number()
    .typeError('Enter a valid number')
    .min(0, 'Must be 0 or more')
    .required('Range Min is required'),
  rangeMax: Yup.number()
    .typeError('Enter a valid number')
    .moreThan(Yup.ref('rangeMin'), 'Range Max must be greater than Range Min')
    .required('Range Max is required'),
  customerFee: Yup.number().typeError('Enter a valid number').min(0, 'Must be 0 or more').required('Required'),
})

const getFieldClass = (hasError: boolean) =>
  `mt-1 w-full rounded-xl border bg-surface px-3.5 py-2.5 text-sm outline-none ring-1 transition-colors focus:border-brand ${
    hasError ? 'border-red-400 ring-red-300' : 'border-transparent ring-line'
  }`
const errorClass = 'mt-1 text-xs font-medium text-red-600'

export default function Fees() {
  const [feeTiers, setFeeTiers] = useState<FeeTier[]>(initialFeeTiers)
  const [query, setQuery] = useState('')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<TransactionType | 'All'>('All')
  const [page, setPage] = useState(1)

  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [formInitialValues, setFormInitialValues] = useState<FeeFormValues>(blankFeeForm)

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
    setFormInitialValues(blankFeeForm)
  }

  const openEdit = (tier: FeeTier) => {
    setFormMode('edit')
    setEditId(tier.id)
    setFormInitialValues({
      type: tier.type,
      transactionType: tier.transactionType,
      rangeMin: String(tier.rangeMin),
      rangeMax: String(tier.rangeMax),
      customerFee: String(tier.customerFee),
    })
  }

  const closeForm = () => {
    setFormMode(null)
    setEditId(null)
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

  const saveForm = (values: FeeFormValues) => {
    try {
      if (formMode === 'edit' && editId) {
        setFeeTiers((prev) =>
          prev.map((tier) =>
            tier.id === editId
              ? {
                  ...tier,
                  type: values.type,
                  transactionType: values.transactionType,
                  rangeMin: Number(values.rangeMin),
                  rangeMax: Number(values.rangeMax),
                  customerFee: Number(values.customerFee),
                }
              : tier,
          ),
        )
        closeForm()
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Fee Updated',
          text: 'Updated successfully.',
          showConfirmButton: false,
          timer: 1500,
        })
      } else if (formMode === 'create') {
        const newTier: FeeTier = {
          id: nextTierId(),
          type: values.type,
          transactionType: values.transactionType,
          rangeMin: Number(values.rangeMin),
          rangeMax: Number(values.rangeMax),
          customerFee: Number(values.customerFee),
        }
        setFeeTiers((prev) => [newTier, ...prev])
        resetToFirstPage()
        closeForm()
      } else {
        closeForm()
      }
    } catch (error) {
      console.error('Fee form submit error:', error)
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Fee Update Failed',
        text: 'An error occurred while updating the fee tier. Please try again.',
        showConfirmButton: false,
      })
    }
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
                  <tr
                    key={tier.id}
                    onClick={() => openEdit(tier)}
                    className="cursor-pointer transition-colors hover:bg-surface"
                  >
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
                        ref={(node) => {
                          menuButtonRefs.current[tier.id] = node
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleActionMenu(tier.id)
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
                  const tier = feeTiers.find((item) => item.id === actionMenu.id)
                  if (tier) openEdit(tier)
                  closeActionMenu()
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-brand hover:text-white"
              >
                <Pencil size={14} /> Edit
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Formik<FeeFormValues>
        enableReinitialize
        initialValues={formInitialValues}
        validationSchema={feeFormSchema}
        onSubmit={(values, { setSubmitting }) => {
          saveForm(values)
          setSubmitting(false)
        }}
      >
        {({ values, errors, touched, isSubmitting, submitForm }) => (
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
                  disabled={isSubmitting}
                  onClick={() => submitForm()}
                  className="flex-1 rounded-full bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {formMode === 'create' ? 'Create Fee' : 'Save Changes'}
                </button>
              </>
            }
          >
            <Form className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted">Transaction Type</label>
                <Field as="select" name="transactionType" className={getFieldClass(false)}>
                  {transactionTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted">Range Min</label>
                  <Field
                    type="number"
                    name="rangeMin"
                    className={getFieldClass(Boolean(touched.rangeMin && errors.rangeMin))}
                  />
                  <ErrorMessage name="rangeMin" component="p" className={errorClass} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted">Range Max</label>
                  <Field
                    type="number"
                    name="rangeMax"
                    className={getFieldClass(Boolean(touched.rangeMax && errors.rangeMax))}
                  />
                  <ErrorMessage name="rangeMax" component="p" className={errorClass} />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted">
                  {values.transactionType === 'Cash In' ? 'Agent Commission' : 'Customer Fee'}
                </label>
                <Field
                  type="number"
                  name="customerFee"
                  className={getFieldClass(Boolean(touched.customerFee && errors.customerFee))}
                />
                <ErrorMessage name="customerFee" component="p" className={errorClass} />
              </div>
            </Form>
          </Modal>
        )}
      </Formik>
    </div>
  )
}
