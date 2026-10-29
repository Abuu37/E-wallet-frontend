import { Navigate, Outlet } from 'react-router-dom'
import { getRedirectPath, type UserRole } from '../utils/mockAuth'

interface AuthGuardProps {
    allowedRoles: UserRole[]
}

export default function AuthGuard({ allowedRoles }: AuthGuardProps) {

    let role: UserRole | undefined
    const storedUser = sessionStorage.getItem('user')

    if (!storedUser) {
        return <Navigate to="/login" replace />
    }

    try {
        role = JSON.parse(storedUser).role
    } catch {
        role = undefined
    }

    if (!role) {
        sessionStorage.removeItem('user')
        return <Navigate to="/login" replace />
    }

    if (!allowedRoles.includes(role)) {

        return <Navigate to={getRedirectPath(role)} replace />
    }

    return <Outlet />
}
