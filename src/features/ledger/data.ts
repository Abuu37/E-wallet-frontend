import {
  transactions,
  isCashierServed,
  getRecognizedFee,
  getCommission,
  type Transaction,
} from '../transactions/data'
import type { Customer } from '../customers/data'
import type { Cashier } from '../cashiers/data'

export type AccountCategory = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'
export type PostingStatus = 'Posted' | 'Pending'

export interface Account {
  id: string
  name: string
  category: AccountCategory
}

export interface JournalLine {
  accountId: string
  accountName: string
  debit: number
  credit: number
}

export interface JournalEntry {
  id: string
  timestamp: string
  referenceTxnId: string
  status: PostingStatus
  description: string
  lines: JournalLine[]
}

// Captured from the real bank statement at the last reconciliation — independent of the
// live ledger below. In a production system this would come from a bank-feed sync instead
// of being a fixed snapshot; here it's set to match what the ledger computed at that moment,
// so the reconciliation below can genuinely drift if the transaction data changes later
// without this snapshot being refreshed.
export const TRUST_ACCOUNT_BALANCE = 3_800_000

export const chartOfAccounts: Account[] = [
  { id: '1020', name: 'Loans Receivable', category: 'Asset' },
  { id: '2000', name: 'Customer Wallet', category: 'Liability' },
  { id: '2005', name: 'Cashier Float Wallet', category: 'Liability' },
  { id: '2010', name: 'Cashier Commission Wallet', category: 'Liability' },
  { id: '2020', name: 'Tax Payable', category: 'Liability' },
  { id: '4000', name: 'Fee Income', category: 'Revenue' },
  { id: '5000', name: 'Commission Expense', category: 'Expense' },
]

// Placeholder excise duty rate on fee income, owed to TRA — swap for the real rate when known.
const TAX_RATE = 0.1

const accountName = (id: string) => chartOfAccounts.find((account) => account.id === id)?.name ?? id

const round2 = (value: number) => Math.round(value * 100) / 100

/** The excise tax portion of a transaction's recognized fee (0 if no fee was recognized). */
export const getTax = (tx: Transaction) => round2(getRecognizedFee(tx) * TAX_RATE)

// Who the line belongs to (which customer, which cashier) is already explained by the
// entry's Memo — the line itself only needs the account.
const walletLine = (debit: number, credit: number): JournalLine => ({
  accountId: '2000',
  accountName: accountName('2000'),
  debit,
  credit,
})

const cashierFloatLine = (debit: number, credit: number): JournalLine => ({
  accountId: '2005',
  accountName: accountName('2005'),
  debit,
  credit,
})

/** Splits a recognized fee into net Fee Income and the excise tax owed on it, as matched credit lines. */
const feeLines = (fee: number): JournalLine[] => {
  if (fee <= 0) return []
  const tax = round2(fee * TAX_RATE)
  const netFee = fee - tax
  return [
    { accountId: '4000', accountName: accountName('4000'), debit: 0, credit: netFee },
    { accountId: '2020', accountName: accountName('2020'), debit: 0, credit: tax },
  ]
}

const describe = (tx: Transaction) => {
  switch (tx.type) {
    case 'Cash In':
      return `Cash deposit via ${tx.channel} — served by ${tx.recipientName ?? 'cashier'}`
    case 'Cash Out':
      return `Cash withdrawal via ${tx.channel} — served by ${tx.recipientName ?? 'cashier'}`
    case 'W2W':
      return `Wallet-to-wallet transfer to ${tx.recipientName ?? 'recipient'}`
    case 'Loan Disbursement':
      return `Loan disbursement — ${tx.recipientName ?? 'loan account'}`
    case 'Loan Repayment':
      return `Loan repayment — ${tx.recipientName ?? 'loan account'}`
    default:
      return 'Transaction'
  }
}

/**
 * Builds the balanced double-entry lines for a transaction. Debits always equal credits
 * by construction.
 *
 * Cash In/Out move between the cashier's own float wallet and the customer's wallet — the
 * cashier is advancing (or reclaiming) their float e-money against the customer's balance,
 * so the two liability wallets move against each other rather than touching a cash/bank
 * asset account.
 */
