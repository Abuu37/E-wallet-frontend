import { useCallback, useMemo, useState } from 'react'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { formatDate, formatTime } from '../../shared/lib/dates'
import { amountOf, formatTzs } from '../../shared/lib/money'
import { ErrorState, LoadingState } from '../../shared/ui/controls'
import type { MyTransactionList } from '../customer/types'
import type { AgentOverview } from './AgentHome'
import type { FloatBankSummary, FloatRequestRow } from './agentApi'
import { AgentBankMove } from './AgentBankMove'
import { AgentRequestFloat } from './AgentRequestFloat'

type Tab = 'bank' | 'request' | 'send'
const TABS: [Tab, string][] = [['bank', 'From bank'], ['request', 'Request float'], ['send', 'Send to bank']]
const HEALTH_TONE: Record<string, string> = { HEALTHY: 'bg-teal-50 text-teal-800', LOW: 'bg-amber-50 text-amber-800', CRITICAL: 'bg-rose-50 text-rose-800' }
const BADGE: Record<string, string> = { Credited: 'bg-teal-100 text-teal-800', Sent: 'bg-blue-100 text-brand-dark', Done: 'bg-teal-100 text-teal-800', Waiting: 'bg-amber-100 text-amber-800', Rejected: 'bg-red-100 text-red-700', Returned: 'bg-red-100 text-red-700' }

interface Movement { id: string; title: string; detail: string; amount: number | string; badge: string; at: string }

