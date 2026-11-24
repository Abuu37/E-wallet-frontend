import { Banknote, Lock, UserCheck, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ApiError, api } from '../../../shared/api/client'
import { useApi } from '../../../shared/api/useApi'
import { useSession } from '../../../shared/auth/context'
import { formatDate, formatDateTime } from '../../../shared/lib/dates'
import { downloadCsv } from '../../../shared/lib/csv'
import { formatTzs } from '../../../shared/lib/money'
import { maskEmail, maskNida, maskPhone } from '../../../shared/lib/phone'
import { Button, EmptyState, ErrorState, LoadingState } from '../../../shared/ui/controls'
import { Avatar, BalanceBlock, DateField, ExportButton, FilterBar, KpiRow, PageHeader, PersonCell, SearchField, SelectField, TableCard } from '../../../shared/ui/console'
import { rowProps } from '../../../shared/ui/rowProps'
import { DetailRow, SidePanel, StatusBadge } from '../../../shared/ui/SidePanel'
import { toast } from '../../../shared/ui/toast'

interface CustomerRow {
  customerId: string
  fullName: string
  phoneNumber: string
  email: string
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED'
  wallet: { accountNumber: string; availableBalance: number | string; status: string } | null
  createdAt: string
  kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED'
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
  kycStatus: 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED'
}

const KYC_LABEL: Record<string, string> = { NOT_STARTED: 'Not started', PENDING: 'Pending', VERIFIED: 'Verified', FAILED: 'Failed' }
const KYC_TONE: Record<string, string> = { NOT_STARTED: 'bg-slate-100 text-slate-700', PENDING: 'bg-amber-50 text-amber-800', VERIFIED: 'bg-teal-50 text-teal-800', FAILED: 'bg-rose-50 text-rose-800' }

/** The API says SUSPENDED; the staff console calls it Locked. */
const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Active', SUSPENDED: 'Locked', PENDING: 'Pending' }

