import { CalendarDays } from 'lucide-react'

type DateFilterVariant = 'white' | 'surface'

const variantBg: Record<DateFilterVariant, string> = {
  white: 'bg-white',
  surface: 'bg-surface',
}

interface DateFilterProps {
  value: string
  onChange: (value: string) => void
  variant?: DateFilterVariant
  min?: string
  max?: string
  className?: string
}

export default function DateFilter({
  value,
  onChange,
  variant = 'white',
  min,
  max,
  className = '',
}: DateFilterProps) {
  return (
    <div className={`relative ${className}`}>
      <CalendarDays
        size={16}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className={`rounded-full border border-transparent ${variantBg[variant]} py-2.5 pl-10 pr-4 text-sm outline-none ring-1 ring-line transition-colors focus:border-brand`}
      />
    </div>
  )
}
