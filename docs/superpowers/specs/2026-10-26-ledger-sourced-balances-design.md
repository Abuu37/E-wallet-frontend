# Ledger as Source of Truth for Customer/Cashier Balances

## Intent and why

Today, `customers[].balance` and `cashiers[].floatBalance` (in `src/features/customers/data.ts`
and `src/features/cashiers/data.ts`) are independently-authored static mock numbers. They have no
relationship to `transactions/data.ts` or the double-entry ledger in `ledger/data.ts`
(`chartOfAccounts`, `getAccountBalance`). This was discovered while wiring the Financial screen's
Float Management panel: the ledger-derived Customer Wallet / Cashier Float totals (TSh 3,699,550 /
TSh 95,800) disagree sharply with the sums of the static per-record fields (TSh 39,822 / TSh
559,500), because the ledger is built from only 18 sample transactions covering a handful of
accounts, while the static fields represent all 15 customers and 15 cashiers.

In a real digital wallet system, the ledger is always the single source of truth for balances —
never a separately-maintained field — because that's the only way a balance stays provably
reconstructable from transaction history and can't silently drift. This document plans how to
move this app toward that model without a backend, using an "opening balance + ledger movement"
approach instead of rewriting the entire mock transaction history.

## Goals

- Every customer's displayed wallet balance = their `openingBalance` + their own ledger-derived
  net movement from `transactions`.
- Every cashier's displayed float balance = their `openingFloatBalance` + their own ledger-derived
  net movement.
- The Financial screen's Float Management "Customer Wallet" / "Cashier Float" rows become the sum
  of the above across all customers/cashiers, so Financial, Customers, and Cashiers pages always
  agree with each other.
- Adding a new transaction to `transactions/data.ts` visibly and correctly moves the right
  customer's and cashier's balance everywhere it's displayed.

## Non-goals

- Not rebuilding a complete, exhaustive transaction history for every account.
- Not introducing a real backend/API.
- Not changing the Company Wallet / Ledger pages' existing whole-account aggregate calculations
  (`getAccountBalance` for system-wide totals stays as is) — this plan adds new scoped functions
  alongside it, it doesn't replace it.
- Not resolving whether `journalEntries` should include `Pending` transactions (a separate,
  already-flagged question) — out of scope unless raised again.

## Anti-goals

- Numbers that can silently diverge again after this change (e.g. a new transaction added without
  a corresponding opening-balance consideration) — the whole point is that this can't happen once
  wired correctly.
- A visible jump in today's displayed balances with no explanation — opening balances must be
  chosen so current numbers stay put except where the existing 18-transaction sample already
  implies a change for that specific account.

## Constraints

- Frontend-only, static mock data, no API.
- No component styling/UI layout changes beyond swapping a data source.
- Derived money math stays in `data.ts` files as exported pure functions, matching existing
  conventions (`getRecognizedFee`, `getCommission`, `getNetRevenue`, `getAccountBalance`) — not
  inlined in page components.

## The plan

### Step 1 — Add a stable join key between transactions and customers

File: `src/features/transactions/data.ts`

- Add `customerId?: string` to the `Transaction` interface, referencing a `Customer.id`
  (e.g. `CUS-1003`) — this is always the *sender/initiator* of the transaction (the existing
  `customer`/`phone` fields).
- **W2W only**: also add `recipientCustomerId?: string`, looked up from the recipient's phone
  (`recipientAccount` for a W2W row is the recipient's phone number) against `customers/data.ts`.
  This is necessary because a W2W transaction posts two `2000` (Customer Wallet) lines in one
  journal entry — a debit for the sender, a credit for the recipient — and without a second join
  key the recipient's share of the money is unattributed to anyone. (Confirmed by the builder
  check: this already breaks Grace Mwangi's numbers in the current 18-row sample, where she
  receives TXN-98209 as recipient but has no `customerId` match on it.)
- Backfill both fields on the 18 existing mock transactions by matching `phone` to the matching
  customer's `phone` in `customers/data.ts`.
- Cashier-side transactions (Cash In/Cash Out) already carry a stable cashier join key via
  `recipientAccount` (the float account code, e.g. `FA-384021`) — no change needed there.

### Step 2 — Convert static balances into opening balances

Files: `src/features/customers/data.ts`, `src/features/cashiers/data.ts`,
`src/features/transactions/data.ts`

- **Fix a confirmed data bug first**: `TXN-98213` (Loan Disbursement, references loan `LN-3001`)
  and `TXN-98214` (Loan Repayment, references loan `LN-3012`) carry amounts of 5,000,000 and
  1,200,000 — but `LN-3001` and `LN-3012` both have `principal: 5000.0` in
  `src/features/loans/data.ts`. Change both transaction amounts to `5000` to match the loan
  records they actually reference.
- Rename `Customer.balance` to `Customer.openingBalance`. Rename `Cashier.floatBalance` to
  `Cashier.openingFloatBalance`.
