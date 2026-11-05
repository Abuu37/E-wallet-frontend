import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../../features/auth/types'

interface RoleGuardProps {
    allowedRoles: Role[]
}

export const RoleGuard = ({ allowedRoles }: RoleGuardProps) => {
    const { user, loading } = useAuth()

    if (loading) return <div>Loading...</div>

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (!user.roles.some((role) => allowedRoles.includes(role))) {
        return <Navigate to="/unauthorized" replace />
    }

    return <Outlet />;
}
