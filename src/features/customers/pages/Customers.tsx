import StatusBadge from '../../../components/ui/StatusBadge'
import { customers } from '../data'

export default function Customers() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-6 py-3 font-semibold">Customer</th>
              <th className="px-6 py-3 font-semibold">Email</th>
              <th className="px-6 py-3 font-semibold">Wallet balance</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                      {customer.name
                        .split(' ')
                        .map((part) => part[0])
                        .join('')}
                    </span>
                    <span className="font-medium text-ink">{customer.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-ink/70">{customer.email}</td>
                <td className="px-6 py-3.5 font-semibold text-ink">
                  ${customer.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-3.5">
                  <StatusBadge
                    status={customer.status === 'Active' ? 'positive' : 'negative'}
                    label={customer.status}
                  />
                </td>
                <td className="px-6 py-3.5 text-ink/70">{customer.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
