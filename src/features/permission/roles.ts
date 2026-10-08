export const Role = {
    ADMIN: 'ADMIN',
    CASHIER: 'CASHIER',
    FINANCIAL: 'FINANCIAL',
    CUSTOMER: 'CUSTOMER',
} as const;

export type Role = (typeof Role)[keyof typeof Role];