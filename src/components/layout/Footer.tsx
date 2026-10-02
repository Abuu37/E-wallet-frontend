import { Link } from 'react-router-dom'
import { CreditCard, ChevronRight } from 'lucide-react'
import xIcon from '../../assets/icons/x.svg?raw'
import facebookIcon from '../../assets/icons/facebook.svg?raw'
import instagramIcon from '../../assets/icons/instagram.svg?raw'
import linkedinIcon from '../../assets/icons/linkedin.svg?raw'

const socialLinks = [
  { label: 'X', href: '#', svg: xIcon },
  { label: 'Facebook', href: '#', svg: facebookIcon },
  { label: 'Instagram', href: '#', svg: instagramIcon },
  { label: 'LinkedIn', href: '#', svg: linkedinIcon },
]

function SocialIcon({ label, href, svg }: { label: string; href: string; svg: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white hover:text-white [&>svg]:h-4 [&>svg]:w-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Services', to: '/services' },
      { label: 'Fees', to: '/fees' },
      { label: 'Register', to: '/register' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'FAQ', to: '/faq' },
      { label: 'Contact Us', to: '/contact' },
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
          <div className="mt-4 space-y-3 text-sm leading-relaxed">
            <p>
              12107 Ukonga Street
              <br />
              Dar es Salaam, Tanzania
            </p>
            <p>
              <span className="font-semibold text-white">Phone:</span> +255 617 812 845
            </p>
            <p>
              <span className="font-semibold text-white">Email:</span> support@walletpesa.co.tz
            </p>
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h4 className="text-sm font-semibold text-white">{column.title}</h4>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="flex items-center gap-1.5 text-sm hover:text-white">
                    <ChevronRight size={14} className="shrink-0" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-sm font-semibold text-white">Follow Us</h4>
          <p className="mt-4 text-sm leading-relaxed">
            Stay connected for product updates, tips, and offers.
          </p>
          <div className="mt-5 flex gap-3">
            {socialLinks.map((social) => (
              <SocialIcon key={social.label} {...social} />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-6 text-center text-xs">
        © {new Date().getFullYear()} <span className="font-bold text-white">WalletPesa</span>. All rights reserved.
      </div>
    </footer>
  )
}
