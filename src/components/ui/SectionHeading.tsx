interface SectionHeadingProps {
  eyebrow?: string
  title: string
  subtitle?: string
  align?: 'left' | 'center'
  light?: boolean
}

export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'center',
  light = false,
}: SectionHeadingProps) {
  const alignClass = align === 'center' ? 'text-center mx-auto' : 'text-left'

  return (
    <div className={`max-w-2xl ${alignClass}`}>
      {eyebrow && (
        <span
          className={`inline-block text-sm font-semibold tracking-wide uppercase mb-3 ${
            light ? 'text-blue-400' : 'text-brand'
          }`}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${
          light ? 'text-white' : 'text-ink'
        }`}
      >
        {title}
      </h2>
      <div className={`relative mt-4 h-[3px] w-40 ${align === 'center' ? 'mx-auto' : ''}`}>
        <div className={`absolute inset-0 rounded-full ${light ? 'bg-white/20' : 'bg-line'}`} />
        <div className="absolute left-1/2 top-0 h-full w-14 -translate-x-1/2 rounded-full bg-brand" />
      </div>
      {subtitle && (
        <p
          className={`mt-4 text-lg ${light ? 'text-white/70' : 'text-muted'}`}
        >
          {subtitle}
        </p>
      )}
    </div>
  )
}
