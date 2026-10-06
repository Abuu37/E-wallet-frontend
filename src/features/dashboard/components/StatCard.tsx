import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import AnimatedNumber from '../../../components/ui/AnimatedNumber'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  delta: number
  deltaLabel?: string
}

export default function StatCard({ icon: Icon, label, value, delta, deltaLabel }: StatCardProps) {
  const isUp = delta >= 0

  return (
    <div className="rounded-2xl bg-white p-6 shadow-xl shadow-ink/5 ring-1 ring-line">
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
          <Icon size={20} />
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
            isUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {Math.abs(delta)}%
        </span>
      </div>
      <p className="mt-5 text-2xl font-extrabold tracking-tight text-ink">
        <AnimatedNumber value={value} />
      </p>
      <p className="mt-1 text-sm text-muted">{label}</p>
      {deltaLabel && <p className="mt-3 text-xs text-muted">{deltaLabel}</p>}
    </div>
  )
}
