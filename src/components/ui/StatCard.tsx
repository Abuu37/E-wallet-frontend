import type { LucideIcon } from 'lucide-react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import AnimatedNumber from './AnimatedNumber'

type StatCardTone = 'brand' | 'accent' | 'positive' | 'negative' | 'warning'

const toneStyles: Record<StatCardTone, string> = {
  brand: 'bg-brand/10 text-brand',
  accent: 'bg-accent/10 text-accent',
  positive: 'bg-positive/10 text-positive',
  negative: 'bg-red-50 text-red-700',
  warning: 'bg-amber-50 text-amber-700',
}

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  delta: number
  deltaLabel?: string
  tone?: StatCardTone
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaLabel,
  tone = 'brand',
}: StatCardProps) {
  const isUp = delta >= 0

  return (
    <div className="rounded-2xl bg-white p-6 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${toneStyles[tone]}`}>
          <Icon size={18} />
        </span>
        <p className="truncate text-sm font-semibold text-ink/80">{label}</p>
      </div>
      <p className="mt-4 text-2xl font-extrabold tracking-tight text-ink">
        <AnimatedNumber value={value} />
      </p>
      <span
        className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
          isUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}
      >
        {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(delta)}%
      </span>
      {deltaLabel && <p className="mt-2 text-xs text-muted">{deltaLabel}</p>}
    </div>
  )
}
