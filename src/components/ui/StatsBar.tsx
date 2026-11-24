import AnimatedNumber from './AnimatedNumber'

export interface Stat {
  value: string
  label: string
}

export default function StatsBar({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="text-center">
          <p className="text-3xl font-extrabold text-ink sm:text-4xl">
            <AnimatedNumber value={stat.value} />
          </p>
          <p className="mt-1 text-sm text-muted">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
