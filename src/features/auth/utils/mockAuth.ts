
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
    /** Links this login identity to its real record — only set for Cashier/Customer, who each have an actual record to show. Admin has no such record; it manages everything. */
    customerId?: string
    cashierId?: string
    /** Admin has no linked record to pull a display name from (there's no "admins" data array in this app), so it's stored directly here instead. Cashier/Customer get theirs from their real linked record, so they don't need this field. */
    name?: string
}

export const mockUsers: User[] = [

    {
        email: 'admin@walletpesa.com',
        password: 'admin123',
        phone: '+255 617 812 845',
        pin: '1234',
        role: 'Admin',
        name: 'Code Abuu',
    },

    {
        email: 'ibrahimabuu37@gmail.com',
        password: 'abuu123',
        // Mwajuma Hassan's real phone (CSH-3001) — logging in as Cashier shows her real identity.
        phone: '+255 754 220 019',
        pin: '5678',
        role: 'Cashier',
        cashierId: 'CSH-3001',
    },

    {
        email: 'kitofuabubakar@gmail.com',
        password: 'kitofu123',
        // Asha Juma's real phone (CUS-1001) — logging in as Customer shows her real wallet/transactions.
        phone: '+255 617 812 846',
        pin: '9012',
        role: 'Customer',
        customerId: 'CUS-1001',
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