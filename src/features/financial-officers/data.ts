import { branchOptions } from '../cashiers/data'

export type OfficerStatus = 'Active' | 'Inactive' | 'Suspended'
export type OfficerGender = 'Female' | 'Male' | 'Other'

export interface OfficerPermissions {
  approveDisbursements: boolean
  reconcileSettlements: boolean
  reviewOverdueLoans: boolean
  exportReports: boolean
}

export interface FinancialOfficer {
  id: string
  name: string
  phone: string
  email: string
  gender: OfficerGender
  dateOfBirth: string
  address: string
  username: string
  branch: string
  deskCode: string
  portfolioAccount: string
  assignedPortfolio: number
  todayApprovals: number
  todayFlagged: number
  status: OfficerStatus
  joined: string
  lastActivity: string
  permissions: OfficerPermissions
}

export { branchOptions }

const fullPermissions: OfficerPermissions = {
  approveDisbursements: true,
  reconcileSettlements: true,
  reviewOverdueLoans: true,
  exportReports: true,
}

export const financialOfficers: FinancialOfficer[] = [
  { id: 'OFC-7001', name: 'Grace Mahundi', phone: '+255 712 445 801', email: 'grace.mahundi@walletpesa.co.tz', gender: 'Female', dateOfBirth: '1989-02-18', address: '14 Samora Avenue, Kariakoo, Dar es Salaam', username: 'gracemahundi', branch: 'Dar es Salaam · Kariakoo', deskCode: 'DESK-01', portfolioAccount: 'PF-220031', assignedPortfolio: 185000.0, todayApprovals: 12500.0, todayFlagged: 2100.0, status: 'Active', joined: '2026-01-12', lastActivity: '2026-10-03 10:40', permissions: fullPermissions },
  { id: 'OFC-7002', name: 'Victor Lema', phone: '+255 754 221 390', email: 'victor.lema@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1986-06-27', address: '2 Kirumba Road, Mwanza', username: 'victorlema', branch: 'Mwanza · Kirumba', deskCode: 'DESK-02', portfolioAccount: 'PF-220032', assignedPortfolio: 142000.0, todayApprovals: 9800.0, todayFlagged: 1400.0, status: 'Active', joined: '2026-02-04', lastActivity: '2026-10-03 09:05', permissions: fullPermissions },
  { id: 'OFC-7003', name: 'Amina Rashidi', phone: '+255 713 980 224', email: 'amina.rashidi@walletpesa.co.tz', gender: 'Female', dateOfBirth: '1992-09-11', address: '9 Sokoine Road, City Center, Arusha', username: 'aminarashidi', branch: 'Arusha · City Center', deskCode: 'DESK-03', portfolioAccount: 'PF-220033', assignedPortfolio: 98000.0, todayApprovals: 6200.0, todayFlagged: 800.0, status: 'Suspended', joined: '2026-03-20', lastActivity: '2026-09-18 14:22', permissions: { ...fullPermissions, approveDisbursements: false } },
  { id: 'OFC-7004', name: 'Joseph Mkude', phone: '+255 688 103 556', email: 'joseph.mkude@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1984-12-03', address: '6 Bunge Street, Central, Dodoma', username: 'josephmkude', branch: 'Dodoma · Central', deskCode: 'DESK-04', portfolioAccount: 'PF-220034', assignedPortfolio: 121000.0, todayApprovals: 7400.0, todayFlagged: 1900.0, status: 'Active', joined: '2026-01-29', lastActivity: '2026-10-02 16:15', permissions: fullPermissions },
  { id: 'OFC-7005', name: 'Lillian Komba', phone: '+255 765 440 118', email: 'lillian.komba@walletpesa.co.tz', gender: 'Female', dateOfBirth: '1995-05-08', address: '21 Nyerere Road, Ilala, Dar es Salaam', username: 'lilliankomba', branch: 'Dar es Salaam · Ilala', deskCode: 'DESK-05', portfolioAccount: 'PF-220035', assignedPortfolio: 0.0, todayApprovals: 0.0, todayFlagged: 0.0, status: 'Inactive', joined: '2026-04-02', lastActivity: '2026-07-30 11:00', permissions: { approveDisbursements: false, reconcileSettlements: false, reviewOverdueLoans: false, exportReports: true } },
  { id: 'OFC-7006', name: 'Hassan Bakari', phone: '+255 621 770 302', email: 'hassan.bakari@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1990-08-15', address: '3 Soweto Street, Mbeya', username: 'hassanbakari', branch: 'Mbeya · Soweto', deskCode: 'DESK-06', portfolioAccount: 'PF-220036', assignedPortfolio: 76000.0, todayApprovals: 5200.0, todayFlagged: 600.0, status: 'Active', joined: '2026-05-14', lastActivity: '2026-10-03 08:48', permissions: fullPermissions },
  { id: 'OFC-7007', name: 'Neema Chuwa', phone: '+255 713 884 672', email: 'neema.chuwa@walletpesa.co.tz', gender: 'Female', dateOfBirth: '1993-10-23', address: '27 Msimbazi Street, Kariakoo, Dar es Salaam', username: 'neemachuwa', branch: 'Dar es Salaam · Kariakoo', deskCode: 'DESK-07', portfolioAccount: 'PF-220037', assignedPortfolio: 109000.0, todayApprovals: 8100.0, todayFlagged: 1100.0, status: 'Active', joined: '2026-06-09', lastActivity: '2026-10-01 15:30', permissions: fullPermissions },
  { id: 'OFC-7008', name: 'Daudi Mnyamani', phone: '+255 765 229 804', email: 'daudi.mnyamani@walletpesa.co.tz', gender: 'Male', dateOfBirth: '1987-01-30', address: '18 Sokoine Road, City Center, Arusha', username: 'daudimnyamani', branch: 'Arusha · City Center', deskCode: 'DESK-08', portfolioAccount: 'PF-220038', assignedPortfolio: 63000.0, todayApprovals: 4000.0, todayFlagged: 2500.0, status: 'Suspended', joined: '2026-07-21', lastActivity: '2026-09-11 12:10', permissions: { ...fullPermissions, reviewOverdueLoans: false } },
]