/** Float (A03, A03b, A03c): top up from your bank, request float with a slip, or send money back to your bank. */
export default function AgentFloat() {
  const [tab, setTab] = useState<Tab>('bank')
  const [prefill, setPrefill] = useState('')
  const overview = useApi<AgentOverview>((signal) => api('/agent/dashboard/overview', { signal }), [], 30_000)
  const summary = useApi<FloatBankSummary>((signal) => api('/agent/float/bank-summary', { signal }), [])
  const requests = useApi<{ requests: FloatRequestRow[] }>((signal) => api('/treasury/requests', { query: { size: 50 }, signal }), [], 15_000)
  const moves = useApi<MyTransactionList>((signal) => api('/transactions/me', { query: { size: 30 }, signal }), [], 30_000)

  const { reload: reloadOverview } = overview
  const { reload: reloadSummary } = summary
  const { reload: reloadRequests } = requests
  const { reload: reloadMoves } = moves
  const changed = useCallback(() => { reloadOverview(); reloadSummary(); reloadMoves() }, [reloadOverview, reloadSummary, reloadMoves])

  const all = useMemo(() => requests.data?.requests ?? [], [requests.data])
  const open = all.find((r) => r.status === 'PENDING' && r.requestType === 'TOPUP')

  const movements: Movement[] = useMemo(() => {
    const fromBank: Movement[] = (moves.data?.items ?? []).filter((t) => ['FLOAT_BANK_TOPUP', 'FLOAT_BANK_WITHDRAWAL', 'COMMISSION_BANK_WITHDRAWAL'].includes(t.type)).map((t) => ({
      id: t.referenceNo, at: t.createdAt, amount: t.amount, detail: `${t.counterpartyName} · ${t.referenceNo}`,
      title: t.type === 'FLOAT_BANK_TOPUP' ? 'Top-up from bank' : t.type === 'FLOAT_BANK_WITHDRAWAL' ? 'Float sent to bank' : 'Commission sent to bank',
      badge: t.type === 'FLOAT_BANK_TOPUP' ? 'Credited' : t.status === 'PENDING' ? 'Waiting' : t.status === 'FAILED' ? 'Returned' : 'Sent',
    }))
    const fromRequests: Movement[] = all.filter((r) => r.requestType === 'TOPUP').map((r) => ({
      id: r.requestId, at: r.decidedAt ?? r.createdAt, amount: r.amount, title: 'Float request', detail: `${r.requestRef}${r.status === 'REJECTED' && r.decisionNote ? ` · ${r.decisionNote}` : ''}`,
      badge: r.status === 'PENDING' ? 'Waiting' : r.status === 'APPROVED' ? 'Credited' : 'Rejected',
    }))
    return [...fromBank, ...fromRequests].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10)
  }, [moves.data, all])

  if ((overview.loading && !overview.data) || (summary.loading && !summary.data)) return <LoadingState />
  if (overview.error && !overview.data) return <ErrorState error={overview.error} onRetry={overview.reload} />

  const d = overview.data!
  const floatBalance = Number(amountOf(d.wallets.floatAccount.balance))
  const commissionBalance = Number(amountOf(d.wallets.commissionAccount.balance))
  const cap = Number(amountOf(summary.data?.dailyCap ?? 0))
  const used = Number(amountOf(summary.data?.usedToday ?? 0))
  const left = Number(amountOf(summary.data?.leftToday ?? 0))
  const pct = cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 tabular-nums">
      <div className="flex flex-col gap-1"><h1 className="text-[28px] font-extrabold tracking-tight">Float</h1><span className="text-sm text-slate-600">Top up your float, or send money back to your bank</span></div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <section aria-label="Float balance" className="flex flex-col gap-2 rounded-[20px] border border-line bg-white p-5">
          <div className="flex items-center justify-between"><span className="text-sm font-bold text-slate-600">Float balance</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${HEALTH_TONE[d.wallets.floatAccount.floatHealth] ?? 'bg-slate-100 text-slate-700'}`}>{d.wallets.floatAccount.floatHealth}</span></div>
          <span className="text-[32px] font-extrabold leading-none tracking-tight">{formatTzs(floatBalance, { symbol: false })}</span>
          <span className="text-[13px] text-slate-600">Alert below 100,000 TZS</span>
        </section>
        <section aria-label="Bank top-ups today" className="flex flex-col gap-2 rounded-[20px] border border-line bg-white p-5">
          <span className="text-sm font-bold text-slate-600">Bank top-ups today</span>
          <span className="text-[32px] font-extrabold leading-none tracking-tight">{formatTzs(used, { symbol: false })}</span>
          <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Daily bank top-up limit used" className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} /></div>
          <span className="text-[13px] text-slate-600">{formatTzs(left, { symbol: false })} left of {formatTzs(cap, { symbol: false })} a day</span>
        </section>
        <section aria-label="Commission wallet" className="flex flex-col gap-2 rounded-[20px] border border-line bg-white p-5">
          <span className="text-sm font-bold text-slate-600">Commission wallet</span>
          <span className="text-[32px] font-extrabold leading-none tracking-tight text-teal-700">{formatTzs(commissionBalance, { symbol: false })}</span>
          <span className="text-[13px] text-slate-600">Send it to your bank from the Send to bank tab</span>
        </section>
      </div>

      <div role="tablist" aria-label="Float actions" className="flex gap-1 rounded-full bg-slate-100 p-1 sm:w-fit">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`flex-1 rounded-full px-5 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 sm:flex-none ${tab === id ? 'bg-white shadow-sm' : 'text-slate-500 hover:text-ink'}`}>{label}</button>
        ))}
      </div>

      {tab === 'bank' && (
        <div className="max-w-xl"><AgentBankMove kind="topup" floatBalance={floatBalance} commissionBalance={commissionBalance} summary={summary.data} onChanged={changed}
          onRequestRest={(rest) => { setPrefill(String(Math.round(rest))); setTab('request') }} /></div>
      )}
      {tab === 'request' && <AgentRequestFloat key={prefill} prefillAmount={prefill} openRequest={open} onSent={() => { reloadRequests(); changed() }} />}
      {tab === 'send' && <div className="max-w-xl"><AgentBankMove kind="send" floatBalance={floatBalance} commissionBalance={commissionBalance} onChanged={changed} /></div>}

      <section aria-label="Recent float movements" className="rounded-[20px] border border-line bg-white px-5 py-3">
        <h2 className="py-2 text-lg font-extrabold">Recent float movements</h2>
        {movements.length === 0 ? <p className="py-4 text-sm text-slate-600">No float movements yet. Top-ups, requests and payouts to your bank show here.</p> : (
          <ul>
            {movements.map((m, i) => (
              <li key={m.id} className={`flex items-center gap-3 py-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}>
                <span className="flex min-w-0 flex-1 flex-col"><b className="text-[15px]">{m.title}</b><span className="truncate text-[13px] text-slate-600">{formatDate(m.at)} {formatTime(m.at)} · {m.detail}</span></span>
                <b className="text-[15px]">{formatTzs(m.amount, { symbol: false })}</b>
                <span className={`w-[78px] rounded-full px-2.5 py-1 text-center text-xs font-bold ${BADGE[m.badge] ?? 'bg-slate-100 text-slate-700'}`}>{m.badge}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
