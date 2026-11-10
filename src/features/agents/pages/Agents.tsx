import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { toast } from '../../../lib/toast'
import {
  Search,
  Users,
  User,
  UserCog,
  UserCheck,
  UserX,
  Landmark,
  MoreVertical,
  Eye,
  Pencil,
  Ban,
  Trash2,
  Hash,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Clock,
  Lock,
  AlertTriangle,
  Receipt,
  HandCoins,
  Plus,
  CirclePlus,
} from 'lucide-react'
import StatCard from '../../../components/ui/StatCard'
import StatusBadge from '../../../components/ui/StatusBadge'
import Drawer from '../../../components/ui/Drawer'
import Modal from '../../../components/ui/Modal'
import SortIcon from '../../../components/ui/SortIcon'
import AgentOnboarding from './AgentOnboarding'
import AgentTopUpForm from '../components/AgentTopUpForm'
import { useAuth } from '../../../components/context/AuthContext'
import type { AgentDetail, AgentEditableFields, AgentStatus, AgentSummary, FloatHealth } from '../types'
import { TRUST_ACCOUNT_BALANCE, getEmoneyLiabilities } from '../../ledger/data'

const statusVariant: Record<string, string> = {
  Active: 'positive',
  Pending: 'warning',
  PIN_CHANGE_REQUIRED: 'info',
  Blocked: 'negative',
}

const statusIconTone: Record<string, string> = {
  Active: 'bg-green-50 text-green-700',
  Pending: 'bg-amber-50 text-amber-700',
  PIN_CHANGE_REQUIRED: 'bg-purple-50 text-purple-700',
  Blocked: 'bg-red-100 text-red-800',
}

const statusIcon: Record<string, typeof UserCheck> = {
  Active: UserCheck,
  Pending: Clock,
  PIN_CHANGE_REQUIRED: Lock,
  Blocked: Ban,
}

const statusOptions = ['All', 'Active', 'Pending', 'PIN_CHANGE_REQUIRED', 'Blocked']

const statusLabel: Record<string, string> = {
  Active: 'Active',
  Pending: 'Pending',
  PIN_CHANGE_REQUIRED: 'PIN Change Required',
  Blocked: 'Blocked',
}
const floatHealthOptions = ['All', 'Healthy', 'Low', 'Critical']

const PAGE_SIZE = 10

const formatAmount = (value: number) => `TSh ${Math.round(value).toLocaleString()}`

type SortKey =
  | 'id'
  | 'name'
  | 'floatBalance'
  | 'floatHealth'
  | 'commissionBalance'
  | 'transactions'
  | 'status'

interface ActionMenuState {
  id: string
  top: number
  left: number
}

// The backend's actual response shape — not the agentNumber/fullName-based
// contract originally speced. Mapped onto AgentSummary/AgentDetail below.
interface RawAgentRecord {
  agentId: string
  agentNumber: string
  firstName?: string
  middleName?: string
  lastName?: string
  phone: string
  email?: string
  gender?: string
  dateOfBirth?: string
  regionId?: string
  regionName?: string
  districtId?: string
  districtName?: string
  currentBalance?: number | null
  floatHealth?: string
  commission?: number | null
  transactionCount?: number | null
  status?: string
}

const toSafeNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

const normalizeFloatHealth = (value: unknown): FloatHealth => {
  switch (String(value ?? '').toUpperCase()) {
    case 'HEALTHY':
      return 'Healthy'
    case 'LOW':
      return 'Low'
    default:
      return 'Critical'
  }
}

const normalizeStatus = (value: unknown): AgentStatus => {
  switch (String(value ?? '').toUpperCase()) {
    case 'ACTIVE':
      return 'Active'
    case 'BLOCKED':
      return 'Blocked'
    case 'PIN_CHANGE_REQUIRED':
      return 'PIN_CHANGE_REQUIRED'
    default:
      return 'Pending'
  }
}

