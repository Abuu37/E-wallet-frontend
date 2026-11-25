import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useT } from '../../shared/i18n'
import { LogoutConfirm } from '../../shared/ui/LogoutConfirm'

export default function CustomerLayout() {
  const { t, locale, setLocale } = useT()
  const [logoutOpen, setLogoutOpen] = useState(false)
  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3">
        <span className="flex items-center gap-2 text-base font-extrabold"><span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-brand text-white">W</span> WalletPesa</span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setLocale(locale === 'en' ? 'sw' : 'en')} aria-label="Change language" className="rounded-full px-3 py-1.5 text-xs font-bold hover:bg-slate-100">{locale === 'en' ? 'Kiswahili' : 'English'}</button>
          <button type="button" onClick={() => setLogoutOpen(true)}
            className="flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200">
            <LogOut aria-hidden="true" size={16} /> {t('common.signOut')}
          </button>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-[1240px] p-4"><Outlet /></main>
      <LogoutConfirm open={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </div>
  )
}
