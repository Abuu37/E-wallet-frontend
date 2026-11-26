import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../../shared/api/client'
import { useApi } from '../../shared/api/useApi'
import { formatTzs } from '../../shared/lib/money'
import { ErrorState, LoadingState } from '../../shared/ui/controls'
import type { WeeklyDay } from './agentApi'

const day = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'short' })

/** The last 7 days: cash-ins next to customer withdrawals. */
export function WeeklyChart() {
  const week = useApi<WeeklyDay[]>((signal) => api('/agent/dashboard/weekly', { signal }), [], 60_000)
  if (week.loading && !week.data) return <LoadingState />
  if (week.error && !week.data) return <ErrorState error={week.error} onRetry={week.reload} />
  const data = (week.data ?? []).map((d) => ({ day: day(d.date), 'Cash-ins': Number(d.cashInAmount), Withdrawals: Number(d.withdrawalAmount), cashIns: d.cashInCount, withdrawals: d.withdrawalCount }))
  const empty = data.every((d) => d['Cash-ins'] === 0 && d.Withdrawals === 0)

  return (
    <section aria-label="Last 7 days" className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-5">
      <div className="flex items-baseline justify-between"><h2 className="text-lg font-extrabold">Last 7 days</h2><span className="text-sm text-slate-600">Cash-ins and withdrawals, TZS</span></div>
      {empty ? <p className="py-8 text-center text-sm text-slate-600">Nothing yet this week. Your cash-ins and customer withdrawals will show here.</p> : (
        <div role="img" aria-label={`Bar chart of cash-ins and withdrawals for the last 7 days. ${data.map((d) => `${d.day}: ${d.cashIns} cash-ins, ${d.withdrawals} withdrawals`).join('. ')}`} className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barGap={4}>
              <CartesianGrid vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={12} width={56} tickFormatter={(v: number) => (v >= 1_000_000 ? `${v / 1_000_000}M` : v >= 1000 ? `${v / 1000}k` : String(v))} />
              <Tooltip formatter={(value) => `${formatTzs(Number(value), { symbol: false })} TZS`} />
              <Legend iconType="circle" />
              <Bar dataKey="Cash-ins" fill="#2563EB" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Withdrawals" fill="#14B8A6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
