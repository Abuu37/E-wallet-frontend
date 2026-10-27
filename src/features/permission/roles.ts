export const Role = {
    ADMIN: 'ADMIN',
    CASHIER: 'CASHIER',
    CUSTOMER: 'CUSTOMER',
} as const;

export type Role = (typeof Role)[keyof typeof Role];