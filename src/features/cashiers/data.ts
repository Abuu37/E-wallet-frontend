export type CashierStatus = 'Active' | 'Idle' | 'Dormant' | 'Pending' | 'Blocked'
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
  commissionAccount: string
  openingFloatBalance: number
  todayCashIn: number
  todayCashOut: number
  commissionPayable: number
  unauthorizedReported: boolean
  joined: string
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
  { id: 'CSH-3001', name: 'Mwajuma Hassan', phone: '+255 754 220 019', email: 'mwajuma.hassan@walletpesa.co.tz', gender: 'Female', dateOfBirth: '1992-03-14', address: '18 Uhuru Street, Kariakoo, Dar es Salaam', username: 'mwajumahassan', branch: 'Dar es Salaam · Kariakoo', terminal: 'TILL-01', floatAccount: 'FA-384021', commissionAccount: 'CA-384021', openingFloatBalance: 0.0, todayCashIn: 0.0, todayCashOut: 0.0, commissionPayable: 86.5, unauthorizedReported: false, joined: '2026-04-11', permissions: fullPermissions },
  { id: 'CSH-3002', name: 'Juma Said', phone: '+255 765 330 412', email: 'juma.said@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1988-11-02', address: '7 Kirumba Road, Mwanza', username: 'jumasaid', branch: 'Mwanza · Kirumba', terminal: 'TILL-02', floatAccount: 'FA-384022', commissionAccount: 'CA-384022', openingFloatBalance: 68000.0, todayCashIn: 0.0, todayCashOut: 0.0, commissionPayable: 24.0, unauthorizedReported: false, joined: '2026-06-02', permissions: { ...fullPermissions, internalTransfers: false } },
  { id: 'CSH-3003', name: 'Halima Ndosi', phone: '+255 713 220 045', email: 'halima.ndosi@walletpesa.co.tz', gender: 'Female', dateOfBirth: '1995-07-21', address: '22 Sokoine Road, City Center, Arusha', username: 'halimandosi', branch: 'Arusha · City Center', terminal: 'TILL-03', floatAccount: 'FA-384023', commissionAccount: 'CA-384023', openingFloatBalance: 75000.0, todayCashIn: 0.0, todayCashOut: 0.0, commissionPayable: 92.0, unauthorizedReported: false, joined: '2026-01-15', permissions: fullPermissions },
  { id: 'CSH-3004', name: 'Omary Chacha', phone: '+255 688 910 332', email: 'omary.chacha@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1990-05-09', address: '4 Bunge Street, Central, Dodoma', username: 'omarychacha', branch: 'Dodoma · Central', terminal: 'TILL-04', floatAccount: 'FA-384024', commissionAccount: 'CA-384024', openingFloatBalance: 38500.0, todayCashIn: 0.0, todayCashOut: 0.0, commissionPayable: 58.0, unauthorizedReported: false, joined: '2026-02-22', permissions: fullPermissions },
  { id: 'CSH-3005', name: 'Rehema Kibona', phone: '+255 754 002 118', email: 'rehema.kibona@walletpesa.co.tz', gender: 'Female', dateOfBirth: '1998-01-30', address: '11 Nyerere Road, Ilala, Dar es Salaam', username: 'rehemakibona', branch: 'Dar es Salaam · Ilala', terminal: 'TILL-05', floatAccount: 'FA-384025', commissionAccount: 'CA-384025', openingFloatBalance: 0.0, todayCashIn: 0.0, todayCashOut: 0.0, commissionPayable: 0.0, unauthorizedReported: true, joined: '2026-03-10', permissions: { customerDeposits: false, customerWithdrawals: false, internalTransfers: false, checkBalance: true } },
  { id: 'CSH-3006', name: 'Bakari Juma', phone: '+255 621 884 207', email: 'bakari.juma@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1986-09-17', address: '9 Soweto Street, Mbeya', username: 'bakarijuma', branch: 'Mbeya · Soweto', terminal: 'TILL-06', floatAccount: 'FA-384026', commissionAccount: 'CA-384026', openingFloatBalance: 19400.0, todayCashIn: 0.0, todayCashOut: 0.0, commissionPayable: 64.5, unauthorizedReported: false, joined: '2026-05-19', permissions: fullPermissions },
  { id: 'CSH-3007', name: 'Zainab Mrisho', phone: '+255 713 440 921', email: 'zainab.mrisho@walletpesa.co.tz', gender: 'Female', dateOfBirth: '1993-12-05', address: '31 Msimbazi Street, Kariakoo, Dar es Salaam', username: 'zainabmrisho', branch: 'Dar es Salaam · Kariakoo', terminal: 'TILL-07', floatAccount: 'FA-384027', commissionAccount: 'CA-384027', openingFloatBalance: 63500.0, todayCashIn: 0.0, todayCashOut: 0.0, commissionPayable: 32.0, unauthorizedReported: false, joined: '2026-07-08', permissions: fullPermissions },
  { id: 'CSH-3008', name: 'Elias Mwakalinga', phone: '+255 765 102 774', email: 'elias.mwakalinga@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1991-04-26', address: '15 Sokoine Road, City Center, Arusha', username: 'eliasmwakalinga', branch: 'Arusha · City Center', terminal: 'TILL-08', floatAccount: 'FA-384028', commissionAccount: 'CA-384028', openingFloatBalance: 0.0, todayCashIn: 0.0, todayCashOut: 0.0, commissionPayable: 0.0, unauthorizedReported: false, joined: '2026-08-21', permissions: { ...fullPermissions, customerWithdrawals: false } },
  { id: 'CSH-3009', name: 'Fadhili Mushi', phone: '+255 622 540 118', email: 'fadhili.mushi@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1994-10-02', address: '6 Mnazi Mmoja Road, Ilala, Dar es Salaam', username: 'fadhilimushi', branch: 'Dar es Salaam · Ilala', terminal: 'TILL-09', floatAccount: 'FA-384029', commissionAccount: 'CA-384029', openingFloatBalance: 87000.0, todayCashIn: 1900.0, todayCashOut: 1200.0, commissionPayable: 45.0, unauthorizedReported: false, joined: '2026-08-30', permissions: fullPermissions },
  { id: 'CSH-3010', name: 'Lucy Mganga', phone: '+255 713 905 227', email: 'lucy.mganga@walletpesa.co.tz', gender: 'Female', dateOfBirth: '1999-02-18', address: '14 Kirumba Road, Mwanza', username: 'lucymganga', branch: 'Mwanza · Kirumba', terminal: 'TILL-10', floatAccount: 'FA-384030', commissionAccount: 'CA-384030', openingFloatBalance: 0.0, todayCashIn: 0.0, todayCashOut: 0.0, commissionPayable: 0.0, unauthorizedReported: false, joined: '2026-10-15', permissions: { customerDeposits: false, customerWithdrawals: false, internalTransfers: false, checkBalance: false } },
  { id: 'CSH-3011', name: 'Said Ramadhani', phone: '+255 754 338 019', email: 'said.ramadhani@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1987-06-25', address: '2 Tandika Street, Kariakoo, Dar es Salaam', username: 'saidramadhani', branch: 'Dar es Salaam · Kariakoo', terminal: 'TILL-11', floatAccount: 'FA-384031', commissionAccount: 'CA-384031', openingFloatBalance: 10500.0, todayCashIn: 0.0, todayCashOut: 0.0, commissionPayable: 0.0, unauthorizedReported: false, joined: '2026-03-02', permissions: fullPermissions },
  { id: 'CSH-3012', name: 'Neema Komba', phone: '+255 688 220 904', email: 'neema.komba@walletpesa.co.tz', gender: 'Female', dateOfBirth: '1996-09-12', address: '9 Themi Road, City Center, Arusha', username: 'neemakomba', branch: 'Arusha · City Center', terminal: 'TILL-12', floatAccount: 'FA-384032', commissionAccount: 'CA-384032', openingFloatBalance: 59300.0, todayCashIn: 3100.0, todayCashOut: 2400.0, commissionPayable: 110.0, unauthorizedReported: false, joined: '2025-12-01', permissions: fullPermissions },
  { id: 'CSH-3013', name: 'Yusuf Abdallah', phone: '+255 765 447 302', email: 'yusuf.abdallah@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1989-01-07', address: '21 Soweto Street, Mbeya', username: 'yusufabdallah', branch: 'Mbeya · Soweto', terminal: 'TILL-13', floatAccount: 'FA-384033', commissionAccount: 'CA-384033', openingFloatBalance: 24000.0, todayCashIn: 0.0, todayCashOut: 0.0, commissionPayable: 15.0, unauthorizedReported: false, joined: '2026-05-10', permissions: { ...fullPermissions, customerDeposits: false } },
  { id: 'CSH-3014', name: 'Grace Lyimo', phone: '+255 713 660 481', email: 'grace.lyimo@walletpesa.co.tz', gender: 'Female', dateOfBirth: '1997-04-29', address: '5 Buguruni Street, Ilala, Dar es Salaam', username: 'gracelyimo', branch: 'Dar es Salaam · Ilala', terminal: 'TILL-14', floatAccount: 'FA-384034', commissionAccount: 'CA-384034', openingFloatBalance: 85000.0, todayCashIn: 1400.0, todayCashOut: 900.0, commissionPayable: 38.0, unauthorizedReported: false, joined: '2026-06-18', permissions: fullPermissions },
  { id: 'CSH-3015', name: 'Abel Mrema', phone: '+255 621 338 775', email: 'abel.mrema@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1990-12-11', address: '3 Viwandani Road, Central, Dodoma', username: 'abelmrema', branch: 'Dodoma · Central', terminal: 'TILL-15', floatAccount: 'FA-384035', commissionAccount: 'CA-384035', openingFloatBalance: 0.0, todayCashIn: 0.0, todayCashOut: 0.0, commissionPayable: 0.0, unauthorizedReported: true, joined: '2026-02-14', permissions: { customerDeposits: false, customerWithdrawals: false, internalTransfers: false, checkBalance: false } },
]
