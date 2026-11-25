import { Check, CreditCard } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const NAV: [string, string][] = [['/', 'Home'], ['/services', 'Services'], ['/fees', 'Fees'], ['/faq', 'FAQ'], ['/contact', 'Contact']]

function Logo({ light }: { light?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-brand"><CreditCard aria-hidden="true" size={18} className="text-white" /></span>
      <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>WalletPesa</span>
    </span>
  )
}

export interface SideStep { label: string; sub: string; state: 'done' | 'current' | 'todo'; number: number }

export interface AuthSide {
  title: string
  body: string
  bullets?: string[]
  steps?: SideStep[]
  /** A highlighted note at the bottom of the panel. */
  note?: { title: string; text: string }
}

/**
 * The web auth frame from the design (W05–W10): public header, blue dotted backdrop, and a card with a dark
 * information panel (hidden on small screens) beside the form.
 */
export function AuthShell({ cta, side, children }: { cta: 'login' | 'register'; side: AuthSide; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-6 py-3">
          <Link to="/" aria-label="WalletPesa home"><Logo /></Link>
          <nav aria-label="Site" className="mx-auto hidden gap-[26px] md:flex">
            {NAV.map(([to, label]) => <Link key={to} to={to} className="py-2 text-sm font-medium text-slate-700 no-underline hover:text-ink">{label}</Link>)}
          </nav>
          <span className="ml-auto hidden text-sm text-slate-600 sm:inline">{cta === 'login' ? 'New to WalletPesa?' : 'Have a wallet?'}</span>
          <Link to={cta === 'login' ? '/register' : '/login'} className="ml-auto inline-flex h-[42px] items-center rounded-full bg-brand px-[22px] text-sm font-semibold text-white no-underline hover:bg-brand-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 sm:ml-0">
            {cta === 'login' ? 'Register' : 'Log in'}
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center bg-gradient-to-br from-brand to-brand-dark bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] bg-[length:22px_22px] px-4 py-6 sm:py-10">
        <div className="grid w-full max-w-[1080px] grid-cols-1 overflow-hidden rounded-3xl bg-white shadow-[0_40px_80px_-30px_rgba(11,18,32,0.55)] md:grid-cols-2">
          <aside aria-label="About WalletPesa" className="hidden flex-col gap-6 bg-ink bg-[radial-gradient(rgba(255,255,255,0.09)_1px,transparent_1px)] bg-[length:22px_22px] p-9 text-white md:flex">
            <Logo light />
            <div className="flex flex-col gap-2.5">
              <h2 className="max-w-[380px] text-[30px] font-extrabold leading-[1.15] tracking-tight">{side.title}</h2>
              <p className="max-w-[380px] text-[15px] leading-relaxed text-slate-300">{side.body}</p>
            </div>
            {side.bullets && (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {side.bullets.map((b) => <li key={b} className="flex items-start gap-2.5 text-sm leading-normal text-slate-200"><Check aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-green-300" /><span>{b}</span></li>)}
              </ul>
            )}
            {side.steps && (
              <ol aria-label="Registration steps" className="m-0 flex list-none flex-col gap-1 p-0">
                {side.steps.map((s) => (
                  <li key={s.label} aria-current={s.state === 'current' ? 'step' : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${s.state === 'current' ? 'bg-white/10' : ''} ${s.state === 'todo' ? 'text-slate-400' : 'text-white'}`}>
                    <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold ${s.state === 'done' ? 'border-green-600 bg-green-600' : s.state === 'current' ? 'border-brand bg-brand' : 'border-white/25'}`}>
                      {s.state === 'done' ? '✓' : s.number}
                    </span>
                    <span className="flex flex-col"><b className="text-sm">{s.label}</b><span className="text-xs text-slate-300">{s.sub}</span></span>
                  </li>
                ))}
              </ol>
            )}
            {side.note && (
              <div className="mt-auto flex flex-col gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-4 text-[13px] leading-normal text-slate-300">
                <b className="text-[13px] text-white">{side.note.title}</b>{side.note.text}
              </div>
            )}
          </aside>
          <section className="box-border flex min-h-[560px] flex-col justify-center p-6 sm:p-12">{children}</section>
        </div>
      </main>
    </div>
  )
}
