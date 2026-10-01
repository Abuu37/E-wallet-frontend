import { Link } from 'react-router-dom'
import { CreditCard, Globe, Mail, MessageCircle } from 'lucide-react'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Services', to: '/services' },
      { label: 'Fees', to: '/fees' },
      { label: 'Get the Card', to: '/get-card' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQ', to: '/faq' },
      { label: 'Contact Us', to: '/contact' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Contact', to: '/contact' },
      { label: 'Privacy Policy', to: '/contact' },
      { label: 'Terms of Service', to: '/contact' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-line bg-ink text-white/70">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-6 py-14 sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
              <CreditCard size={18} />
            </span>
            WalletPesa
          </Link>
          <p className="mt-4 text-sm leading-relaxed">
            One card for every payment: send money, pay bills, and shop with
            confidence.
          </p>
          <div className="mt-5 flex gap-4">
            <a href="#" aria-label="Website" className="hover:text-white">
              <Globe size={18} />
            </a>
            <a href="#" aria-label="Email" className="hover:text-white">
              <Mail size={18} />
            </a>
            <a href="#" aria-label="Live chat" className="hover:text-white">
              <MessageCircle size={18} />
            </a>
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h4 className="text-sm font-semibold text-white">{column.title}</h4>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 px-6 py-6 text-center text-xs">
        © {new Date().getFullYear()} WalletPesa. All rights reserved.
      </div>
    </footer>
  )
}
