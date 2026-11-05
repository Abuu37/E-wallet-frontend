export type Role = 'ADMIN' | 'CASHIER' | 'CUSTOMER'

export interface StoredUser {
  role: Role
  name?: string
  email?: string
  phone?: string
  cashierId?: string
  customerId?: string
}
