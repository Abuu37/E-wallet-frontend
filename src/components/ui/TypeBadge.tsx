type TypeTone =
  | 'purple'
  | 'blue'
  | 'orange'
  | 'rose'
  | 'green'
  | 'indigo'
  | 'cyan'
  | 'teal'
  | 'amber'
  | 'pink'
  | 'slate'

const toneStyles: Record<TypeTone, string> = {
  purple: 'bg-purple-50 text-purple-700',
  blue: 'bg-blue-50 text-blue-700',
  orange: 'bg-orange-50 text-orange-700',
  rose: 'bg-rose-50 text-rose-700',
  green: 'bg-green-50 text-green-700',
  indigo: 'bg-indigo-50 text-indigo-700',
  cyan: 'bg-cyan-50 text-cyan-700',
  teal: 'bg-teal-50 text-teal-700',
  amber: 'bg-amber-50 text-amber-700',
  pink: 'bg-pink-50 text-pink-700',
  slate: 'bg-slate-100 text-slate-700',
}

export default function TypeBadge({ tone, label }: { tone: TypeTone; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${toneStyles[tone]}`}
    >
      {label}
    </span>
  )
}
