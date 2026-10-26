# Ledger-Sourced Customer/Cashier Balances Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every customer's wallet balance and every cashier's float balance a value computed
from the ledger (opening balance + real transaction movement), instead of an independently-seeded
static field, so the Financial screen's Float Management panel always agrees with the Customers
and Cashiers screens.

**Architecture:** Each `Transaction` gets a `customerId` (and, for W2W, a `recipientCustomerId`)
join key. `ledger/data.ts` gains scoped functions that net a specific customer's or cashier's
`2000`/`2005` journal-line movement from `journalEntries`, then combine that with a seeded
`openingBalance`/`openingFloatBalance` to produce the number every screen displays. The two manual
balance-entry UI inputs are removed, since balance is no longer a field anyone sets directly.

**Tech Stack:** React 19 + TypeScript, Vite, no backend/API, no test framework in this repo
(confirmed via `package.json` — no vitest/jest/testing-library). Verification in this plan uses
`npx tsc --noEmit` for type safety and small throwaway `npx tsx` scripts (run from the shell,
never committed) that assert exact expected numbers against real app data — the same technique
already used earlier in this project's session to validate the Financial screen's wallet-balance
formulas. This substitutes for a unit-test runner that doesn't exist in this codebase.

**Spec:** `docs/superpowers/specs/2026-10-26-ledger-sourced-balances-design.md`

## Global Constraints

- Frontend-only, static mock data — no backend/API work.
- No component styling/UI layout changes beyond swapping a data source and removing two inputs.
- Derived money math stays in `data.ts` files as exported pure functions (matches
  `getRecognizedFee`, `getCommission`, `getNetRevenue`, `getAccountBalance`), never inlined in
  page components.
- `getAccountBalance` and the existing whole-account ledger totals (used by Ledger and Company
  Wallet pages) are not changed — this plan adds new, scoped functions alongside them.

## Review Focus

- **A customer/cashier who never appears in any transaction** must keep displaying their exact
  current balance (`openingBalance` = current value, movement = `0`) — covered by Task 3's
  verification against all 15 customers / 15 cashiers, not just the ones that change.
- **A W2W transaction's recipient side** must not be silently dropped or double-counted — covered
  by Task 2's explicit assertions on Grace Mwangi (`CUS-1003`, a W2W recipient) and John Foxton
  (`CUS-1002`, both a W2W sender on one transaction and recipient on another).
- **A `Failed` transaction** must contribute zero movement (it never posted to the ledger) —
  covered by Task 2's assertion on Grace Mwangi, whose only other activity (`TXN-98210`, a Failed
  Cash Out) must not appear in her movement at all.
- **A `Pending` transaction** must still count (today's `journalEntries` posts anything that isn't
  `Failed`) — covered by Task 2's assertion on Asha Juma (`CUS-1001`), whose movement includes the
  Pending `TXN-98208` Cash In.
- **Removing the manual balance-entry inputs** must not leave orphaned state or dead props behind
  — covered by Task 4's explicit removal of `editBalance` state in `Customers.tsx` and
  `assignedFloat` state/prop plumbing in `CashierRegisterForm.tsx`, verified by `tsc --noEmit`
  (an unused variable or a leftover required prop both fail the build).

---

## File Structure

- **Modify** `src/features/transactions/data.ts` — add `customerId`/`recipientCustomerId` to
  `Transaction`; fix the two loan-amount bugs; backfill both new fields on all 18 rows.
- **Modify** `src/features/ledger/data.ts` — add `getCustomerLedgerMovement`,
  `getCashierLedgerMovement`, `getCustomerBalance`, `getCashierFloatBalance`.
- **Modify** `src/features/customers/data.ts` — rename `balance` → `openingBalance`; set all 15
  seed values to the computed opening balances.
- **Modify** `src/features/cashiers/data.ts` — rename `floatBalance` → `openingFloatBalance`; set
  all 15 seed values to the computed opening float balances.
- **Modify** `src/features/customers/status.ts` — read the computed balance instead of the raw
  field.
- **Modify** `src/features/customers/pages/Customers.tsx` — read `getCustomerBalance(customer)`
  everywhere `customer.balance` was read; remove the "Wallet balance" edit input and its state.
- **Modify** `src/features/cashiers/pages/Cashiers.tsx` — read
  `getCashierFloatBalance(cashier)` everywhere `cashier.floatBalance` was read.
