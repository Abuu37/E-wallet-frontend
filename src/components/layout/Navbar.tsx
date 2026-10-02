import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, CreditCard, ChevronDown } from 'lucide-react'
import { motion } from 'motion/react'
import Button from '../ui/Button'

interface NavChild {
  label: string
  to?: string
  disabled?: boolean
}

interface NavItem {
  label: string
  to?: string
  children?: NavChild[]
}

const links: NavItem[] = [
  { to: '/', label: 'Home' },
  {
    to: '/services',
    label: 'Services',
    children: [
      { to: '/services/send-money', label: 'Send Money' },
      { to: '/services/pay-bills', label: 'Pay Bills' },
      { to: '/services/bank-transfers', label: 'Bank Transfer' },
      { to: '/services/airtime-data-bundles', label: 'Airtime and Data Bundle' },
      { to: '/services/become-an-agent', label: 'Become an Agent' },
    ],
  },
  { to: '/fees', label: 'Fees' },
  { to: '/faq', label: 'FAQ' },
  {
    label: 'WalletPesa App',
    children: [
      { label: 'Android', disabled: true },
      { label: 'iOS', disabled: true },
    ],
  },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)

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

  const dropdownLinkClass =
    'relative inline-block w-fit pb-1 text-sm text-ink/70 transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:rounded-full after:bg-brand after:transition-all after:duration-200 hover:text-brand hover:after:w-full'

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
          {links.map((link) =>
            link.children ? (
              <div key={link.label} className="group relative">
                {link.to ? (
                  <NavLink to={link.to} className="relative flex items-center gap-1 pb-1" end>
                    {({ isActive }) => (
                      <>
                        <span className={textClass({ isActive })}>{link.label}</span>
                        <ChevronDown
                          size={14}
                          className="text-ink/50 transition-transform duration-200 group-hover:rotate-180"
                        />
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
                ) : (
                  <span className="flex cursor-default items-center gap-1 pb-1">
                    <span className="text-sm font-medium text-ink/80">{link.label}</span>
                    <ChevronDown
                      size={14}
                      className="text-ink/50 transition-transform duration-200 group-hover:rotate-180"
                    />
                  </span>
                )}

                <div className="invisible absolute left-1/2 top-full z-20 w-60 -translate-x-1/2 pt-3 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
                  <div className="rounded-xl border border-line bg-white p-2 shadow-xl shadow-ink/10">
                    {link.children.map((child) =>
                      child.disabled || !child.to ? (
                        <span
                          key={child.label}
                          aria-disabled="true"
                          className="group/item block rounded-lg px-3 py-2 text-sm text-ink/80 transition-colors hover:bg-surface hover:text-brand"
                        >
                          <span className="relative inline-block w-fit after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:rounded-full after:bg-brand after:transition-all after:duration-200 group-hover/item:after:w-full">
                            {child.label}
                          </span>
                        </span>
                      ) : (
                        <Link
                          key={child.label}
                          to={child.to}
                          className="group/item block rounded-lg px-3 py-2 text-sm text-ink/80 transition-colors hover:bg-surface hover:text-brand"
                        >
                          <span className="relative inline-block w-fit after:absolute after:left-0 after:-bottom-0.5 after:h-0.5 after:w-0 after:rounded-full after:bg-brand after:transition-all after:duration-200 group-hover/item:after:w-full">
                            {child.label}
                          </span>
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <NavLink key={link.label} to={link.to!} className="relative pb-1" end={link.to === '/'}>
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
            ),
          )}
        </div>

        <div className="hidden md:block">
          <Button to="/login">Login</Button>
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
            {links.map((link) =>
              link.children ? (
                <div key={link.label}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-sm font-medium text-ink/80"
                    onClick={() =>
                      setOpenSubmenu((prev) => (prev === link.label ? null : link.label))
                    }
                  >
                    {link.label}
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${
                        openSubmenu === link.label ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {openSubmenu === link.label && (
                    <div className="mt-3 flex flex-col gap-3 border-l border-line pl-4">
                      {link.children.map((child) =>
                        child.disabled || !child.to ? (
                          <span key={child.label} aria-disabled="true" className={dropdownLinkClass}>
                            {child.label}
                          </span>
                        ) : (
                          <Link
                            key={child.label}
                            to={child.to}
                            className={dropdownLinkClass}
                            onClick={() => {
                              setOpen(false)
                              setOpenSubmenu(null)
                            }}
                          >
                            {child.label}
                          </Link>
                        ),
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink
                  key={link.label}
                  to={link.to!}
                  className={mobileLinkClass}
                  end={link.to === '/'}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </NavLink>
              ),
            )}
            <Button to="/login" className="mt-2 w-full" onClick={() => setOpen(false)}>
              Login
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
