import type { VolumeRange } from '../overview/data'

export interface RevenuePoint {
  label: string
  date: string
  revenue: number
}

export const financialStats = {
  totalRevenue: 48250.75,
  totalRevenueDelta: 8.4,
  totalDisbursed: 312400.0,
  totalDisbursedDelta: 11.5,
  totalRepaid: 268900.0,
  totalRepaidDelta: 6.8,
  outstanding: 86200.0,
  outstandingDelta: -3.2,
  totalDeposits: 198450.0,
  totalDepositsDelta: 9.8,
  totalWithdrawals: 156280.0,
  totalWithdrawalsDelta: -2.4,
}

export interface CashFlowPoint {
  label: string
  date: string
  deposits: number
  withdrawals: number
  balance: number
  loans: number
}

// Daily cash flow for October 2026
export const cashFlowDaily: CashFlowPoint[] = [
  { label: '1 Oct', date: '2026-10-01', deposits: 3800, withdrawals: 3200, balance: 4200, loans: 1100 },
  { label: '2 Oct', date: '2026-10-02', deposits: 4200, withdrawals: 3600, balance: 4100, loans: 1250 },
  { label: '3 Oct', date: '2026-10-03', deposits: 4600, withdrawals: 4000, balance: 4300, loans: 1400 },
  { label: '4 Oct', date: '2026-10-04', deposits: 5400, withdrawals: 4500, balance: 4600, loans: 1600 },
  { label: '5 Oct', date: '2026-10-05', deposits: 6200, withdrawals: 5100, balance: 5000, loans: 1800 },
  { label: '6 Oct', date: '2026-10-06', deposits: 7400, withdrawals: 5800, balance: 5400, loans: 2000 },
  { label: '7 Oct', date: '2026-10-07', deposits: 8600, withdrawals: 6400, balance: 5800, loans: 2250 },
  { label: '8 Oct', date: '2026-10-08', deposits: 9400, withdrawals: 6800, balance: 6100, loans: 2400 },
  { label: '9 Oct', date: '2026-10-09', deposits: 9000, withdrawals: 6600, balance: 6300, loans: 2300 },
  { label: '10 Oct', date: '2026-10-10', deposits: 8200, withdrawals: 6100, balance: 6200, loans: 2150 },
  { label: '11 Oct', date: '2026-10-11', deposits: 7400, withdrawals: 5700, balance: 6000, loans: 2000 },
  { label: '12 Oct', date: '2026-10-12', deposits: 6800, withdrawals: 5300, balance: 5800, loans: 1850 },
  { label: '13 Oct', date: '2026-10-13', deposits: 6400, withdrawals: 5000, balance: 5600, loans: 1750 },
  { label: '14 Oct', date: '2026-10-14', deposits: 6100, withdrawals: 4700, balance: 5400, loans: 1650 },
  { label: '15 Oct', date: '2026-10-15', deposits: 5800, withdrawals: 4300, balance: 5200, loans: 1500 },
  { label: '16 Oct', date: '2026-10-16', deposits: 5600, withdrawals: 4000, balance: 5100, loans: 1400 },
  { label: '17 Oct', date: '2026-10-17', deposits: 5900, withdrawals: 4200, balance: 5200, loans: 1450 },
  { label: '18 Oct', date: '2026-10-18', deposits: 6300, withdrawals: 4600, balance: 5400, loans: 1600 },
  { label: '19 Oct', date: '2026-10-19', deposits: 6700, withdrawals: 5000, balance: 5600, loans: 1750 },
  { label: '20 Oct', date: '2026-10-20', deposits: 7100, withdrawals: 5400, balance: 5800, loans: 1900 },
  { label: '21 Oct', date: '2026-10-21', deposits: 7500, withdrawals: 5800, balance: 6000, loans: 2000 },
  { label: '22 Oct', date: '2026-10-22', deposits: 7200, withdrawals: 5600, balance: 6100, loans: 1950 },
  { label: '23 Oct', date: '2026-10-23', deposits: 6800, withdrawals: 5300, balance: 6000, loans: 1850 },
  { label: '24 Oct', date: '2026-10-24', deposits: 6400, withdrawals: 5000, balance: 5900, loans: 1750 },
  { label: '25 Oct', date: '2026-10-25', deposits: 6200, withdrawals: 4800, balance: 5900, loans: 1700 },
  { label: '26 Oct', date: '2026-10-26', deposits: 6800, withdrawals: 5200, balance: 6100, loans: 1800 },
  { label: '27 Oct', date: '2026-10-27', deposits: 7600, withdrawals: 5900, balance: 6400, loans: 2050 },
  { label: '28 Oct', date: '2026-10-28', deposits: 8400, withdrawals: 6500, balance: 6800, loans: 2300 },
  { label: '29 Oct', date: '2026-10-29', deposits: 9200, withdrawals: 7200, balance: 7300, loans: 2500 },
  { label: '30 Oct', date: '2026-10-30', deposits: 10200, withdrawals: 8000, balance: 7900, loans: 2800 },
  { label: '31 Oct', date: '2026-10-31', deposits: 11200, withdrawals: 8800, balance: 8600, loans: 3100 },
]