const buildLines = (tx: Transaction): JournalLine[] => {
  const lines: JournalLine[] = []
  const fee = getRecognizedFee(tx)
  const commission = getCommission(tx)

  switch (tx.type) {
    case 'Cash In':
      lines.push(cashierFloatLine(tx.amount, 0))
      lines.push(walletLine(0, tx.amount - fee))
      lines.push(...feeLines(fee))
      break
    case 'Cash Out':
      lines.push(walletLine(tx.amount, 0))
      lines.push(cashierFloatLine(0, tx.amount - fee))
      lines.push(...feeLines(fee))
      break
    case 'W2W':
      lines.push(walletLine(tx.amount + fee, 0))
      lines.push(walletLine(0, tx.amount))
      lines.push(...feeLines(fee))
      break
    case 'Loan Disbursement':
      lines.push({ accountId: '1020', accountName: accountName('1020'), debit: tx.amount, credit: 0 })
      lines.push(walletLine(0, tx.amount))
      break
    case 'Loan Repayment':
      lines.push(walletLine(tx.amount, 0))
      lines.push({ accountId: '1020', accountName: accountName('1020'), debit: 0, credit: tx.amount })
      break
  }

  if (commission > 0 && isCashierServed(tx)) {
    lines.push({ accountId: '5000', accountName: accountName('5000'), debit: commission, credit: 0 })
    lines.push({ accountId: '2010', accountName: accountName('2010'), debit: 0, credit: commission })
  }

  return lines
}

/** One journal entry per transaction. Failed transactions never post — nothing moved. */
export const journalEntries: JournalEntry[] = transactions
  .filter((tx) => tx.status !== 'Failed')
  .map((tx) => ({
    id: `JE-${tx.id.replace('TXN-', '')}`,
    timestamp: `${tx.date}T${tx.time}:00Z`,
    referenceTxnId: tx.id,
    status: (tx.status === 'Successful' ? 'Posted' : 'Pending') as PostingStatus,
    description: describe(tx),
    lines: buildLines(tx),
  }))
  .sort((a, b) => b.timestamp.localeCompare(a.timestamp))

export const getEntryTotals = (entry: JournalEntry) => {
  const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0)
  return { totalDebit, totalCredit }
}

/** Running balance for an account, using its normal-balance side (debit for Asset/Expense, credit otherwise). */
export const getAccountBalance = (account: Account) => {
  let totalDebit = 0
  let totalCredit = 0
  for (const entry of journalEntries) {
    for (const line of entry.lines) {
      if (line.accountId === account.id) {
        totalDebit += line.debit
        totalCredit += line.credit
      }
    }
  }
  const isDebitNormal = account.category === 'Asset' || account.category === 'Expense'
  return isDebitNormal ? totalDebit - totalCredit : totalCredit - totalDebit
}

const resolveTx = (entry: JournalEntry) => transactions.find((tx) => tx.id === entry.referenceTxnId)

/**
 * Net Customer Wallet (2000) movement a specific customer's own transactions contributed to the
 * ledger. W2W entries carry both a sender's debit and a recipient's credit on the same entry, so
 * only the line matching this customer's role (sender vs. recipient) is counted — otherwise a W2W
 * transfer would double-count into both parties' movement. Every other transaction type only ever
 * touches one customer, so its single 2000 line is taken whichever side it's on.
 */
export const getCustomerLedgerMovement = (customerId: string) => {
  let movement = 0
  for (const entry of journalEntries) {
    const tx = resolveTx(entry)
    if (!tx) continue
    for (const line of entry.lines) {
      if (line.accountId !== '2000') continue
      const included =
        tx.type === 'W2W'
          ? (tx.customerId === customerId && line.debit > 0) ||
            (tx.recipientCustomerId === customerId && line.credit > 0)
          : tx.customerId === customerId
      if (included) movement += line.credit - line.debit
    }
  }
  return movement
}

/**
 * Net Cashier Float Wallet (2005) movement a specific cashier's float account contributed to the
 * ledger. Cash In/Cash Out only ever touch one cashier's float per transaction, so no
 * sender/recipient split is needed here.
 */
export const getCashierLedgerMovement = (floatAccount: string) => {
  let movement = 0
  for (const entry of journalEntries) {
    const tx = resolveTx(entry)
    if (!tx || tx.recipientAccount !== floatAccount) continue
    for (const line of entry.lines) {
      if (line.accountId === '2005') movement += line.credit - line.debit
    }
  }
  return movement
}

/** A customer's displayed wallet balance: their opening balance plus their own ledger movement. */
export const getCustomerBalance = (customer: Customer) =>
  customer.openingBalance + getCustomerLedgerMovement(customer.id)

/** A cashier's displayed float balance: their opening float plus their own ledger movement. */
export const getCashierFloatBalance = (cashier: Cashier) =>
  cashier.openingFloatBalance + getCashierLedgerMovement(cashier.floatAccount)