function toAgentSummary(raw: RawAgentRecord): AgentSummary {
  return {
    agentId: raw.agentId,
    agentNumber: raw.agentNumber,
    fullName: [raw.firstName, raw.middleName, raw.lastName].filter(Boolean).join(' '),
    phone: raw.phone,
    email: raw.email,
    gender: raw.gender,
    dateOfBirth: raw.dateOfBirth,
    region: raw.regionName,
    regionId: raw.regionId,
    district: raw.districtName,
    districtId: raw.districtId,
    floatBalance: toSafeNumber(raw.currentBalance),
    floatHealth: normalizeFloatHealth(raw.floatHealth),
    commissionBalance: toSafeNumber(raw.commission),
    transactions: toSafeNumber(raw.transactionCount),
    status: normalizeStatus(raw.status),
  }
}

async function fetchAgents(accessToken?: string): Promise<AgentSummary[]> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/agents`, {
    headers: { Authorization: `Bearer ${accessToken ?? ''}` },
  })
  if (!response.ok) throw new Error('Failed to load agents')
  const body: { data: RawAgentRecord[] } = await response.json()
  return (body.data ?? []).map(toAgentSummary)
}

async function fetchAgentDetail(agentId: string, accessToken?: string): Promise<AgentDetail> {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL}/agents/${encodeURIComponent(agentId)}`,
    { headers: { Authorization: `Bearer ${accessToken ?? ''}` } },
  )
  if (!response.ok) throw new Error('Failed to load agent')
  const body: { data: RawAgentRecord } = await response.json()
  return toAgentSummary(body.data)
}