- **Opening balance rule**: `openingBalance = Math.max(0, currentBalance - ledgerMovement)`, where
  `ledgerMovement` is what `getCustomerLedgerMovement`/`getCashierLedgerMovement` (Step 3) return
  for that record against the (now loan-amount-corrected) 18-transaction sample. This keeps a
  record's displayed balance (`opening + movement`) identical to today's number whenever that's
  achievable without a negative opening balance; where it isn't (movement exceeds the current
  balance), it clamps the opening balance to `0` and accepts the real, ledger-true number instead
  of forcing an impossible negative "balance before tracking began."
  - Customers whose displayed balance changes under this rule: Grace Mwangi (15,320.00 →
    70,000.00), Peter Mushi (125.00 → 35,000.00), Daniel Kessy (640.20 → 12,500.00), Imani Mbwana
    (0.00 → 19,000.00), Salma Rajab (5,420.30 → 10,500.00). The other 10 customers are unchanged.
  - Cashiers whose displayed float changes: Mwajuma Hassan (62,000.00 → 69,300.00), Elias
    Mwakalinga (0.00 → 59,200.00). The other 13 cashiers are unchanged.
  - Every other customer/cashier gets `openingBalance`/`openingFloatBalance` set to their exact
    current displayed value (ledger movement for them is `0`, since they never appear in the
    transaction sample, or their movement nets to something the current balance already absorbs).

### Step 3 — Add scoped ledger balance functions

File: `src/features/ledger/data.ts`

- `getCustomerLedgerMovement(customerId: string): number` — walks `journalEntries`, resolves each
  entry's underlying transaction via `referenceTxnId`, and for each entry takes:
  - If `tx.type === 'W2W'` **and** `tx.customerId === customerId`: only the **debit** line on
    account `2000` (the sender's side of the entry).
  - If `tx.type === 'W2W'` **and** `tx.recipientCustomerId === customerId`: only the **credit**
    line on account `2000` (the recipient's side).
  - For every other transaction type (Cash In, Cash Out, Loan Disbursement, Loan Repayment) where
    `tx.customerId === customerId`: the single `2000` line that entry has, whichever side
    (debit or credit) it is on — these types never split across two customers, so there's no
    attribution ambiguity and no double-count risk.

  The debit/credit split only exists to disambiguate W2W's two-line entries; applying it to
  single-line entry types would wrongly exclude Cash In's credit line or Loan Disbursement's
  credit line from that customer's own movement. Sum (credit − debit) across everything matched
  to get the net movement.
- `getCashierLedgerMovement(floatAccount: string): number` — same idea, scoped to Cashier Float
  (`2005`) lines for transactions where `recipientAccount === floatAccount`. No sender/recipient
  split needed here — Cash In/Cash Out only ever touch one cashier's float.
- `getCustomerBalance(customer: Customer): number` = `customer.openingBalance +
  getCustomerLedgerMovement(customer.id)`.
- `getCashierFloatBalance(cashier: Cashier): number` = `cashier.openingFloatBalance +
  getCashierLedgerMovement(cashier.floatAccount)`.

### Step 4 — Point every screen at the computed balance, and remove manual balance entry

Files: `src/features/customers/pages/Customers.tsx`, `src/features/cashiers/pages/Cashiers.tsx`,
`src/features/cashiers/pages/CashierRegisterForm.tsx`, `src/features/customers/status.ts`,
`src/features/financial/pages/Financial.tsx`, and any other reader of `.balance` /
`.floatBalance`.

- Replace direct reads of `customer.balance` with `getCustomerBalance(customer)`, including
  `src/features/customers/status.ts` (`customer.balance === 0` check) and any sorting/filtering
  logic.
- Replace direct reads of `cashier.floatBalance` with `getCashierFloatBalance(cashier)`.
- Financial's Float Management: "Customer Wallet" row = sum of `getCustomerBalance(c)` over all
  customers; "Cashier Float" row = sum of `getCashierFloatBalance(c)` over all cashiers.
- **Remove the manual balance-entry inputs**, since balance is no longer a field anyone sets
  directly:
  - `Customers.tsx`'s edit modal: drop the "Wallet balance" input and the `editBalance` state /
    `saveEdit` write to `balance`. A customer's balance only changes via real transactions from
    here on.
  - `CashierRegisterForm.tsx`: drop the "Assigned float" input and its write to `floatBalance`.
    A new cashier starts with whatever `openingFloatBalance` the builder seeds (likely `0` for a
    brand-new cashier, since "Top-Up Cashier Float" — the quick action already linked from the
    Financial screen — is the intended real path for giving a cashier float going forward, even
    though actually wiring that action up to post a transaction is its own follow-up, not part of
    this plan).
- Grep for every remaining `.balance` / `.floatBalance` reference first so nothing is missed.

### Step 5 — Verify

- Script-check (same approach used earlier in this session): sum of computed customer balances
  should equal the current static total by construction (Step 2's adjustment is designed for
  this); same for cashiers.
- `tsc --noEmit` clean.
- Manually check one customer who IS in the transaction sample (e.g. Asha Juma) — balance should
  reflect her Cash In/Loan activity. Check one who ISN'T (e.g. Daniel Kessy) — balance should be
  unchanged (opening balance only, zero ledger movement).

## What's left to the builder

- Exact function names/organization within `ledger/data.ts`.
- Whether `getCustomerBalance`/`getCashierFloatBalance` take the full record or just an id — take
  the full record, consistent with the existing `getAccountBalance(account)` pattern.

## What needs confirmation before/while building

- The per-account opening-balance adjustments computed in Step 2 — these will be shown for review
  before being committed to the seed data.

## Decisions made during review

A builder-check pass flagged two gaps that materially affected Steps 1, 3, and 4; both are now
folded into the plan above.

- **W2W recipient attribution**: resolved by adding `recipientCustomerId` alongside `customerId`
  (Step 1), and having the scoped ledger function pick the correct debit/credit line per role
  (Step 3), rather than tagging every journal line individually.
- **Manual balance-entry fields**: resolved by removing them (Step 4) — consistent with this
  document's own premise that balance should never be a separately-set field.
