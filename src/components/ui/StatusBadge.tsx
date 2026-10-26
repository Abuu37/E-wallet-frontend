export type StatusBadgeVariant = 'positive' | 'warning' | 'negative' | 'neutral' | 'info'
type Status = StatusBadgeVariant

const styles: Record<Status, string> = {
  positive: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  negative: 'bg-red-50 text-red-700',
  neutral: 'bg-slate-100 text-slate-600',
  info: 'bg-purple-50 text-purple-700',
}

export default function StatusBadge({ status, label }: { status: Status; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {label}
    </span>
  )
}
