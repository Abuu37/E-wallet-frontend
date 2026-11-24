import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

const variantClasses = {
  primary: 'bg-brand text-white hover:bg-brand-dark shadow-lg shadow-brand/20',
  secondary: 'bg-white text-ink border border-line hover:border-brand hover:text-brand',
  'outline-light': 'bg-transparent text-white border border-white/40 hover:bg-white/10',
}

const sizeClasses = {
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
}

interface ButtonProps {
  children: ReactNode
  to?: string
  href?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  variant?: keyof typeof variantClasses
  size?: keyof typeof sizeClasses
  className?: string
  disabled?: boolean
  loading?: boolean
}

export default function Button({
  children,
  to,
  href,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
}: ButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {children}
      </Link>
    )
  }

  if (href) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={classes}>
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}