- **Modify** `src/features/cashiers/pages/CashierRegisterForm.tsx` — remove the "Assigned float"
  input and its write to `floatBalance`.
- **Modify** `src/features/financial/pages/Financial.tsx` — Float Management's "Customer Wallet"
  and "Cashier Float" rows sum `getCustomerBalance`/`getCashierFloatBalance` over all
  customers/cashiers, instead of reading whole-account ledger totals.

---

### Task 1: Transaction join keys and the loan-amount fix

**Files:**
- Modify: `src/features/transactions/data.ts`
- Verify: throwaway `npx tsx` script (not committed)

**Interfaces:**
- Produces: `Transaction.customerId?: string`, `Transaction.recipientCustomerId?: string` — later
  tasks filter on these.

- [ ] **Step 1: Add the two optional fields to the `Transaction` interface**

In `src/features/transactions/data.ts`, add to the `Transaction` interface:
```ts
customerId?: string
recipientCustomerId?: string
```

- [ ] **Step 2: Fix the loan-amount bug**

Change `TXN-98213`'s `amount` from `5000000` to `5000` (matches loan `LN-3001`'s
`principal: 5000.0` in `src/features/loans/data.ts`). Change `TXN-98214`'s `amount` from
`1200000` to `5000` (matches loan `LN-3012`'s `principal: 5000.0`).

- [ ] **Step 3: Backfill `customerId` and `recipientCustomerId` on all 18 transactions**

Set these exact values (verified by phone-matching every row against `customers/data.ts`):

| Transaction | customerId | recipientCustomerId |
|---|---|---|
| TXN-98214 | CUS-1003 | — |
| TXN-98213 | CUS-1001 | — |
| TXN-98210 | CUS-1003 | — |
| TXN-98209 | CUS-1002 | CUS-1003 |
| TXN-98208 | CUS-1001 | — |
| TXN-98205 | CUS-1005 | CUS-1006 |
| TXN-98204 | CUS-1004 | — |
| TXN-98202 | CUS-1002 | — |
| TXN-98201 | CUS-1001 | CUS-1002 |
| TXN-97901 | CUS-1004 | — |
| TXN-97902 | CUS-1005 | — |
| TXN-97903 | CUS-1006 | — |
| TXN-97904 | CUS-1007 | — |
| TXN-97905 | CUS-1008 | — |
| TXN-97906 | CUS-1009 | — |
| TXN-97907 | CUS-1010 | — |
| TXN-97908 | CUS-1002 | — |
| TXN-97909 | CUS-1001 | — |

Only W2W rows (`TXN-98209`, `TXN-98205`, `TXN-98201`) get a `recipientCustomerId`.

- [ ] **Step 4: Verify with a throwaway script**

Run (adjust the path to your checkout):
```bash
npx tsx -e "
import { transactions } from './src/features/transactions/data'
const t213 = transactions.find(t => t.id === 'TXN-98213')!
const t214 = transactions.find(t => t.id === 'TXN-98214')!
console.assert(t213.amount === 5000, 'TXN-98213 amount should be 5000')
console.assert(t214.amount === 5000, 'TXN-98214 amount should be 5000')
console.assert(t213.customerId === 'CUS-1001', 'TXN-98213 customerId')
const w2w = transactions.find(t => t.id === 'TXN-98209')!
console.assert(w2w.customerId === 'CUS-1002' && w2w.recipientCustomerId === 'CUS-1003', 'TXN-98209 tags')
console.log('Task 1 checks passed')
"
```
Expected: `Task 1 checks passed` with no assertion output above it.

- [ ] **Step 5: `tsc --noEmit` clean**

Run: `npx tsc --noEmit -p .`
Expected: no output, exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/transactions/data.ts
git commit -m "fix: correct loan transaction amounts and add customer join keys"
```

---

### Task 2: Scoped ledger movement functions

**Files:**
- Modify: `src/features/ledger/data.ts`
- Verify: throwaway `npx tsx` script (not committed)

**Interfaces:**
- Consumes: `Transaction.customerId`/`recipientCustomerId` from Task 1; existing
  `journalEntries`, `chartOfAccounts`, `getAccountBalance` already in this file; existing
  `transactions` import already in this file.
- Produces: `getCustomerLedgerMovement(customerId: string): number`,
  `getCashierLedgerMovement(floatAccount: string): number`,
  `getCustomerBalance(customer: Customer): number`,
  `getCashierFloatBalance(cashier: Cashier): number` — Task 3 and Task 4/5 call these.

- [ ] **Step 1: Add type-only imports**

In `src/features/ledger/data.ts`, add:
```ts
import type { Customer } from '../customers/data'
import type { Cashier } from '../cashiers/data'
```

- [ ] **Step 2: Implement `getCustomerLedgerMovement(customerId: string): number`**

For each entry in `journalEntries`, resolve its transaction via
`transactions.find(t => t.id === entry.referenceTxnId)`. For that transaction:
- If `tx.type === 'W2W'` and `tx.customerId === customerId`: include only the entry's **debit**
  line on account `2000`.
- If `tx.type === 'W2W'` and `tx.recipientCustomerId === customerId`: include only the entry's
  **credit** line on account `2000`.
- For any other type where `tx.customerId === customerId`: include the entry's single `2000`
  line (debit or credit, whichever it has).

Sum `(credit - debit)` across every included line.

- [ ] **Step 3: Implement `getCashierLedgerMovement(floatAccount: string): number`**

Same approach, scoped to account `2005`, matching `tx.recipientAccount === floatAccount`. No
sender/recipient split needed (Cash In/Cash Out only ever touch one cashier's float).

- [ ] **Step 4: Implement the two convenience wrappers**

```ts
export const getCustomerBalance = (customer: Customer) =>
  customer.openingBalance + getCustomerLedgerMovement(customer.id)

export const getCashierFloatBalance = (cashier: Cashier) =>
  cashier.openingFloatBalance + getCashierLedgerMovement(cashier.floatAccount)
```

(These reference `openingBalance`/`openingFloatBalance`, which don't exist yet — Task 3 adds
them. This task will not type-check cleanly until Task 3 lands; that's expected and fine since
both tasks are part of the same change before it's committed as working. If you want Task 2 to
type-check standalone, write Steps 2–3 now and defer Step 4 until immediately after Task 3's
Step 1.)

- [ ] **Step 5: Verify the movement functions with a throwaway script**

Run:
```bash
npx tsx -e "
import { getCustomerLedgerMovement, getCashierLedgerMovement } from './src/features/ledger/data'

const checks: [string, number, number][] = [
  // [label, actual, expected]
]
const asha = getCustomerLedgerMovement('CUS-1001')
const john = getCustomerLedgerMovement('CUS-1002')
const grace = getCustomerLedgerMovement('CUS-1003')
console.assert(asha === -92200, \`Asha Juma movement should be -92200, got \${asha}\`)
console.assert(john === -29250, \`John Foxton movement should be -29250, got \${john}\`)
console.assert(grace === 70000, \`Grace Mwangi movement should be 70000, got \${grace}\`)

const mwajuma = getCashierLedgerMovement('FA-384021')
const jumaSaid = getCashierLedgerMovement('FA-384022')
console.assert(mwajuma === 69300, \`Mwajuma Hassan movement should be 69300, got \${mwajuma}\`)
console.assert(jumaSaid === -10000, \`Juma Said movement should be -10000, got \${jumaSaid}\`)

console.log('Task 2 checks passed')
"
```
Expected: `Task 2 checks passed` with no assertion output above it. (Grace Mwangi's +70,000 proves
the W2W recipient credit is counted and the Failed Cash Out `TXN-98210` is excluded; Asha Juma's
figure proves the Pending Cash In `TXN-98208` is counted.)

- [ ] **Step 6: `tsc --noEmit` clean**

Run: `npx tsc --noEmit -p .`
Expected: no output, exit code 0. (Requires Task 3's fields to exist — do Task 3 first if you
deferred Step 4 above, then come back and confirm this.)

- [ ] **Step 7: Commit**

```bash
git add src/features/ledger/data.ts
git commit -m "feat: add scoped customer and cashier ledger balance functions"
```

---

### Task 3: Opening balances in seed data

**Files:**
- Modify: `src/features/customers/data.ts`
- Modify: `src/features/cashiers/data.ts`
- Verify: throwaway `npx tsx` script (not committed)

**Interfaces:**
- Consumes: `getCustomerLedgerMovement`/`getCashierLedgerMovement` from Task 2.
- Produces: `Customer.openingBalance: number` (replaces `Customer.balance`),
  `Cashier.openingFloatBalance: number` (replaces `Cashier.floatBalance`) — Task 4/5 read these
  indirectly via `getCustomerBalance`/`getCashierFloatBalance`.

- [ ] **Step 1: Rename the field and set seed values in `customers/data.ts`**

Rename `balance: number` to `openingBalance: number` in the `Customer` interface. Set each
customer's `openingBalance` to:

| id | openingBalance |
|---|---|
| CUS-1001 | 94680.50 |
| CUS-1002 | 30230.00 |
| CUS-1003 | 0.00 |
| CUS-1004 | 0.00 |
| CUS-1005 | 38100.75 |
| CUS-1006 | 0.00 |
| CUS-1007 | 68750.00 |
| CUS-1008 | 0.00 |
| CUS-1009 | 0.00 |
| CUS-1010 | 31215.00 |
| CUS-1011 | 1850.00 |
| CUS-1012 | 940.50 |
| CUS-1013 | 0.00 |
| CUS-1014 | 0.00 |
| CUS-1015 | 0.00 |

- [ ] **Step 2: Rename the field and set seed values in `cashiers/data.ts`**

Rename `floatBalance: number` to `openingFloatBalance: number` in the `Cashier` interface. Set
each cashier's `openingFloatBalance` to:

| id | openingFloatBalance |
|---|---|
| CSH-3001 | 0.00 |
| CSH-3002 | 68000.00 |
| CSH-3003 | 75000.00 |
| CSH-3004 | 38500.00 |
| CSH-3005 | 0.00 |
| CSH-3006 | 19400.00 |
| CSH-3007 | 63500.00 |
| CSH-3008 | 0.00 |
| CSH-3009 | 87000.00 |
| CSH-3010 | 0.00 |
| CSH-3011 | 10500.00 |
| CSH-3012 | 59300.00 |
| CSH-3013 | 24000.00 |
| CSH-3014 | 85000.00 |
| CSH-3015 | 0.00 |

- [ ] **Step 3: Verify every computed balance against the expected displayed value**

Run:
```bash
npx tsx -e "
import { customers } from './src/features/customers/data'
import { cashiers } from './src/features/cashiers/data'
import { getCustomerBalance, getCashierFloatBalance } from './src/features/ledger/data'

const expectedCustomers: Record<string, number> = {
  'CUS-1001': 2480.50, 'CUS-1002': 980.00, 'CUS-1003': 70000.00, 'CUS-1004': 35000.00,
  'CUS-1005': 3100.75, 'CUS-1006': 12500.00, 'CUS-1007': 8750.00, 'CUS-1008': 19000.00,
  'CUS-1009': 10500.00, 'CUS-1010': 215.00, 'CUS-1011': 1850.00, 'CUS-1012': 940.50,
  'CUS-1013': 0.00, 'CUS-1014': 0.00, 'CUS-1015': 0.00,
}
for (const c of customers) {
  const actual = getCustomerBalance(c)
  const expected = expectedCustomers[c.id]
  console.assert(Math.abs(actual - expected) < 0.01, \`\${c.id} \${c.name}: expected \${expected}, got \${actual}\`)
}

const expectedCashiers: Record<string, number> = {
  'CSH-3001': 69300.00, 'CSH-3002': 58000.00, 'CSH-3003': 75000.00, 'CSH-3004': 18500.00,
  'CSH-3005': 0.00, 'CSH-3006': 54000.00, 'CSH-3007': 51000.00, 'CSH-3008': 59200.00,
  'CSH-3009': 68000.00, 'CSH-3010': 0.00, 'CSH-3011': 0.00, 'CSH-3012': 90000.00,
  'CSH-3013': 12000.00, 'CSH-3014': 71000.00, 'CSH-3015': 0.00,
}
for (const c of cashiers) {
  const actual = getCashierFloatBalance(c)
  const expected = expectedCashiers[c.id]
  console.assert(Math.abs(actual - expected) < 0.01, \`\${c.id} \${c.name}: expected \${expected}, got \${actual}\`)
}

console.log('Task 3 checks passed')
"
```
Expected: `Task 3 checks passed` with no assertion output above it. If any assertion fires, the
seed value for that specific record is wrong — do not adjust the expected table to match, find
and fix the seed value.

- [ ] **Step 4: `tsc --noEmit` clean**

Run: `npx tsc --noEmit -p .`
Expected: no output except pre-existing errors from `Customers.tsx`/`Cashiers.tsx`/
`CashierRegisterForm.tsx`/`customers/status.ts`/`Financial.tsx` still referencing the old
`.balance`/`.floatBalance` field names (Task 4 and Task 5 fix those). If no other file in the repo
references the renamed fields yet, this should already be clean.

- [ ] **Step 5: Commit**

```bash
git add src/features/customers/data.ts src/features/cashiers/data.ts
git commit -m "feat: convert customer and cashier balances into ledger opening balances"
```

---

### Task 4: Point Customers and Cashiers screens at computed balances

**Files:**
- Modify: `src/features/customers/status.ts`
- Modify: `src/features/customers/pages/Customers.tsx`
- Modify: `src/features/cashiers/pages/Cashiers.tsx`
- Modify: `src/features/cashiers/pages/CashierRegisterForm.tsx`

**Interfaces:**
- Consumes: `getCustomerBalance`, `getCashierFloatBalance` from Task 2/3.

- [ ] **Step 1: `customers/status.ts` — use the computed balance**

Replace `customer.balance === 0` (line 21) with `getCustomerBalance(customer) === 0`, importing
`getCustomerBalance` from `../ledger/data`.

- [ ] **Step 2: `Customers.tsx` — replace every `.balance` read**

Replace each of these with `getCustomerBalance(...)` on the relevant record:
- Line 113 sort comparator: `(a.balance - b.balance)` → `(getCustomerBalance(a) - getCustomerBalance(b))`
- Line 161 `totalBalance`: `customers.reduce((sum, customer) => sum + customer.balance, 0)` →
  `customers.reduce((sum, customer) => sum + getCustomerBalance(customer), 0)`
- Line 398 table cell: `formatAmount(customer.balance)` → `formatAmount(getCustomerBalance(customer))`
- Line 532 drawer detail: `formatAmount(selected.balance)` → `formatAmount(getCustomerBalance(selected))`

Import `getCustomerBalance` from `../../ledger/data`.

- [ ] **Step 3: `Customers.tsx` — remove the manual "Wallet balance" edit input**

Remove the `editBalance` state variable, its `setEditBalance(String(customer.balance))` call
(line 194, in the edit-open handler), the "Wallet balance" `<input>` field in the edit modal JSX,
and any reference to `editBalance` in the save handler. A customer's balance is no longer a field
the edit form writes.

- [ ] **Step 4: `Cashiers.tsx` — replace every `.floatBalance` read**

Replace each of these with `getCashierFloatBalance(...)` on the relevant record:
- Line 132 filter: `getFloatHealth(cashier.floatBalance)` → `getFloatHealth(getCashierFloatBalance(cashier))`
- Line 149 sort comparator: `(a.floatBalance - b.floatBalance)` →
  `(getCashierFloatBalance(a) - getCashierFloatBalance(b))`
- Line 152 sort comparator (float-health label compare): both `.floatBalance` reads →
  `getCashierFloatBalance(...)`
- Line 199 `lowFloatCount`: `cashier.floatBalance < LOW_FLOAT_THRESHOLD` →
  `getCashierFloatBalance(cashier) < LOW_FLOAT_THRESHOLD`
- Line 200 `totalFloat`: `sum + cashier.floatBalance` → `sum + getCashierFloatBalance(cashier)`
- Line 546: `getFloatHealth(cashier.floatBalance)` → `getFloatHealth(getCashierFloatBalance(cashier))`
- Line 565 table cell: `formatAmount(cashier.floatBalance)` → `formatAmount(getCashierFloatBalance(cashier))`
- Line 731 drawer detail: `formatAmount(selected.floatBalance)` →
  `formatAmount(getCashierFloatBalance(selected))`

`getFloatHealth(floatBalance: number)` itself is unchanged — only its call sites change what they
pass in. Import `getCashierFloatBalance` from `../../ledger/data`.

- [ ] **Step 5: `CashierRegisterForm.tsx` — remove the "Assigned float" input**

Remove the `assignedFloat` state, its default-value derivation
(`initialCashier ? String(initialCashier.floatBalance) : ''`, line 79), the "Assigned float"
`<input>` field in the form JSX, and its write on submit
(`floatBalance: Number(assignedFloat) || initialCashier?.floatBalance || 0`, line 104). A new
cashier's `openingFloatBalance` should be set to `0` directly in the submitted record instead
(the "Top-Up Cashier Float" quick action on the Financial screen is the intended real path for
giving a cashier float going forward; wiring that action to post an actual transaction is a
follow-up, not part of this plan).

- [ ] **Step 6: `tsc --noEmit` clean**

Run: `npx tsc --noEmit -p .`
Expected: no output except any remaining errors from `Financial.tsx` (Task 5 fixes those).

- [ ] **Step 7: Manual verification**

Run `npm run dev`, open the Customers screen, confirm Grace Mwangi now shows TSh 70,000.00 and
Asha Juma still shows TSh 2,480.50. Open the Cashiers screen, confirm Mwajuma Hassan now shows
TSh 69,300.00 and Juma Said still shows TSh 58,000.00. Confirm the "Wallet balance" field is gone
from the customer edit modal and "Assigned float" is gone from the cashier register form.

- [ ] **Step 8: Commit**

```bash
git add src/features/customers/status.ts src/features/customers/pages/Customers.tsx src/features/cashiers/pages/Cashiers.tsx src/features/cashiers/pages/CashierRegisterForm.tsx
git commit -m "refactor: read customer and cashier balances from the ledger"
```

---

### Task 5: Financial screen's Float Management panel

**Files:**
- Modify: `src/features/financial/pages/Financial.tsx`

**Interfaces:**
- Consumes: `getCustomerBalance`, `getCashierFloatBalance` from Task 2; `customers` from
  `../../customers/data`; `cashiers` from `../../cashiers/data`.

- [ ] **Step 1: Replace the Customer Wallet / Cashier Float row values**

The Float Management panel currently computes `customerWalletBalance = balanceOf('2000')` and
`cashierFloatBalance = balanceOf('2005')` (whole-account ledger totals). Replace with:
```ts
const customerWalletBalance = customers.reduce((sum, c) => sum + getCustomerBalance(c), 0)
const cashierFloatBalance = cashiers.reduce((sum, c) => sum + getCashierFloatBalance(c), 0)
```
Import `customers` from `../../customers/data`, `cashiers` from `../../cashiers/data`, and
`getCustomerBalance`/`getCashierFloatBalance` from `../../ledger/data` (alongside the existing
`chartOfAccounts`/`getAccountBalance` import used for the "Company Wallet" row, which is
unchanged — Company Wallet stays ledger-derived from account `4000`/`5000` equity, per the design
doc's Step 3).

- [ ] **Step 2: Verify the panel totals with a throwaway script**

Run:
```bash
npx tsx -e "
import { customers } from './src/features/customers/data'
import { cashiers } from './src/features/cashiers/data'
import { getCustomerBalance, getCashierFloatBalance } from './src/features/ledger/data'

const totalCustomer = customers.reduce((sum, c) => sum + getCustomerBalance(c), 0)
const totalCashier = cashiers.reduce((sum, c) => sum + getCashierFloatBalance(c), 0)
console.assert(Math.abs(totalCustomer - 165316.75) < 0.01, \`Total customer balance: expected 165316.75, got \${totalCustomer}\`)
console.assert(Math.abs(totalCashier - 626000.00) < 0.01, \`Total cashier float: expected 626000.00, got \${totalCashier}\`)
console.log('Task 5 checks passed')
"
```
Expected: `Task 5 checks passed` with no assertion output above it.

- [ ] **Step 3: `tsc --noEmit` clean**

Run: `npx tsc --noEmit -p .`
Expected: no output, exit code 0 — this is the final task, so the whole project should now be
clean.

- [ ] **Step 4: Manual verification**

Run `npm run dev`, open the Financial screen, confirm Float Management shows Customer Wallet =
TSh 165,316.75 and Cashier Float = TSh 626,000.00, and that these match the sums you'd get by
adding up every row on the Customers and Cashiers screens.

- [ ] **Step 5: Commit**

```bash
git add src/features/financial/pages/Financial.tsx
git commit -m "feat: source Financial screen's wallet/float totals from customer and cashier records"
```
