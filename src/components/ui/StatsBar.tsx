import { useEffect, useState } from 'react'

export interface Stat {
  value: string
  label: string
}

function useCountUp(target: number, duration = 1600) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    let start: number | null = null
    let frame: number

    const step = (timestamp: number) => {
      if (start === null) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(target * eased)
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, duration])

  return value
}

function AnimatedStatValue({ value }: { value: string }) {
  const match = value.match(/^(\D*)([\d,]+\.?\d*)(.*)$/)
  const numberPart = match?.[2] ?? ''
  const hasComma = numberPart.includes(',')
  const decimals = numberPart.includes('.') ? numberPart.split('.')[1].length : 0
  const target = parseFloat(numberPart.replace(/,/g, '')) || 0
  const current = useCountUp(target)

  if (!match) return <>{value}</>

  const [, prefix, , suffix] = match
  const formatted = hasComma
    ? current.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })
    : current.toFixed(decimals)

  return (
    <>
      {prefix}
      {formatted}
      {suffix}
    </>
  )
}

export default function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className="text-3xl font-extrabold text-ink sm:text-4xl">
            <AnimatedStatValue value={stat.value} />
          </p>
          <p className="mt-1 text-sm text-muted">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
