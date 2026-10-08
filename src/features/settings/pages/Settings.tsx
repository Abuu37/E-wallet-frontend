import { User, Mail, Phone, Building2 } from 'lucide-react'
import Button from '../../../components/ui/Button'

const fieldClass =
  'w-full rounded-full border border-transparent bg-surface py-2.5 pl-11 pr-4 text-sm outline-none transition-colors focus:border-brand focus:bg-white'

export default function Settings() {
  return (
    <div className="max-w-2xl rounded-2xl bg-white p-8 ring-1 ring-line transition-shadow duration-200 hover:shadow-xl hover:shadow-ink/5">
      <h2 className="text-lg font-bold text-ink">Profile settings</h2>
      <p className="mt-1 text-sm text-muted">
        Update the details shown across the dashboard.
      </p>

      <form
        className="mt-6 space-y-5"
        onSubmit={(event) => event.preventDefault()}
      >
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="text-sm font-medium text-ink">
              Full name
            </label>
            <div className="relative mt-2">
              <User
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />
              <input id="name" type="text" defaultValue="Code Abuu" className={fieldClass} />
            </div>
          </div>

          <div>
            <label htmlFor="org" className="text-sm font-medium text-ink">
              Organization
            </label>
            <div className="relative mt-2">
              <Building2
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
              />
              <input id="org" type="text" defaultValue="WalletPesa" className={fieldClass} />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-medium text-ink">
            Email
          </label>
          <div className="relative mt-2">
            <Mail
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="email"
              type="email"
              defaultValue="code.abuu@walletpesa.co.tz"
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="text-sm font-medium text-ink">
            Phone number
          </label>
          <div className="relative mt-2">
            <Phone
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
            />
            <input id="phone" type="tel" defaultValue="+255 617 812 845" className={fieldClass} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary">
            Cancel
          </Button>
          <Button type="submit">Save changes</Button>
        </div>
      </form>
    </div>
  )
}
