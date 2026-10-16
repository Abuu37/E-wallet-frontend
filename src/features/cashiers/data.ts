export type CashierStatus = 'Active' | 'Inactive' | 'Suspended'
export type CashierGender = 'Female' | 'Male' | 'Other'

export interface CashierPermissions {
  customerDeposits: boolean
  customerWithdrawals: boolean
  internalTransfers: boolean
  checkBalance: boolean
}

export interface Cashier {
  id: string
  name: string
  phone: string
  email: string
  gender: CashierGender
  dateOfBirth: string
  address: string
  username: string
  branch: string
  terminal: string
  floatAccount: string
  floatBalance: number
  todayCashIn: number
  todayCashOut: number
  status: CashierStatus
  joined: string
  lastActivity: string
  permissions: CashierPermissions
}

export const branchOptions = [
  'Dar es Salaam · Kariakoo',
  'Dar es Salaam · Ilala',
  'Mwanza · Kirumba',
  'Arusha · City Center',
  'Dodoma · Central',
  'Mbeya · Soweto',
]

const fullPermissions: CashierPermissions = {
  customerDeposits: true,
  customerWithdrawals: true,
  internalTransfers: true,
  checkBalance: true,
}

export const cashiers: Cashier[] = [
  { id: 'CSH-3001', name: 'Mwajuma Hassan', phone: '+255 754 220 019', email: 'mwajuma.hassan@walletpesa.co.tz', gender: 'Female', dateOfBirth: '1992-03-14', address: '18 Uhuru Street, Kariakoo, Dar es Salaam', username: 'mwajumahassan', branch: 'Dar es Salaam · Kariakoo', terminal: 'TILL-01', floatAccount: 'FA-384021', floatBalance: 8200.0, todayCashIn: 2400.0, todayCashOut: 1100.0, status: 'Active', joined: '2026-04-11', lastActivity: '2026-10-03 11:05', permissions: fullPermissions },
  { id: 'CSH-3002', name: 'Juma Said', phone: '+255 765 330 412', email: 'juma.said@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1988-11-02', address: '7 Kirumba Road, Mwanza', username: 'jumasaid', branch: 'Mwanza · Kirumba', terminal: 'TILL-02', floatAccount: 'FA-384022', floatBalance: 5400.0, todayCashIn: 1800.0, todayCashOut: 900.0, status: 'Suspended', joined: '2026-06-02', lastActivity: '2026-09-25 09:50', permissions: { ...fullPermissions, internalTransfers: false } },
  { id: 'CSH-3003', name: 'Halima Ndosi', phone: '+255 713 220 045', email: 'halima.ndosi@walletpesa.co.tz', gender: 'Female', dateOfBirth: '1995-07-21', address: '22 Sokoine Road, City Center, Arusha', username: 'halimandosi', branch: 'Arusha · City Center', terminal: 'TILL-03', floatAccount: 'FA-384023', floatBalance: 6100.0, todayCashIn: 2100.0, todayCashOut: 1400.0, status: 'Active', joined: '2026-01-15', lastActivity: '2026-10-03 09:20', permissions: fullPermissions },
  { id: 'CSH-3004', name: 'Omary Chacha', phone: '+255 688 910 332', email: 'omary.chacha@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1990-05-09', address: '4 Bunge Street, Central, Dodoma', username: 'omarychacha', branch: 'Dodoma · Central', terminal: 'TILL-04', floatAccount: 'FA-384024', floatBalance: 3200.0, todayCashIn: 900.0, todayCashOut: 1600.0, status: 'Active', joined: '2026-02-22', lastActivity: '2026-10-02 16:40', permissions: fullPermissions },
  { id: 'CSH-3005', name: 'Rehema Kibona', phone: '+255 754 002 118', email: 'rehema.kibona@walletpesa.co.tz', gender: 'Female', dateOfBirth: '1998-01-30', address: '11 Nyerere Road, Ilala, Dar es Salaam', username: 'rehemakibona', branch: 'Dar es Salaam · Ilala', terminal: 'TILL-05', floatAccount: 'FA-384025', floatBalance: 0.0, todayCashIn: 0.0, todayCashOut: 0.0, status: 'Inactive', joined: '2026-03-10', lastActivity: '2026-08-14 10:00', permissions: { customerDeposits: false, customerWithdrawals: false, internalTransfers: false, checkBalance: true } },
  { id: 'CSH-3006', name: 'Bakari Juma', phone: '+255 621 884 207', email: 'bakari.juma@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1986-09-17', address: '9 Soweto Street, Mbeya', username: 'bakarijuma', branch: 'Mbeya · Soweto', terminal: 'TILL-06', floatAccount: 'FA-384026', floatBalance: 4700.0, todayCashIn: 1500.0, todayCashOut: 1100.0, status: 'Active', joined: '2026-05-19', lastActivity: '2026-10-03 08:55', permissions: fullPermissions },
  { id: 'CSH-3007', name: 'Zainab Mrisho', phone: '+255 713 440 921', email: 'zainab.mrisho@walletpesa.co.tz', gender: 'Female', dateOfBirth: '1993-12-05', address: '31 Msimbazi Street, Kariakoo, Dar es Salaam', username: 'zainabmrisho', branch: 'Dar es Salaam · Kariakoo', terminal: 'TILL-07', floatAccount: 'FA-384027', floatBalance: 2900.0, todayCashIn: 800.0, todayCashOut: 500.0, status: 'Active', joined: '2026-07-08', lastActivity: '2026-10-01 14:10', permissions: fullPermissions },
  { id: 'CSH-3008', name: 'Elias Mwakalinga', phone: '+255 765 102 774', email: 'elias.mwakalinga@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1991-04-26', address: '15 Sokoine Road, City Center, Arusha', username: 'eliasmwakalinga', branch: 'Arusha · City Center', terminal: 'TILL-08', floatAccount: 'FA-384028', floatBalance: 1500.0, todayCashIn: 300.0, todayCashOut: 1200.0, status: 'Suspended', joined: '2026-08-21', lastActivity: '2026-09-20 12:30', permissions: { ...fullPermissions, customerWithdrawals: false } },
]
