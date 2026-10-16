type TypeTone = 'purple' | 'blue' | 'orange' | 'rose' | 'green'

const toneStyles: Record<TypeTone, string> = {
  purple: 'bg-purple-50 text-purple-700',
  blue: 'bg-blue-50 text-blue-700',
  orange: 'bg-orange-50 text-orange-700',
  rose: 'bg-rose-50 text-rose-700',
  green: 'bg-green-50 text-green-700',
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
