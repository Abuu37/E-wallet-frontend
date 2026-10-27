import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { CreditCard, LayoutDashboard, Landmark, LogOut } from 'lucide-react'
import { customers } from '../../features/customers/data'
import { getCustomerBalance } from '../../features/ledger/data'

const currency = (value: number) => `TSh ${Math.round(value).toLocaleString()}`

const navItems = [
  { to: '/account', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/account/withdraw', label: 'Withdraw', icon: Landmark },
]

// No login session is tracked for the customer view — same as the staff dashboard's own
// hardcoded currentUser in DashboardTopbar, this is a fixed demo account, not a real identity.
const customer = customers[0]

export default function CustomerLayout() {
  const navigate = useNavigate()
  const balance = getCustomerBalance(customer)

  const handleLogout = () => {
    sessionStorage.removeItem('user')
    navigate('/')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:flex-row sm:justify-center sm:gap-2 sm:text-sm ${
      isActive ? 'bg-brand text-white' : 'text-muted hover:bg-surface hover:text-ink'
    }`

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <CreditCard size={18} />
            </span>
            WalletPesa
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted">{customer.name}</p>
              <p className="text-sm font-bold text-ink">{currency(balance)}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Logout"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-red-600"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-24 sm:pb-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white px-3 py-2 sm:static sm:mx-auto sm:mt-6 sm:max-w-3xl sm:rounded-2xl sm:border sm:px-4 sm:py-2 sm:ring-1 sm:ring-line">
        <div className="mx-auto flex max-w-3xl gap-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
