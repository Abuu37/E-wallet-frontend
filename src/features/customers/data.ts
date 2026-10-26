export type CustomerStatus = 'Active' | 'Inactive' | 'Dormant'

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  balance: number
  joined: string
}

export const customers: Customer[] = [
  { id: 'CUS-1001', name: 'Asha Juma', email: 'asha.juma@example.com', phone: '+255 617 812 845', balance: 2480.5, joined: '2025-11-02' },
  { id: 'CUS-1002', name: 'John Foxton', email: 'john.foxton@example.com', phone: '+255 712 003 221', balance: 980.0, joined: '2025-12-14' },
  { id: 'CUS-1003', name: 'Grace Mwangi', email: 'grace.mwangi@example.com', phone: '+255 755 442 118', balance: 15320.0, joined: '2026-01-20' },
  { id: 'CUS-1004', name: 'Peter Mushi', email: 'peter.mushi@example.com', phone: '+255 688 990 004', balance: 125.0, joined: '2026-02-08' },
  { id: 'CUS-1005', name: 'Fatma Said', email: 'fatma.said@example.com', phone: '+255 677 102 865', balance: 3100.75, joined: '2026-03-17' },
  { id: 'CUS-1006', name: 'Daniel Kessy', email: 'daniel.kessy@example.com', phone: '+255 713 558 902', balance: 640.2, joined: '2026-05-03' },
  { id: 'CUS-1007', name: 'Neema Lyimo', email: 'neema.lyimo@example.com', phone: '+255 621 904 377', balance: 8750.0, joined: '2026-06-29' },
  { id: 'CUS-1008', name: 'Imani Mbwana', email: 'imani.mbwana@example.com', phone: '+255 689 213 540', balance: 0.0, joined: '2026-07-15' },
  { id: 'CUS-1009', name: 'Salma Rajab', email: 'salma.rajab@example.com', phone: '+255 754 880 102', balance: 5420.3, joined: '2026-08-02' },
  { id: 'CUS-1010', name: 'Hassan Kitwana', email: 'hassan.kitwana@example.com', phone: '+255 713 902 448', balance: 215.0, joined: '2026-09-10' },
  { id: 'CUS-1011', name: 'Juma Ally', email: 'juma.ally@example.com', phone: '+255 715 220 884', balance: 1850.0, joined: '2026-03-12' },
  { id: 'CUS-1012', name: 'Rose Mbise', email: 'rose.mbise@example.com', phone: '+255 786 441 027', balance: 940.5, joined: '2026-02-18' },
  { id: 'CUS-1013', name: 'Kelvin Massawe', email: 'kelvin.massawe@example.com', phone: '+255 767 553 910', balance: 0.0, joined: '2026-10-18' },
  { id: 'CUS-1014', name: 'Aziza Juma', email: 'aziza.juma@example.com', phone: '+255 712 884 221', balance: 0.0, joined: '2026-10-19' },
  { id: 'CUS-1015', name: 'Baraka Mnyonyo', email: 'baraka.mnyonyo@example.com', phone: '+255 653 229 047', balance: 0.0, joined: '2026-10-10' },
]
