import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ServiceCardProps {
  icon: LucideIcon
  title: string
  description: string
  to?: string
}

export default function ServiceCard({
  icon: Icon,
  title,
  description,
  to,
}: ServiceCardProps) {
  const className =
    'group relative block overflow-hidden rounded-2xl border border-line bg-white p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-ink/5'

  const content = (
    <>
      <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand transition-transform duration-300 group-hover:scale-x-100" />
      <Icon size={28} strokeWidth={1.75} className="text-brand" />
      <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
    </>
  )

  if (to) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}
