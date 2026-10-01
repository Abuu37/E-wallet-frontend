import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X, CreditCard } from 'lucide-react'
import { motion } from 'motion/react'
import Button from '../ui/Button'

const links = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/fees', label: 'Fees' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  const textClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-brand' : 'text-ink/80 hover:text-brand'
    }`

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative inline-block w-fit pb-1 text-sm font-medium transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-brand after:transition-all after:duration-200 ${
      isActive
        ? 'text-brand after:w-full'
        : 'text-ink/80 after:w-0 hover:text-brand hover:after:w-full'
    }`

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
            <CreditCard size={18} />
          </span>
          WalletPesa
        </NavLink>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className="relative pb-1" end={link.to === '/'}>
              {({ isActive }) => (
                <>
                  <span className={textClass({ isActive })}>{link.label}</span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-underline"
                      className="absolute left-0 -bottom-0.5 h-0.5 w-full rounded-full bg-brand"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:block">
          <Button to="/get-card">Get the Card</Button>
        </div>

        <button
          type="button"
          className="text-ink md:hidden"
          onClick={() => setOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          {open ? <X size={26} /> : <Menu size={26} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={mobileLinkClass}
                end={link.to === '/'}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </NavLink>
            ))}
            <Button to="/get-card" className="mt-2 w-full" onClick={() => setOpen(false)}>
              Get the Card
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