// "Today": hourly fee income
export const revenueToday: RevenuePoint[] = [
  { label: '00:00', date: '2026-10-08', revenue: 8 },
  { label: '02:00', date: '2026-10-08', revenue: 4 },
  { label: '04:00', date: '2026-10-08', revenue: 3 },
  { label: '06:00', date: '2026-10-08', revenue: 22 },
  { label: '08:00', date: '2026-10-08', revenue: 68 },
  { label: '10:00', date: '2026-10-08', revenue: 94 },
  { label: '12:00', date: '2026-10-08', revenue: 108 },
  { label: '14:00', date: '2026-10-08', revenue: 86 },
  { label: '16:00', date: '2026-10-08', revenue: 97 },
  { label: '18:00', date: '2026-10-08', revenue: 79 },
  { label: '20:00', date: '2026-10-08', revenue: 52 },
  { label: '22:00', date: '2026-10-08', revenue: 24 },
]

// "Week": last 7 days
export const revenueWeek: RevenuePoint[] = [
  { label: 'Mon', date: '2026-10-02', revenue: 1080 },
  { label: 'Tue', date: '2026-10-03', revenue: 1240 },
  { label: 'Wed', date: '2026-10-04', revenue: 1150 },
  { label: 'Thu', date: '2026-10-05', revenue: 1320 },
  { label: 'Fri', date: '2026-10-06', revenue: 1480 },
  { label: 'Sat', date: '2026-10-07', revenue: 960 },
  { label: 'Sun', date: '2026-10-08', revenue: 1410 },
]

// "30-day": one point per day, Sep 9 to Oct 8 2026
export const revenue30Day: RevenuePoint[] = [
  { label: 'Sep 9', date: '2026-09-09', revenue: 910 },
  { label: 'Sep 10', date: '2026-09-10', revenue: 955 },
  { label: 'Sep 11', date: '2026-09-11', revenue: 880 },
  { label: 'Sep 12', date: '2026-09-12', revenue: 1005 },
  { label: 'Sep 13', date: '2026-09-13', revenue: 930 },
  { label: 'Sep 14', date: '2026-09-14', revenue: 845 },
  { label: 'Sep 15', date: '2026-09-15', revenue: 1020 },
  { label: 'Sep 16', date: '2026-09-16', revenue: 1095 },
  { label: 'Sep 17', date: '2026-09-17', revenue: 1060 },
  { label: 'Sep 18', date: '2026-09-18', revenue: 1130 },
  { label: 'Sep 19', date: '2026-09-19', revenue: 1200 },
  { label: 'Sep 20', date: '2026-09-20', revenue: 1070 },
  { label: 'Sep 21', date: '2026-09-21', revenue: 975 },
  { label: 'Sep 22', date: '2026-09-22', revenue: 1155 },
  { label: 'Sep 23', date: '2026-09-23', revenue: 1220 },
  { label: 'Sep 24', date: '2026-09-24', revenue: 1270 },
  { label: 'Sep 25', date: '2026-09-25', revenue: 1185 },
  { label: 'Sep 26', date: '2026-09-26', revenue: 1110 },
  { label: 'Sep 27', date: '2026-09-27', revenue: 1030 },
  { label: 'Sep 28', date: '2026-09-28', revenue: 1240 },
  { label: 'Sep 29', date: '2026-09-29', revenue: 1300 },
  { label: 'Sep 30', date: '2026-09-30', revenue: 1350 },
  { label: 'Oct 1', date: '2026-10-01', revenue: 1280 },
  { label: 'Oct 2', date: '2026-10-02', revenue: 1080 },
  { label: 'Oct 3', date: '2026-10-03', revenue: 1240 },
  { label: 'Oct 4', date: '2026-10-04', revenue: 1150 },
  { label: 'Oct 5', date: '2026-10-05', revenue: 1320 },
  { label: 'Oct 6', date: '2026-10-06', revenue: 1480 },
  { label: 'Oct 7', date: '2026-10-07', revenue: 960 },
  { label: 'Oct 8', date: '2026-10-08', revenue: 1410 },
]

