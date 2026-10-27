
export type UserRole = 
| 'Admin'
| 'Cashier'
| 'Customer'

export interface User {
    email: string
    password: string
    phone: string
    pin: string
    role: UserRole
}

export const mockUsers: User[] = [

    {
        email: 'admin@walletpesa.com',
        password: 'admin123',
        phone: '+255 617 812 845',
        pin: '1234',
        role: 'Admin'

    },

    {
        email: 'ibrahimabuu37@gmail.com',
        password: 'abuu123',
        phone: '+255 714 242 529',
        pin: '5678',
        role: 'Cashier'
    },

    {
        email: 'kitofuabubakar@gmail.com',
        password: 'kitofu123',
        phone: '+255 768 891 044',
        pin: '9012',
        role: 'Customer'
    },
]

export function getRedirectPath(role: UserRole) {
    switch (role) {
        case 'Admin':
            return '/dashboard'
        case 'Cashier':
            return '/dashboard'
        case 'Customer':
            return '/account'
        default:
            return '/'
    }
}