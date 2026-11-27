import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from './context'
import { homePathFor, type Role } from './types'

function Splash() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-screen items-center justify-center bg-surface text-muted">
      Loading…
    </div>
  )
}

/** Any signed-in user. A user who must change a one-time PIN is held on /change-pin. */
export function RequireSession() {
  const { status, session } = useSession()
  const location = useLocation()
  if (status === 'loading') return <Splash />
  if (status === 'anonymous' || !session) return <Navigate to="/login" replace state={location.pathname === '/change-pin' ? null : { from: location.pathname }} />
  if (session.mustChangePin && location.pathname !== '/change-pin') return <Navigate to="/change-pin" replace />
  return <Outlet />
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { session } = useSession()
  if (!session) return null
  if (!roles.some((r) => session.roles.includes(r))) return <Navigate to={homePathFor(session.roles)} replace />
  return <Outlet />
}

/** Shows a no-access state unless the signed-in staff member holds the permission. */
export function RequirePermission({ permission }: { permission: string }) {
  const { has, session } = useSession()
  if (!session) return null
  if (!has(permission)) {
    return (
      <div role="alert" className="m-6 rounded-2xl border border-line bg-white p-6 text-ink">
        <h1 className="text-lg font-bold">You do not have access to this area</h1>
        <p className="mt-1 text-sm text-muted">Ask an administrator to grant the {permission} permission.</p>
      </div>
    )
  }
  return <Outlet />
}
