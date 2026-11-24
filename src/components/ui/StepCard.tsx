interface StepCardProps {
  step: number
  title: string
  description: string
  light?: boolean
}

export default function StepCard({ step, title, description, light = false }: StepCardProps) {
  if (light) {
    return (
      <div className="relative rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
          {step}
        </span>
        <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/70">{description}</p>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl border border-line bg-white p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
        {step}
      </span>
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  )
}
