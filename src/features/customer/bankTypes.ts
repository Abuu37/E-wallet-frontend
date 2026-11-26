type Amount = number | string

/** A bank the person linked. Never carries a token or a full account number. */
export interface LinkedBank {
  id: string
  institutionName: string | null
  accountName: string | null
  accountMask: string | null
  /** MATCHED, SKIPPED_SANDBOX (demo only) or MISMATCH. */
  nameCheck: 'MATCHED' | 'SKIPPED_SANDBOX' | 'MISMATCH'
  usable: boolean
}

export interface BankBalance { availableTzs: Amount; availableUsd: Amount; usdToTzs: Amount; demo: boolean }

export interface BankMoveResult {
  reference: string; status: string; currency: string; amount: Amount; fee: Amount; total: Amount
  bank: string; nameCheck: LinkedBank['nameCheck']; balanceAfter: Amount; createdAt: string
}

export const DEMO_LABEL = 'Demo: Plaid Sandbox'

export const bankName = (b: Pick<LinkedBank, 'institutionName' | 'accountMask'>) => `${b.institutionName ?? 'Bank'}${b.accountMask ? ` ••${b.accountMask}` : ''}`
