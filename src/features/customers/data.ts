export type CustomerStatus = 'Active' | 'Suspended'

export interface Customer {
  id: string
  name: string
  email: string
  balance: number
  status: CustomerStatus
  joined: string
}

export const customers: Customer[] = [
  { id: 'CUS-1001', name: 'Asha Juma', email: 'asha.juma@example.com', balance: 2480.5, status: 'Active', joined: '2025-11-02' },
  { id: 'CUS-1002', name: 'John Foxton', email: 'john.foxton@example.com', balance: 980.0, status: 'Active', joined: '2025-12-14' },
  { id: 'CUS-1003', name: 'Grace Mwangi', email: 'grace.mwangi@example.com', balance: 15320.0, status: 'Active', joined: '2026-01-20' },
  { id: 'CUS-1004', name: 'Peter Mushi', email: 'peter.mushi@example.com', balance: 125.0, status: 'Suspended', joined: '2026-02-08' },
  { id: 'CUS-1005', name: 'Fatma Said', email: 'fatma.said@example.com', balance: 3100.75, status: 'Active', joined: '2026-03-17' },
  { id: 'CUS-1006', name: 'Daniel Kessy', email: 'daniel.kessy@example.com', balance: 640.2, status: 'Active', joined: '2026-05-03' },
  { id: 'CUS-1007', name: 'Neema Lyimo', email: 'neema.lyimo@example.com', balance: 8750.0, status: 'Suspended', joined: '2026-06-29' },
]