export default function CustomersPage() {
  const { has } = useSession()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [date, setDate] = useState('')
  const [kyc, setKyc] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const state = useApi<CustomerList>((signal) => api('/customers', { query: { status: status || undefined, size: 100 }, signal }), [status])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (state.data?.customers ?? []).filter((c) => (!date || c.createdAt?.slice(0, 10) === date) && (!kyc || c.kycStatus === kyc) && (!q || [c.fullName, c.phoneNumber, c.wallet?.accountNumber].some((v) => v?.toLowerCase().includes(q))))
  }, [state.data, search, date, kyc])

  const s = state.data?.summary
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Customers" subtitle="Customer wallets and their status. Lock or unlock a customer with a recorded reason." />

      {s && <KpiRow items={[
        { label: 'Total customers', value: String(s.totalCustomers), icon: Users },
        { label: 'Active', value: String(s.activeCustomers), icon: UserCheck },
        { label: 'Locked', value: String(s.suspendedCustomers), icon: Lock },
        { label: 'Wallet balances', value: formatTzs(s.totalCustomerWalletBalance, { symbol: false }), unit: 'TZS', icon: Banknote },
      ]} />}

      <FilterBar label="Filter customers" active={Boolean(search || status || date || kyc)} onClear={() => { setSearch(''); setStatus(''); setDate(''); setKyc('') }}>
        <SearchField id="f-q" value={search} onChange={setSearch} placeholder="Search by name, phone or account number" />
        <SelectField id="f-status" label="Status" value={status} onChange={setStatus} options={[['', 'All statuses'], ['ACTIVE', 'Active'], ['SUSPENDED', 'Locked'], ['PENDING', 'Pending']]} />
        <SelectField id="f-kyc" label="Identity" value={kyc} onChange={setKyc} options={[['', 'All'], ['NOT_STARTED', 'Not started'], ['PENDING', 'Pending'], ['VERIFIED', 'Verified'], ['FAILED', 'Failed']]} />
        <DateField id="f-date" value={date} onChange={setDate} />
      </FilterBar>

      <TableCard title="All customers" countText={state.data ? `${rows.length} of ${s?.totalCustomers ?? rows.length} customers` : undefined} action={<ExportButton disabled={rows.length === 0} onClick={() => exportCsv(rows)} />}>
        {state.loading && !state.data ? <LoadingState /> : state.error && !state.data ? <ErrorState error={state.error} onRetry={state.reload} /> : rows.length === 0 ? (
          <EmptyState title="Nobody matches these filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead><tr className="text-xs text-muted"><th className="px-5 py-2 font-semibold">#</th><th className="font-semibold">Customer</th><th className="font-semibold">Phone</th><th className="font-semibold">Account number</th><th className="text-right font-semibold">Balance (TZS)</th><th className="font-semibold">Identity</th><th className="font-semibold">Status</th><th className="px-5 font-semibold">Joined</th></tr></thead>
              <tbody>
                {rows.map((c, i) => (
                  <tr key={c.customerId} {...rowProps(() => setOpenId(c.customerId), `Open ${c.fullName}`)}>
                    <td className="px-5 py-3 text-muted">{i + 1}</td>
                    <td><PersonCell name={c.fullName} sub={maskEmail(c.email)} /></td>
                    <td className="tabular-nums">{maskPhone(c.phoneNumber)}</td>
                    <td className="font-mono text-xs">{c.wallet ? `•••• ${c.wallet.accountNumber.slice(-4)}` : '—'}</td>
                    <td className="text-right font-bold tabular-nums">{formatTzs(c.wallet?.availableBalance, { symbol: false })}</td>
                    <td><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${KYC_TONE[c.kycStatus] ?? KYC_TONE.NOT_STARTED}`}>{KYC_LABEL[c.kycStatus] ?? '—'}</span></td>
                    <td><StatusBadge status={c.status === 'SUSPENDED' ? 'LOCKED' : c.status} label={STATUS_LABEL[c.status]} /></td>
                    <td className="px-5 text-xs">{formatDate(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TableCard>

      {openId && <CustomerPanel id={openId} canUpdate={has('USER_UPDATE')} onClose={() => setOpenId(null)} onChanged={() => state.reload()} />}
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
    <SidePanel open title={c?.fullName ?? 'Customer'} subtitle={c ? `${c.username} · ${maskPhone(c.phoneNumber)}` : 'Customer record'} onClose={onClose}
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
          <div className="mb-4 flex items-center gap-3"><Avatar name={c.fullName} size={48} /><StatusBadge status={c.status === 'SUSPENDED' ? 'LOCKED' : c.status} label={STATUS_LABEL[c.status]} /></div>
          <BalanceBlock label="Wallet balance" value={formatTzs(c.wallet?.availableBalance)} note={c.wallet ? `Account •••• ${c.wallet.accountNumber.slice(-4)}` : undefined} />
          <h3 className="mb-1 text-sm font-extrabold">Customer details</h3>
          <DetailRow label="Phone">{maskPhone(c.phoneNumber)}</DetailRow>
          <DetailRow label="Email">{maskEmail(c.email)}</DetailRow>
          <DetailRow label="NIDA">{maskNida(c.nida)}</DetailRow>
          <DetailRow label="Identity check">{KYC_LABEL[c.kycStatus] ?? '—'} (Plaid Sandbox)</DetailRow>
          <DetailRow label="Date of birth">{formatDate(c.dateOfBirth)}</DetailRow>
          <DetailRow label="Registered">{formatDateTime(c.createdAt)}</DetailRow>
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

function exportCsv(rows: CustomerRow[]) {
  downloadCsv('customers.csv',
    ['Customer', 'Phone', 'Email', 'Account number', 'Balance (TZS)', 'Identity', 'Status', 'Joined'],
    rows.map((c) => [c.fullName, maskPhone(c.phoneNumber), maskEmail(c.email), c.wallet ? `•••• ${c.wallet.accountNumber.slice(-4)}` : '',
      formatTzs(c.wallet?.availableBalance, { symbol: false }), KYC_LABEL[c.kycStatus], STATUS_LABEL[c.status], formatDate(c.createdAt)]))
}
