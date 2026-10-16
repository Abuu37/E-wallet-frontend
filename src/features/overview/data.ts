export type VolumeRange = 'today' | 'week' | '30day'

export interface VolumePoint {
  label: string
  date: string
  volume: number
}

export const overviewStats = {
  totalCashiers: 48,
  totalCashiersDelta: 4.0,
  totalCustomers: 12480,
  totalCustomersDelta: 4.2,
  totalWalletBalance: 482350.75,
  totalWalletBalanceDelta: 9.3,
  totalTransactions: 48210,
  totalTransactionsDelta: 6.4,
  todaysTransactions: 1284,
  todaysTransactionsDelta: -2.1,
}

// "Today": hourly buckets
export const volumeToday: VolumePoint[] = [
  { label: '00:00', date: '2026-10-08', volume: 18 },
  { label: '02:00', date: '2026-10-08', volume: 9 },
  { label: '04:00', date: '2026-10-08', volume: 6 },
  { label: '06:00', date: '2026-10-08', volume: 42 },
  { label: '08:00', date: '2026-10-08', volume: 128 },
  { label: '10:00', date: '2026-10-08', volume: 165 },
  { label: '12:00', date: '2026-10-08', volume: 182 },
  { label: '14:00', date: '2026-10-08', volume: 156 },
  { label: '16:00', date: '2026-10-08', volume: 171 },
  { label: '18:00', date: '2026-10-08', volume: 143 },
  { label: '20:00', date: '2026-10-08', volume: 98 },
  { label: '22:00', date: '2026-10-08', volume: 46 },
]

// "Week": last 7 days
export const volumeWeek: VolumePoint[] = [
  { label: 'Mon', date: '2026-10-02', volume: 980 },
  { label: 'Tue', date: '2026-10-03', volume: 1120 },
  { label: 'Wed', date: '2026-10-04', volume: 1045 },
  { label: 'Thu', date: '2026-10-05', volume: 1210 },
  { label: 'Fri', date: '2026-10-06', volume: 1380 },
  { label: 'Sat', date: '2026-10-07', volume: 860 },
  { label: 'Sun', date: '2026-10-08', volume: 1284 },
]

// "30-day": one point per day, Sep 9 to Oct 8 2026
export const volume30Day: VolumePoint[] = [
  { label: 'Sep 9', date: '2026-09-09', volume: 820 },
  { label: 'Sep 10', date: '2026-09-10', volume: 865 },
  { label: 'Sep 11', date: '2026-09-11', volume: 790 },
  { label: 'Sep 12', date: '2026-09-12', volume: 910 },
  { label: 'Sep 13', date: '2026-09-13', volume: 845 },
  { label: 'Sep 14', date: '2026-09-14', volume: 760 },
  { label: 'Sep 15', date: '2026-09-15', volume: 930 },
  { label: 'Sep 16', date: '2026-09-16', volume: 1005 },
  { label: 'Sep 17', date: '2026-09-17', volume: 970 },
  { label: 'Sep 18', date: '2026-09-18', volume: 1040 },
  { label: 'Sep 19', date: '2026-09-19', volume: 1110 },
  { label: 'Sep 20', date: '2026-09-20', volume: 980 },
  { label: 'Sep 21', date: '2026-09-21', volume: 890 },
  { label: 'Sep 22', date: '2026-09-22', volume: 1065 },
  { label: 'Sep 23', date: '2026-09-23', volume: 1130 },
  { label: 'Sep 24', date: '2026-09-24', volume: 1180 },
  { label: 'Sep 25', date: '2026-09-25', volume: 1095 },
  { label: 'Sep 26', date: '2026-09-26', volume: 1020 },
  { label: 'Sep 27', date: '2026-09-27', volume: 940 },
  { label: 'Sep 28', date: '2026-09-28', volume: 1150 },
  { label: 'Sep 29', date: '2026-09-29', volume: 1210 },
  { label: 'Sep 30', date: '2026-09-30', volume: 1260 },
  { label: 'Oct 1', date: '2026-10-01', volume: 1190 },
  { label: 'Oct 2', date: '2026-10-02', volume: 980 },
  { label: 'Oct 3', date: '2026-10-03', volume: 1120 },
  { label: 'Oct 4', date: '2026-10-04', volume: 1045 },
  { label: 'Oct 5', date: '2026-10-05', volume: 1210 },
  { label: 'Oct 6', date: '2026-10-06', volume: 1380 },
  { label: 'Oct 7', date: '2026-10-07', volume: 860 },
  { label: 'Oct 8', date: '2026-10-08', volume: 1284 },
]

export const volumeByRange: Record<VolumeRange, VolumePoint[]> = {
  today: volumeToday,
  week: volumeWeek,
  '30day': volume30Day,
}

export interface TransactionTypeShare {
  type: string
  value: number
  color: string
}

// Fixed categorical order, validated adjacency (incl. circular pie wrap). Never reassign hues.
export const transactionByType: TransactionTypeShare[] = [
  { type: 'Wallet-to-Wallet', value: 34, color: 'var(--color-chart-blue)' },
  { type: 'Withdraw', value: 22, color: 'var(--color-chart-orange)' },
  { type: 'Cashier Topup', value: 18, color: 'var(--color-chart-aqua)' },
  { type: 'Loan Disbursement', value: 12, color: 'var(--color-chart-amber)' },
  { type: 'Fees', value: 8, color: 'var(--color-chart-magenta)' },
  { type: 'Loan Repayment', value: 6, color: 'var(--color-chart-green)' },
]

export const walletOverview = {
  activeWallets: 9342,
  activeWalletsDelta: 5.1,
  cashierFloat: 128500.0,
  cashierFloatDelta: 2.8,
  newWallets: 186,
  newWalletsDelta: 14.0,
}

export const loanOverview = {
  activeLoans: 1204,
  activeLoansDelta: 3.4,
  repaymentLoans: 960,
  repaymentLoansDelta: 6.1,
  overdueLoans: 54,
  overdueLoansDelta: -8.2,
  disbursed: 312400.0,
  disbursedDelta: 11.5,
}

