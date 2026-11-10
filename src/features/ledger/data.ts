import { transactions, isAgentServed, getRecognizedFee, getCommission } from '../transactions/data'
import type { Transaction } from '../transactions/data'
import { customers } from '../customers/data'
import type { Customer } from '../customers/data'
import { agents } from '../agents/data'
import type { Agent } from '../agents/data'

export type AccountCategory = 'Asset' | 'Liability' | 'Revenue' | 'Expense'

export interface Account {
  id: string
  name: string
  category: AccountCategory
}

export interface LedgerLine {
  accountId: string
  accountName: string
  debit: number
  credit: number
}

export interface JournalEntry {
  id: string
  timestamp: string
  referenceTxnId: string
  status: 'Posted' | 'Pending'
  description: string
  lines: LedgerLine[]
}

export const chartOfAccounts: Account[] = [
  { id: '1010', name: 'Bank Account', category: 'Asset' },
  { id: '1020', name: 'Loans Receivable', category: 'Asset' },
  { id: '2000', name: 'Customer Wallet', category: 'Liability' },
  { id: '2005', name: 'Agent Float Wallet', category: 'Liability' },
  { id: '2010', name: 'Agent Commission Wallet', category: 'Liability' },
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

// Who the line belongs to (which customer, which agent) is already explained by the
// entry's Memo — the line itself only needs the account.
const walletLine = (debit: number, credit: number): LedgerLine => ({
  accountId: '2000',
  accountName: accountName('2000'),
  debit,
  credit,
})

const agentFloatLine = (debit: number, credit: number): LedgerLine => ({
  accountId: '2005',
  accountName: accountName('2005'),
  debit,
  credit,
})

// W2B pays out to a real external bank account, so — unlike Cash In/Out, which only ever
// move between two internal liability wallets — it needs an actual asset account on the
// other side of the entry: the company's own bank balance genuinely decreases.
const bankAccountLine = (debit: number, credit: number): LedgerLine => ({
  accountId: '1010',
  accountName: accountName('1010'),
  debit,
  credit,
})

/** Splits a recognized fee into net Fee Income and the excise tax owed on it, as matched credit lines. */
const feeLines = (fee: number): LedgerLine[] => {
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
      return `Cash deposit via ${tx.channel} — served by ${tx.recipientName ?? 'agent'}`
    case 'Cash Out':
      return `Cash withdrawal via ${tx.channel} — served by ${tx.recipientName ?? 'agent'}`
    case 'W2B':
      return `Wallet-to-bank withdrawal to ${tx.recipientName ?? 'bank account'}`
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
 * Cash In/Out move between the agent's own float wallet and the customer's wallet — the
 * agent is advancing (or reclaiming) their float e-money against the customer's balance,
 * so the two liability wallets move against each other rather than touching a cash/bank
 * asset account.
 */
const buildLines = (tx: Transaction): LedgerLine[] => {
  const lines: LedgerLine[] = []
  const fee = getRecognizedFee(tx)
  const commission = getCommission(tx)

  switch (tx.type) {
    case 'Cash In':
      lines.push(agentFloatLine(tx.amount, 0))
      lines.push(walletLine(0, tx.amount - fee))
      lines.push(...feeLines(fee))
      break
    case 'Cash Out':
      lines.push(walletLine(tx.amount, 0))
      lines.push(agentFloatLine(0, tx.amount - fee))
      lines.push(...feeLines(fee))
      break
    case 'W2B':
      lines.push(walletLine(tx.amount, 0))
      lines.push(bankAccountLine(0, tx.amount - fee))
      lines.push(...feeLines(fee))
      break
    case 'W2W':
      lines.push(walletLine(tx.amount + fee, 0))
      lines.push(walletLine(0, tx.amount))
      lines.push(...feeLines(fee))
      break
    case 'Loan Disbursement':
      lines.push({
        accountId: '1020',
        accountName: accountName('1020'),
        debit: tx.amount,
        credit: 0,
      })
      lines.push(walletLine(0, tx.amount))
      break
    case 'Loan Repayment':
      lines.push(walletLine(tx.amount, 0))
      lines.push({
        accountId: '1020',
        accountName: accountName('1020'),
        debit: 0,
        credit: tx.amount,
      })
      break
  }

  if (commission > 0 && isAgentServed(tx)) {
    lines.push({
      accountId: '5000',
      accountName: accountName('5000'),
      debit: commission,
      credit: 0,
    })
    lines.push({
      accountId: '2010',
      accountName: accountName('2010'),
      debit: 0,
      credit: commission,
    })
  }

  return lines
}

// Every customer's/agent's starting balance (opening-balance + ledger-movement model) has to
// be backed by real cash from day one — this is the single opening entry that funds all of it
// out of the Bank Account, computed live from the actual seed data so it can never drift out of
// sync with customers/data.ts or agents/data.ts.
const OPENING_CUSTOMER_WALLET_TOTAL = customers.reduce((sum, c) => sum + c.openingBalance, 0)
const OPENING_AGENT_FLOAT_TOTAL = agents.reduce((sum, c) => sum + c.openingFloatBalance, 0)

const openingBalanceEntry: JournalEntry = {
  id: 'JE-OPENING',
  timestamp: '2026-08-31T00:00:00Z',
  referenceTxnId: 'OPENING-BALANCE',
  status: 'Posted',
  description:
    'Opening balances — trust account funding for all customer wallets and agent floats as of go-live',
  lines: [
    {
      accountId: '1010',
      accountName: accountName('1010'),
      debit: OPENING_CUSTOMER_WALLET_TOTAL + OPENING_AGENT_FLOAT_TOTAL,
      credit: 0,
    },
    {
      accountId: '2000',
      accountName: accountName('2000'),
      debit: 0,
      credit: OPENING_CUSTOMER_WALLET_TOTAL,
    },
    {
      accountId: '2005',
      accountName: accountName('2005'),
      debit: 0,
      credit: OPENING_AGENT_FLOAT_TOTAL,
    },
  ],
}

// The date of the last real bank statement this trust balance was checked against. Shared by
// every screen that displays it, so they can't silently disagree on when it's from.
export const RECONCILED_AT = '2026-10-22 08:00'

// What the real bank statement said at RECONCILED_AT — independent of the live ledger below.
// In a production system this comes from a bank-feed sync, not a derived value; here it's
// computed from the same opening entry above purely because, in this mock dataset, nothing
// else touches the Bank Account before RECONCILED_AT (the only other Bank Account activity —
// W2B withdrawals — is dated after it). It is NOT recomputed from live ledger activity, so it
// genuinely drifts from the live Bank Account balance once something happens after this date,
// exactly like a real statement would until the next one arrives.
export const TRUST_ACCOUNT_BALANCE = OPENING_CUSTOMER_WALLET_TOTAL + OPENING_AGENT_FLOAT_TOTAL

/** One journal entry per transaction, plus the opening entry above. Failed transactions never post — nothing moved. */
export const journalEntries: JournalEntry[] = [
  openingBalanceEntry,
  ...transactions
    .filter((tx) => tx.status !== 'Failed')
    .map((tx) => ({
      id: `JE-${tx.id.replace('TXN-', '')}`,
      timestamp: `${tx.date}T${tx.time}:00Z`,
      referenceTxnId: tx.id,
      status: (tx.status === 'Successful' ? 'Posted' : 'Pending') as JournalEntry['status'],
      description: describe(tx),
      lines: buildLines(tx),
    })),
].sort((a, b) => b.timestamp.localeCompare(a.timestamp))

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
 * Net Agent Float Wallet (2005) movement a specific agent's float account contributed to the
 * ledger. Cash In/Cash Out only ever touch one agent's float per transaction, so no
 * sender/recipient split is needed here.
 */
export const getAgentLedgerMovement = (floatAccount: string) => {
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

/** An agent's displayed float balance: their opening float plus their own ledger movement. */
export const getAgentFloatBalance = (agent: Agent) =>
  agent.openingFloatBalance + getAgentLedgerMovement(agent.floatAccount)

/** Every e-money liability the company owes through — wallets, float, commission, and tax withheld. */
export const getEmoneyLiabilities = () =>
  ['2000', '2005', '2010', '2020'].reduce((sum, id) => {
    const account = chartOfAccounts.find((item) => item.id === id)
    return sum + (account ? getAccountBalance(account) : 0)
  }, 0)
