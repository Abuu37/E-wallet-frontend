import { useMemo, useState } from 'react'
import { ApiError, api } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { useSession } from '../../../shared/auth/context'
import { formatDate, formatDateTime } from '../../../shared/lib/dates'
import { formatTzs } from '../../../shared/lib/money'
import { maskEmail, maskNida, maskPhone } from '../../../shared/lib/phone'
import { Button, EmptyState, ErrorState, LoadingState } from '../../../shared/ui/controls'
import { DetailRow, SidePanel, StatusBadge } from '../../../shared/ui/SidePanel'
import { toast } from '../../../lib/toast'

interface CustomerRow {
  customerId: string
  fullName: string
  phoneNumber: string
  email: string
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  wallet: { accountNumber: string; availableBalance: number | string; status: string } | null
}
interface CustomerList {
  summary: { totalCustomers: number; activeCustomers: number; suspendedCustomers: number; totalCustomerWalletBalance: number | string }
  customers: CustomerRow[]
}
interface CustomerProfile {
  customerId: string
  username: string
  fullName: string
  email: string
  phoneNumber: string
  nida: string | null
  dateOfBirth: string | null
  status: string
  wallet: { accountNumber: string; availableBalance: number | string; currency: string; status: string } | null
  transactions: { reference: string; type: string; direction: string; amount: number | string; status: string; createdAt: string }[]
  createdAt: string
}

export default function CustomersPage() {
  const { has } = useSession()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const state = useApi<CustomerList>((signal) => api('/customers', { query: { status: status || undefined, size: 100 }, signal }), [status])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (state.data?.customers ?? []).filter((c) => !q || [c.fullName, c.phoneNumber, c.email].some((v) => v?.toLowerCase().includes(q)))
  }, [state.data, search])

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold tracking-tight">Customers</h1>

      {state.data && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[['Total customers', String(state.data.summary.totalCustomers)], ['Active', String(state.data.summary.activeCustomers)],
            ['Suspended', String(state.data.summary.suspendedCustomers)], ['Wallet balances', formatTzs(state.data.summary.totalCustomerWalletBalance)]].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-line bg-white p-4"><span className="text-[13px] font-semibold text-muted">{k}</span><p className="truncate text-xl font-extrabold tabular-nums">{v}</p></div>
          ))}
        </div>
      )}

      <div role="search" aria-label="Filter customers" className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-white p-4">
        <label className="flex min-w-48 flex-1 flex-col gap-1 text-xs font-semibold">Search
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or phone" className="h-10 rounded-lg border border-slate-300 px-3 text-sm font-normal" /></label>
        <label className="flex flex-col gap-1 text-xs font-semibold">Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-lg border border-slate-300 px-2 text-sm font-normal">
            <option value="">All</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Suspended</option><option value="PENDING">Pending</option></select></label>
      </div>

      <section aria-label="Customers" className="rounded-2xl border border-line bg-white">
        {state.loading && !state.data ? <LoadingState /> : state.error && !state.data ? <ErrorState error={state.error} onRetry={state.reload} /> : rows.length === 0 ? (
          <EmptyState title="No customers found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead><tr className="text-xs text-muted"><th className="p-3 font-semibold">Customer</th><th className="font-semibold">Phone</th><th className="text-right font-semibold">Balance (TZS)</th><th className="pl-4 font-semibold">Status</th><th className="p-3"><span className="sr-only">Open</span></th></tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.customerId} className="border-t border-line hover:bg-surface">
                    <td className="p-3"><b className="block">{c.fullName}</b><span className="text-xs text-muted">{maskEmail(c.email)}</span></td>
                    <td className="tabular-nums">{maskPhone(c.phoneNumber)}</td>
                    <td className="text-right font-bold tabular-nums">{formatTzs(c.wallet?.availableBalance, { symbol: false })}</td>
                    <td className="pl-4"><StatusBadge status={c.status} /></td>
                    <td className="p-3 text-right"><Button variant="secondary" className="h-9 px-4 text-sm" onClick={() => setOpenId(c.customerId)}>View</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {openId && <CustomerPanel id={openId} canUpdate={has('USER_UPDATE')} onClose={() => setOpenId(null)} onChanged={() => { state.reload() }} />}
    </div>
  )
}

function CustomerPanel({ id, canUpdate, onClose, onChanged }: { id: string; canUpdate: boolean; onClose: () => void; onChanged: () => void }) {
  const detail = useApi<CustomerProfile>((signal) => api(`/customers/${id}`, { signal }), [id])
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const c = detail.data
  const locking = c?.status === 'ACTIVE'

  async function change() {
    if (!c) return
    setBusy(true); setError(null)
    try {
      await api(`/customers/${id}/status`, { method: 'PATCH', body: { status: locking ? 'SUSPENDED' : 'ACTIVE' } })
      toast.success(locking ? 'Customer locked' : 'Customer unlocked')
      setReason('')
      detail.reload(); onChanged()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change the status.')
    } finally { setBusy(false) }
  }

  return (
    <SidePanel open title={c?.fullName ?? 'Customer'} subtitle="Customer record" onClose={onClose}
      footer={c && canUpdate && (c.status === 'ACTIVE' || c.status === 'SUSPENDED') ? (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">Reason to {locking ? 'lock' : 'unlock'} (required)
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} maxLength={255} className="rounded-xl border border-slate-300 p-3 text-sm font-normal" /></label>
          {error && <p role="alert" className="text-sm font-medium text-[#BE123C]">{error}</p>}
          <Button block variant={locking ? 'danger' : 'primary'} loading={busy} disabled={reason.trim().length < 3} onClick={() => void change()}>{locking ? 'Lock customer' : 'Unlock customer'}</Button>
        </div>
      ) : undefined}>
      {detail.loading ? <LoadingState /> : detail.error ? <ErrorState error={detail.error} onRetry={detail.reload} /> : c && (
        <>
          <div className="mb-4"><StatusBadge status={c.status} /></div>
          <DetailRow label="Username">{c.username}</DetailRow>
          <DetailRow label="Phone">{maskPhone(c.phoneNumber)}</DetailRow>
          <DetailRow label="Email">{maskEmail(c.email)}</DetailRow>
          <DetailRow label="NIDA">{maskNida(c.nida)}</DetailRow>
          <DetailRow label="Date of birth">{formatDate(c.dateOfBirth)}</DetailRow>
          <DetailRow label="Registered">{formatDateTime(c.createdAt)}</DetailRow>
          <DetailRow label="Wallet">{c.wallet?.accountNumber ?? '—'}</DetailRow>
          <DetailRow label="Balance">{formatTzs(c.wallet?.availableBalance)}</DetailRow>
          <h3 className="mb-1 mt-5 text-sm font-extrabold">Recent transactions</h3>
          {c.transactions.length === 0 ? <p className="text-sm text-muted">No transactions yet.</p> : (
            <ul className="divide-y divide-line text-sm">
              {c.transactions.slice(0, 10).map((t) => (
                <li key={t.reference} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex flex-col"><b>{t.type}</b><span className="text-xs text-muted">{formatDateTime(t.createdAt)}</span></span>
                  <b className={`tabular-nums ${t.direction === 'IN' || t.direction === 'CREDIT' ? 'text-[#16A34A]' : 'text-[#E11D48]'}`}>{formatTzs(t.amount, { symbol: false })}</b>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted">The reason is required here and is stored with the audit log once that feature ships; the status API does not accept it yet.</p>
        </>
      )}
    </SidePanel>
  )
}
