
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
    customerId?: string
    cashierId?: string
    name?: string
}

export const mockUsers: User[] = [

    {
        email: 'admin@walletpesa.com',
        password: 'admin123',
        phone: '+255 617 812 845',
        pin: '1234',
        role: 'Admin',
        name: 'System Administrator',
    },

    {
        email: 'mwajuma@gmail.com',
        password: 'mwajuma123',
        phone: '+255 754 220 019',
        pin: '5678',
        role: 'Cashier',
        cashierId: 'CSH-3001',
        name: 'Mwajuma Hassan',
    },

    {
        email: 'asha@gmail.com',
        password: 'asha123',
        phone: '+255 617 812 846',
        pin: '9012',
        role: 'Customer',
        customerId: 'CUS-1001',
        name: 'Asha Juma',
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