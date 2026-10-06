import { Wifi } from 'lucide-react'
import StatusBadge from '../components/StatusBadge'
import { cards } from '../data'

export default function Cards() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.id}
            className="relative overflow-hidden rounded-2xl p-6 text-white shadow-xl shadow-ink/10"
            style={{
              backgroundImage:
                'linear-gradient(135deg, var(--color-brand-dark), var(--color-brand), var(--color-ink))',
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)',
                backgroundSize: '18px 18px',
              }}
            />
            <div className="relative flex items-start justify-between">
              <span className="h-8 w-11 rounded-md bg-white/20" />
              <Wifi size={20} className="rotate-90 text-white/70" />
            </div>
            <p className="relative mt-6 font-mono text-lg tracking-widest">{card.number}</p>
            <div className="relative mt-5 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-white/60">Card holder</p>
                <p className="text-sm font-semibold">{card.holder}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-white/60">Expires</p>
                <p className="text-sm font-semibold">{card.expiry}</p>
              </div>
            </div>
            <p className="relative mt-4 text-right text-sm font-extrabold italic">
              {card.type === 'Virtual' ? 'VISA' : 'Mastercard'}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-ink/5 ring-1 ring-line">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-line bg-surface text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-6 py-3 font-semibold">Holder</th>
                <th className="px-6 py-3 font-semibold">Card number</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {cards.map((card) => (
                <tr key={card.id}>
                  <td className="px-6 py-3.5 font-medium text-ink">{card.holder}</td>
                  <td className="px-6 py-3.5 font-mono text-xs text-muted">{card.number}</td>
                  <td className="px-6 py-3.5 text-ink/70">{card.type}</td>
                  <td className="px-6 py-3.5">
                    <StatusBadge
                      status={card.status === 'Active' ? 'positive' : 'negative'}
                      label={card.status}
                    />
                  </td>
                  <td className="px-6 py-3.5 text-ink/70">{card.expiry}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
