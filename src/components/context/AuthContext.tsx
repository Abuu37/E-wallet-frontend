import { createContext, useContext, useState } from 'react';
import type { Role } from '../../features/auth/types';

interface User {
    accessToken: string;
    refreshToken: string;
    roles: Role[];
}

interface LoginSession {
    accessToken: string;
    refreshToken: string;
    roles: Role[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (session: LoginSession) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(() => {
        const accessToken = sessionStorage.getItem('accessToken');
        const refreshToken = sessionStorage.getItem('refreshToken');
        const rolesJson = sessionStorage.getItem('roles');
        if (!accessToken || !refreshToken || !rolesJson) return null;
        return { accessToken, refreshToken, roles: JSON.parse(rolesJson) as Role[] };
    });
    const loading = false;

    const login = (session: LoginSession) => {
        sessionStorage.setItem('accessToken', session.accessToken);
        sessionStorage.setItem('refreshToken', session.refreshToken);
        sessionStorage.setItem('roles', JSON.stringify(session.roles));
        setUser(session);
    };

    const logout = () => {
        const activeUser = user;

        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('roles');
        setUser(null);

        if (activeUser) {
            // fire-and-forget: the local session is already cleared, so a failed
            // server-side invalidation shouldn't block or undo the client logout
            fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${activeUser.accessToken}`,
                },
                body: JSON.stringify({ refreshToken: activeUser.refreshToken }),
            }).catch((error) => {
                console.error('Logout request failed:', error);
            });
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
} ;

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
};