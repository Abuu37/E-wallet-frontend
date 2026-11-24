import Button from './Button'

interface CtaBannerProps {
  title: string
  subtitle?: string
  primaryLabel: string
  primaryTo: string
  secondaryLabel?: string
  secondaryTo?: string
}

export default function CtaBanner({
  title,
  subtitle,
  primaryLabel,
  primaryTo,
  secondaryLabel,
  secondaryTo,
}: CtaBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink px-8 py-14 text-center ring-1 ring-white/10 sm:px-16">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <div className="pointer-events-none absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-accent/20 blur-[100px]" />
      <div className="relative">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mx-auto mt-3 max-w-xl text-white/70">{subtitle}</p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button to={primaryTo} size="lg">
            {primaryLabel}
          </Button>
          {secondaryLabel && secondaryTo && (
            <Button to={secondaryTo} size="lg" variant="outline-light">
              {secondaryLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
