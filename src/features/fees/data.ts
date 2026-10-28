export type FeeApplyType = 'Flat' | 'Percentage'
export type TransactionType = 'Cash In' | 'Cash Out' | 'Transfer'

export const feeOverviewStats = {
  totalFeeRevenue: 45200000,
  totalFeeRevenueDelta: 14,
  netCompanyIncome: 28120000,
  totalCommissions: 17080000,
  activeCashiers: 5,
}

export interface FeeTier {
  id: string
  type: FeeApplyType
  transactionType: TransactionType
  rangeMin: number
  rangeMax: number
  customerFee: number
}

// Tiers are contiguous — each one's rangeMin picks up exactly where the previous rangeMax left
// off (+1), so every possible amount falls in exactly one tier with no gaps between them.
export const feeTiers: FeeTier[] = [
  { id: 'TIER-1', type: 'Flat', transactionType: 'Cash In', rangeMin: 1000, rangeMax: 10000, customerFee: 500 },
  { id: 'TIER-2', type: 'Flat', transactionType: 'Cash In', rangeMin: 10001, rangeMax: 20000, customerFee: 1000 },
  { id: 'TIER-3', type: 'Flat', transactionType: 'Cash In', rangeMin: 20001, rangeMax: 50000, customerFee: 1500 },
  { id: 'TIER-4', type: 'Flat', transactionType: 'Cash In', rangeMin: 50001, rangeMax: 100000, customerFee: 2000 },
  { id: 'TIER-5', type: 'Flat', transactionType: 'Cash In', rangeMin: 100001, rangeMax: 500000, customerFee: 2500 },
  { id: 'TIER-6', type: 'Flat', transactionType: 'Cash In', rangeMin: 500001, rangeMax: 1000000, customerFee: 3000 },
  { id: 'TIER-7', type: 'Flat', transactionType: 'Cash In', rangeMin: 1000001, rangeMax: 5000000, customerFee: 3500 },
  { id: 'TIER-8', type: 'Flat', transactionType: 'Cash Out', rangeMin: 1000, rangeMax: 10000, customerFee: 1000 },
  { id: 'TIER-9', type: 'Flat', transactionType: 'Cash Out', rangeMin: 10001, rangeMax: 20000, customerFee: 2000 },
  { id: 'TIER-10', type: 'Flat', transactionType: 'Cash Out', rangeMin: 20001, rangeMax: 50000, customerFee: 3000 },
  { id: 'TIER-11', type: 'Flat', transactionType: 'Cash Out', rangeMin: 50001, rangeMax: 100000, customerFee: 4000 },
  { id: 'TIER-12', type: 'Flat', transactionType: 'Cash Out', rangeMin: 100001, rangeMax: 500000, customerFee: 5000 },
  { id: 'TIER-13', type: 'Flat', transactionType: 'Cash Out', rangeMin: 500001, rangeMax: 1000000, customerFee: 6000 },
  { id: 'TIER-14', type: 'Flat', transactionType: 'Cash Out', rangeMin: 1000001, rangeMax: 5000000, customerFee: 7000 },
  { id: 'TIER-15', type: 'Flat', transactionType: 'Transfer', rangeMin: 1000, rangeMax: 10000, customerFee: 300 },
  { id: 'TIER-16', type: 'Flat', transactionType: 'Transfer', rangeMin: 10001, rangeMax: 20000, customerFee: 600 },
  { id: 'TIER-17', type: 'Flat', transactionType: 'Transfer', rangeMin: 20001, rangeMax: 50000, customerFee: 900 },
  { id: 'TIER-18', type: 'Flat', transactionType: 'Transfer', rangeMin: 50001, rangeMax: 100000, customerFee: 1200 },
  { id: 'TIER-19', type: 'Flat', transactionType: 'Transfer', rangeMin: 100001, rangeMax: 500000, customerFee: 1500 },
  { id: 'TIER-20', type: 'Flat', transactionType: 'Transfer', rangeMin: 500001, rangeMax: 1000000, customerFee: 1800 },
  { id: 'TIER-21', type: 'Flat', transactionType: 'Transfer', rangeMin: 1000001, rangeMax: 5000000, customerFee: 2100 },
]