export const revenueByRange: Record<VolumeRange, RevenuePoint[]> = {
  today: revenueToday,
  week: revenueWeek,
  '30day': revenue30Day,
}

export interface FeeShare {
  type: string
  value: number
  color: string
}

// Fixed categorical order: matches the palette used on the Overview page
export const feeByChannel: FeeShare[] = [
  { type: 'Wallet Transfer', value: 38, color: 'var(--color-chart-blue)' },
  { type: 'Bank Transfer', value: 24, color: 'var(--color-chart-orange)' },
  { type: 'Cashier Topup', value: 22, color: 'var(--color-chart-aqua)' },
  { type: 'Withdraw', value: 16, color: 'var(--color-chart-amber)' },
]

export type FloatAccountStatus = 'Available' | 'Processing' | 'Blocked'

export interface FloatAccount {
  label: string
  value: number
  status: FloatAccountStatus
  delta?: number
}

export const floatManagement: FloatAccount[] = [
  { label: 'Main Wallet', value: 120450.5, status: 'Available', delta: 4.6 },
  { label: 'Cashier Floats', value: 28750.0, status: 'Available' },
  { label: 'Pending Settlements', value: 5200.0, status: 'Processing' },
  { label: 'Blocked Funds', value: 2000.0, status: 'Blocked' },
]

export type SettlementStatus = 'Settled' | 'Pending' | 'Failed'
export type SettlementDirection = 'Credit' | 'Debit'

export interface Settlement {
  id: string
  date: string
  description: string
  direction: SettlementDirection
  amount: number
  balance: number
  status: SettlementStatus
  officer?: string
}

export const settlements: Settlement[] = [
  { id: 'SET-5012', date: '2026-10-03', description: 'Daily fee settlement: Web App', direction: 'Credit', amount: 1410.0, balance: 86420.5, status: 'Settled', officer: 'Grace Mahundi' },
  { id: 'SET-5011', date: '2026-10-03', description: 'Loan disbursement batch #118', direction: 'Debit', amount: 18500.0, balance: 85010.5, status: 'Settled', officer: 'Victor Lema' },
  { id: 'SET-5010', date: '2026-10-02', description: 'Daily fee settlement: Agent network', direction: 'Credit', amount: 960.0, balance: 103510.5, status: 'Settled', officer: 'Hassan Bakari' },
  { id: 'SET-5009', date: '2026-10-02', description: 'Cashier float replenishment: Kariakoo', direction: 'Debit', amount: 5000.0, balance: 102550.5, status: 'Settled', officer: 'Joseph Mkude' },
  { id: 'SET-5008', date: '2026-10-01', description: 'Loan repayment collection batch', direction: 'Credit', amount: 6420.0, balance: 107550.5, status: 'Settled', officer: 'Neema Chuwa' },
  { id: 'SET-5007', date: '2026-10-01', description: 'Operational expense: core banking fees', direction: 'Debit', amount: 1120.0, balance: 101130.5, status: 'Settled', officer: 'Grace Mahundi' },
  { id: 'SET-5006', date: '2026-09-30', description: 'Daily fee settlement: Web App', direction: 'Credit', amount: 1350.0, balance: 102250.5, status: 'Settled', officer: 'Hassan Bakari' },
  { id: 'SET-5005', date: '2026-09-30', description: 'Loan disbursement batch #117', direction: 'Debit', amount: 22400.0, balance: 100900.5, status: 'Pending', officer: 'Victor Lema' },
  { id: 'SET-5004', date: '2026-09-29', description: 'Daily fee settlement: USSD', direction: 'Credit', amount: 1300.0, balance: 123300.5, status: 'Settled', officer: 'Neema Chuwa' },
  { id: 'SET-5003', date: '2026-09-29', description: 'Cashier float replenishment: Mwanza', direction: 'Debit', amount: 4200.0, balance: 122000.5, status: 'Failed', officer: 'Joseph Mkude' },
]
