import { Navigate, Outlet } from 'react-router-dom'
import type { UserRole } from '../utils/mockAuth';

interface ProtectedRouteProps {
    allowedRoles: UserRole[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {

    const storedUser = sessionStorage.getItem('user');

    if (!storedUser) {
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(storedUser)
        
        if (!allowedRoles.includes(user.role)) {
            return <Navigate to="/login" replace />
        }

        return <Outlet />
    } catch {
        sessionStorage.removeItem('user');
        return <Navigate to="/login" replace />;
    }


}