export default function Agents() {
  const { user } = useAuth()

  const [agents, setAgents] = useState<AgentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [floatHealthFilter, setFloatHealthFilter] = useState('All')
  const [sortKey, setSortKey] = useState<SortKey | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc' | null>(null)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedDetail, setSelectedDetail] = useState<AgentDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [view, setView] = useState<'list' | 'form'>('list')
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')

  const [actionMenu, setActionMenu] = useState<ActionMenuState | null>(null)
  const menuButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const [deleteTarget, setDeleteTarget] = useState<AgentSummary | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [companyWalletBalance, setCompanyWalletBalance] = useState(
    () => TRUST_ACCOUNT_BALANCE - getEmoneyLiabilities(),
  )
  const [topUpTarget, setTopUpTarget] = useState<AgentSummary | null>(null)
  const [isToppingUp, setIsToppingUp] = useState(false)

  const [reloadToken, setReloadToken] = useState(0)
  const reloadAgents = () => setReloadToken((token) => token + 1)

  useEffect(() => {
    let active = true
    const loadAgents = async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const data = await fetchAgents(user?.accessToken)
        if (active) setAgents(data)
      } catch {
        if (active) setLoadError('Could not load agents. Please try again.')
      } finally {
        if (active) setIsLoading(false)
      }
    }
    loadAgents()
    return () => {
      active = false
    }
  }, [user?.accessToken, reloadToken])

    const filtered = useMemo(() => {
    const digitsQuery = query.replace(/\D/g, '')
    return agents.filter((agent) => {
      const fullName = agent.fullName?.toLowerCase() ?? '';
      const agentNumber = agent.agentNumber?.toLowerCase() ?? '';
      const phone = agent.phone?.replace(/\D/g, '') ?? '';
      const search = query.toLowerCase();

      const matchesQuery =
        fullName.includes(search) ||
        agentNumber.includes(search) ||
        (digitsQuery.length > 0 && phone.includes(digitsQuery))
      
      const matchesStatus = status === 'All' || agent.status === status
      const matchesFloatHealth = floatHealthFilter === 'All' || agent.floatHealth === floatHealthFilter
      return matchesQuery && matchesStatus && matchesFloatHealth
    })
  }, [agents, query, status, floatHealthFilter])

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered
    const direction = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case 'id':
          return a.agentNumber.localeCompare(b.agentNumber) * direction
        case 'name':
          return a.fullName.localeCompare(b.fullName) * direction
        case 'floatBalance':
          return (a.floatBalance - b.floatBalance) * direction
        case 'floatHealth':
          return a.floatHealth.localeCompare(b.floatHealth) * direction
        case 'commissionBalance':
          return (a.commissionBalance - b.commissionBalance) * direction
        case 'transactions':
          return (a.transactions - b.transactions) * direction
        case 'status':
          return a.status.localeCompare(b.status) * direction
        default:
          return 0
      }
    })
  }, [filtered, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
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

  const selected = agents.find((agent) => agent.agentId === selectedId) ?? null
  const selectedStatus: AgentStatus | null = selected?.status ?? null

  const totalAgents = agents.length
  const activeCount = agents.filter((agent) => agent.status === 'Active').length
  const pendingCount = agents.filter((agent) => agent.status === 'Pending').length
  const pinChangeRequiredCount = agents.filter(
    (agent) => agent.status === 'PIN_CHANGE_REQUIRED',).length
  const blockedCount = agents.filter((agent) => agent.status === 'Blocked').length
  const lowFloatCount = agents.filter((agent) => agent.floatHealth !== 'Healthy').length
  const totalFloat = agents.reduce((sum, agent) => sum + agent.floatBalance, 0)
  const totalCommission = agents.reduce((sum, agent) => sum + agent.commissionBalance, 0)
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

  const openAgent = async (agentId: string) => {
    setSelectedId(agentId)
    setSelectedDetail(null)
    setDrawerOpen(true)
    closeActionMenu()
    setDetailLoading(true)
    try {
      const detail = await fetchAgentDetail(agentId, user?.accessToken)
      setSelectedDetail(detail)
    } catch {
      toast.error('Could Not Load Agent', {
        description: "Failed to fetch this agent's details. Please try again.",
        duration: 3000,
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const openEdit = async (agentId: string) => {
    closeActionMenu()
    try {
      const detail = await fetchAgentDetail(agentId, user?.accessToken)
      setSelectedId(agentId)
      setSelectedDetail(detail)
      setFormMode('edit')
      setView('form')
    } catch {
      toast.error('Could Not Load Agent', {
        description: "Failed to fetch this agent's details. Please try again.",
        duration: 3000,
      })
    }
  }

  const openCreate = () => {
    setSelectedId(null)
    setSelectedDetail(null)
    setFormMode('create')
    setView('form')
  }

  const backToList = () => setView('list')

  const handleFormSubmit = (values: AgentEditableFields) => {
    // AgentOnboarding already made the real POST/PUT call and only calls
    // onSubmit on success, so this just reflects the result back into the list.
    setView('list')
    toast.success(formMode === 'create' ? 'Agent Created' : 'Agent Updated', {
      description:
        formMode === 'create'
          ? `${values.fullName} has been registered successfully.`
          : `${values.fullName}'s details have been updated.`,
      duration: 1500,
    })
    reloadAgents()
  }

  const requestDelete = (id: string) => {
    const agent = agents.find((item) => item.agentId === id)
    if (!agent) return
    setDeleteTarget(agent)
    closeActionMenu()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/agents/${encodeURIComponent(deleteTarget.agentId)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${user?.accessToken ?? ''}` },
        },
      )
      if (!response.ok) throw new Error('Failed to delete agent')
      if (selectedId === deleteTarget.agentId) {
        setDrawerOpen(false)
      }
      toast.success('Agent Deleted', {
        description: `${deleteTarget.fullName} has been removed.`,
        duration: 1500,
      })
      setDeleteTarget(null)
      reloadAgents()
    } catch {
      toast.error('Delete Failed', {
        description: 'Could not delete this agent. Please try again.',
        duration: 3000,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const openTopUp = (id: string) => {
    const agent = agents.find((item) => item.agentId === id)
    if (!agent) return
    setTopUpTarget(agent)
    closeActionMenu()
  }

  const handleTopUpSubmit = async (amount: number, description: string) => {
    if (!topUpTarget) return
    const targetId = topUpTarget.agentId
    const name = topUpTarget.fullName
    setIsToppingUp(true)
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/agents/${encodeURIComponent(targetId)}/float-topup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.accessToken ?? ''}`,
          },
          body: JSON.stringify({ amount, description }),
        },
      )
      if (!response.ok) throw new Error('Failed to top up float')
      setCompanyWalletBalance((prev) => prev - amount)
      setTopUpTarget(null)
      toast.success('Float Top-Up Successful', {
        description: `TSh ${amount.toLocaleString()} added to ${name}'s float.`,
        duration: 1500,
      })
      reloadAgents()
    } catch (error) {
      console.error('Agent top-up error:', error)
      toast.error('Float Top-Up Failed', {
        description: 'An error occurred while transferring the float. Please try again.',
      })
    } finally {
      setIsToppingUp(false)
    }
  }

  if (view === 'form') {
    return (
      <AgentOnboarding
        mode={formMode}
        initialAgent={formMode === 'edit' ? (selectedDetail ?? undefined) : undefined}
        onCancel={backToList}
        onSubmit={handleFormSubmit}
      />
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Agents</h1>
          <p className="mt-1 text-sm text-muted">
            Manage agent accounts, float balances, and transaction activity.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
        >
          <Plus size={16} />
          Create agent
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} tone="brand" label="Total Agents" value={String(totalAgents)} />
        <StatCard
          icon={UserCheck}
          tone="positive"
          label="Active Agents"
          value={String(activeCount)}
        />
        <StatCard
          icon={Clock}
          tone="warning"
          label="Pending Agents"
          value={String(pendingCount)}
        />
        <StatCard
          icon={Lock}
          tone="warning"
          label="PIN Change Required"
          value={String(pinChangeRequiredCount)}
        />
        <StatCard
          icon={UserX}
          tone="negative"
          label="Blocked Agents"
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
          label="Low-Float Agents"
          value={String(lowFloatCount)}
          deltaLabel="Float health below Healthy"
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
              setStatus(event.target.value)
              resetToFirstPage()
            }}
            className="rounded-full border border-transparent bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All statuses' : (statusLabel[option] ?? option)}
              </option>
            ))}
          </select>

          <select
            value={floatHealthFilter}
            onChange={(event) => {
              setFloatHealthFilter(event.target.value)
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
                    Agent ID
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
              {isLoading && (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-sm text-muted">
                    Loading agents...
                  </td>
                </tr>
              )}
              {!isLoading && loadError && (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-sm text-red-600">
                    {loadError}
                  </td>
                </tr>
              )}
              {!isLoading &&
                !loadError &&
                pageItems.map((agent, index) => (
                  <tr
                    key={agent.agentId}
                    onClick={() => openAgent(agent.agentId)}
                    className="cursor-pointer transition-colors hover:bg-surface"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs text-muted">
                      {(page - 1) * PAGE_SIZE + index + 1}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-muted">
                      {agent.agentNumber}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-medium text-ink">
                      {agent.fullName}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-mono text-ink/70">
                      {agent.phone}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink">
                      {formatAmount(agent.floatBalance)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <StatusBadge
                        status={
                          agent.floatHealth === 'Healthy'
                            ? 'positive'
                            : agent.floatHealth === 'Low'
                              ? 'warning'
                              : 'negative'
                        }
                        label={agent.floatHealth}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink">
                      {formatAmount(agent.commissionBalance)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right text-ink/80">
                      {agent.transactions} transaction{agent.transactions === 1 ? '' : 's'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <StatusBadge
                        status={statusVariant[agent.status]}
                        label={statusLabel[agent.status] ?? agent.status}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      <button
                        type="button"
                        ref={(node) => {
                          menuButtonRefs.current[agent.agentId] = node
                        }}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleActionMenu(agent.agentId)
                        }}
                        aria-label="Row actions"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink/80 transition-colors hover:border-brand hover:bg-brand hover:text-white"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              {!isLoading && !loadError && pageItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-sm text-muted">
                    No agents match your filters.
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
                onClick={() => openAgent(actionMenu.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-brand hover:text-white"
              >
                <Eye size={14} /> View
              </button>
              <button
                type="button"
                onClick={() => openTopUp(actionMenu.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-brand hover:text-white"
              >
                <CirclePlus size={14} /> Top Up Float
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
        onClose={() => {
          setDrawerOpen(false)
          setSelectedDetail(null)
        }}
        title="Agent detail"
        footer={null}
        size="xl"
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand ring-1 ring-brand/15">
                <UserCog size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-ink">{selected.fullName}</p>
                <p className="truncate font-mono text-xs text-muted">{selected.agentNumber}</p>
              </div>
              {selectedStatus && (
                <StatusBadge
                  status={statusVariant[selectedStatus]}
                  label={statusLabel[selectedStatus] ?? selectedStatus}
                />
              )}
            </div>

            <div className="rounded-xl bg-surface p-4 ring-1 ring-line">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                  <Landmark size={14} /> Assigned Float
                </p>
                <button
                  type="button"
                  onClick={() => openTopUp(selected.agentId)}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
                >
                  <CirclePlus size={14} /> Top Up Float
                </button>
              </div>
              <p className="mt-1 text-3xl font-extrabold text-ink">
                {formatAmount(selected.floatBalance)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Agent Information
              </p>
              {detailLoading && !selectedDetail && (
                <p className="mt-3 text-sm text-muted">Loading details...</p>
              )}
              <div className="mt-3 divide-y divide-line rounded-xl ring-1 ring-line">
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Hash size={16} />
                    </span>
                    <p className="text-xs text-muted">Agent ID</p>
                  </div>
                  <p className="shrink-0 truncate font-mono text-sm font-semibold text-ink">
                    {selected.agentNumber}
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
                {selected.email && (
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <Mail size={16} />
                      </span>
                      <p className="text-xs text-muted">Email</p>
                    </div>
                    <p className="shrink-0 truncate text-sm font-semibold text-ink">
                      {selected.email}
                    </p>
                  </div>
                )}
                {selected.gender && (
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <User size={16} />
                      </span>
                      <p className="text-xs text-muted">Gender</p>
                    </div>
                    <p className="shrink-0 truncate text-sm font-semibold text-ink">
                      {selected.gender}
                    </p>
                  </div>
                )}
                {selected.dateOfBirth && (
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <CalendarDays size={16} />
                      </span>
                      <p className="text-xs text-muted">Date of Birth</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-ink">
                      {selected.dateOfBirth}
                    </p>
                  </div>
                )}
                {selected.region && (
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <MapPin size={16} />
                      </span>
                      <p className="text-xs text-muted">Region</p>
                    </div>
                    <p className="shrink-0 truncate text-sm font-semibold text-ink">
                      {selected.region}
                    </p>
                  </div>
                )}
                {selected.district && (
                  <div className="flex items-center justify-between gap-3 p-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                        <MapPin size={16} />
                      </span>
                      <p className="text-xs text-muted">District</p>
                    </div>
                    <p className="shrink-0 truncate text-sm font-semibold text-ink">
                      {selected.district}
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <HandCoins size={16} />
                    </span>
                    <p className="text-xs text-muted">Commission Balance</p>
                  </div>
                  <p className="shrink-0 font-mono text-sm font-semibold text-ink">
                    {formatAmount(selected.commissionBalance)}
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
                  <p className="shrink-0 text-sm font-semibold text-ink">
                    {selectedStatus ? (statusLabel[selectedStatus] ?? selectedStatus) : ''}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
                      <Receipt size={16} />
                    </span>
                    <p className="text-xs text-muted">Total Transactions</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">
                    {selected.transactions} transaction{selected.transactions === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={16} />
            </span>
            Delete agent
          </>
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="flex-1 rounded-full border border-line py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm text-ink/80">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-ink">{deleteTarget?.fullName}</span>? This will
          permanently remove the agent and their float wallet assignment. This action cannot be
          undone.
        </p>
      </Modal>

      <Modal
        open={!!topUpTarget}
        onClose={() => setTopUpTarget(null)}
        title={
          <>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
              <CirclePlus size={16} />
            </span>
            Top Up Float
          </>
        }
      >
        {topUpTarget && (
          <AgentTopUpForm
            agent={topUpTarget}
            companyWalletBalance={companyWalletBalance}
            isSubmitting={isToppingUp}
            onSubmit={handleTopUpSubmit}
            onCancel={() => setTopUpTarget(null)}
          />
        )}
      </Modal>
    </div>
  )
}
