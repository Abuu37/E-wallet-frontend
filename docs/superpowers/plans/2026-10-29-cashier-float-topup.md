# Cashier Float Top-Up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin top up a specific cashier's float from the Company Wallet (amount + admin
PIN, capped at the available balance, with a live "balance after transfer" preview), scoped
entirely to the Cashiers page.

**Architecture:** A new `CashierTopUpForm` component (fields/validation only) renders inside a
`Modal` that `Cashiers.tsx` owns, triggered from a cashier's row menu or detail drawer. `Cashiers.tsx`
keeps two pieces of local state — the existing `cashiers` array and a new `companyWalletBalance`
number seeded once from the ledger — and submitting the form moves money between them directly.
No shared/cross-page state is introduced (see the spec's Non-goals): this intentionally doesn't
touch `Financial.tsx`, `Overview.tsx`, or `CompanyWallet.tsx`.

**Tech Stack:** React 19 + TypeScript, Vite, Formik + Yup, SweetAlert2, no backend/API, no test
framework in this repo (confirmed via `package.json` — no vitest/jest/testing-library). Verification
in this plan uses `npx tsc --noEmit -p .` for type safety and manual exercise of the running app
(`npm run dev`) for behavior — the same adaptation already used in `docs/superpowers/plans/
2026-10-26-ledger-sourced-balances.md` for this codebase's lack of a test runner.

**Spec:** `docs/superpowers/specs/2026-10-29-cashier-float-topup-design.md`

## Global Constraints

- Frontend-only, static mock data, no API work.
- No shared/cross-page state (no Context, no Redux/Zustand) — everything lives in `Cashiers.tsx`'s
  own component state.
- No new `journalEntries` posting; `getAccountBalance`, `TRUST_ACCOUNT_BALANCE`, `chartOfAccounts`
  stay exactly as they are — a top-up is a direct balance adjustment, not a modeled transaction.
- Match existing conventions exactly: Formik + Yup for the form; `Modal` (not a routed page) for
  presentation; SweetAlert2 toasts at `top-end` position, `showConfirmButton: false`, `timer: 1500`
  on success, no timer on error, with `console.error(...)` logged before the error toast fires.
- The Top-Up form's fields/validation live in their own component; the `Modal` open/close state and
  wrapper stay in `Cashiers.tsx`.
- Admin PIN is checked against the current session's own PIN (`JSON.parse(sessionStorage.getItem('user') ?? '{}').pin`,
  the same read `Settings.tsx`'s `readSessionPin` already does) — never the cashier's PIN.
- Wrong PIN surfaces as an inline Yup/Formik field error under the PIN input — never a SweetAlert
  toast.
- Financial's "Top-Up Cashier Float" quick action keeps navigating to `/dashboard/cashiers` and
  nothing else — not wired to open this form or pick a cashier.
- `Financial.tsx`, `Overview.tsx`, `CompanyWallet.tsx`, `Reconciliation.tsx`, and
  `reconciliation/data.ts` are not touched by this plan.

## Review Focus

- **Amount greater than the available Company Wallet balance** must show an inline error under
  the amount field and block submission — the validation is written in Task 1, exercised by
  Task 2's manual verification step 1 (no standalone harness exists for this component, so it
  can't be checked until it's mounted in Task 2).
- **Wrong admin PIN** must show an inline error under the PIN field, never submit, and never fire
  a toast — the validation is written in Task 1, exercised by Task 2's manual verification step 2.
- **Non-numeric, zero, negative, or empty amount** must block submission with an inline error —
  the validation is written in Task 1, exercised as part of Task 2's manual verification step 1
  (an admin typing a bad amount before correcting it).
- **Opening the Top-Up modal for cashier B right after using it for cashier A** must show cashier
  B's own name/balance with a clean (non-prefilled) form, not A's stale values — covered by
  Task 2's manual verification step 4.
- **A second top-up in the same session** must validate against the *already-reduced*
  `companyWalletBalance` from the first top-up, not a frozen initial value — covered by Task 2's
  manual verification step 5.

---

## Task 1: `CashierTopUpForm` component

**Files:**
- Modify: `src/features/ledger/data.ts`
- Create: `src/features/cashiers/components/CashierTopUpForm.tsx`

**Interfaces:**
- Consumes: `type Cashier` from `src/features/cashiers/data.ts`.
- Produces:
  - `getEmoneyLiabilities(): number` — exported from `src/features/ledger/data.ts`.
  - `export default function CashierTopUpForm(props: CashierTopUpFormProps): JSX.Element` where
    ```ts
    interface CashierTopUpFormProps {
      cashier: Cashier
      companyWalletBalance: number
      onSubmit: (amount: number) => void
      onCancel: () => void
    }
    ```

- [ ] **Step 1: Add `getEmoneyLiabilities` to `src/features/ledger/data.ts`**

Add, near the other exported balance helpers (after `getCashierFloatBalance`):

```ts
export const getEmoneyLiabilities = () =>
  ['2000', '2005', '2010', '2020'].reduce((sum, id) => {
    const account = chartOfAccounts.find((item) => item.id === id)
    return sum + (account ? getAccountBalance(account) : 0)
  }, 0)
```

- [ ] **Step 2: Write `CashierTopUpForm`**

Formik values: `{ amount: string; pin: string }`, both starting `''`. Read the session PIN once at
the top of the component body:

```ts
const sessionPin = (() => {
  try {
    return JSON.parse(sessionStorage.getItem('user') ?? '{}').pin as string | undefined
  } catch {
    return undefined
  }
})()
```

Yup schema (built inside the component so it closes over `companyWalletBalance` and `sessionPin`):

```ts
const topUpSchema = Yup.object({
  amount: Yup.number()
    .typeError('Enter a valid amount')
    .moreThan(0, 'Amount must be greater than zero')
    .max(companyWalletBalance, 'Amount exceeds the Company Wallet balance')
    .required('Float amount is required'),
  pin: Yup.string()
    .required('Admin PIN is required')
    .test('correct-pin', 'Incorrect PIN', (value) => value === sessionPin),
})
```

On submit: `onSubmit(Number(values.amount))` — this component never mutates any cashier/wallet
state itself and never fires a toast; that's the caller's job (Task 2).

Fields, using the same `getInputClass(hasError)`/`errorClass` pattern already in
`CashierRegisterForm.tsx` (copy those two small helpers into this file, matching how
`LoanApplicationForm.tsx` and `CashierRegisterForm.tsx` each already keep their own copies rather
than importing across sibling form files):
- Funding Source — plain read-only text, not an `<input>`: `"Company Wallet"` with
  `formatAmount(companyWalletBalance)` shown next to or beneath it (reuse the same
  `` `TSh ${Math.round(value).toLocaleString()}` `` formatting already used elsewhere in this
  feature's files).
- Float Amount — `<input type="text" name="amount" ...>` (text, not `type="number"`, matching how
  every other numeric-but-validated field in this app's forms is built, e.g. `floatAccount` in
  `CashierRegisterForm.tsx`). Directly below it, independent of the error/caption line, render:
  `` `Company Wallet balance after transfer: ${formatAmount(companyWalletBalance - (Number(values.amount) || 0))}` ``,
  recomputed on every render as `values.amount` changes.
- Admin PIN — `<input type="password" name="pin" ...>`.
- Cancel button calling `onCancel`; Submit button with text `"Transfer Float"`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit -p .`
Expected: no errors. (This component has no standalone render harness in this codebase — its
behavior is verified once Task 2 mounts it.)

- [ ] **Step 4: Commit**

```bash
git add src/features/ledger/data.ts src/features/cashiers/components/CashierTopUpForm.tsx
git commit -m "feat: add getEmoneyLiabilities and the CashierTopUpForm component"
```

## Task 2: Wire Top-Up entry points into `Cashiers.tsx`

**Files:**
- Modify: `src/features/cashiers/pages/Cashiers.tsx`

**Interfaces:**
- Consumes: `getEmoneyLiabilities`, `TRUST_ACCOUNT_BALANCE` from `src/features/ledger/data.ts`
  (Task 1); `CashierTopUpForm` from `../components/CashierTopUpForm` (Task 1); `Modal` from
  `../../../components/ui/Modal`; `Swal` from `sweetalert2`; the `CirclePlus` icon from
  `lucide-react`.

- [ ] **Step 1: Add local state**

Add, alongside the existing `cashiers` state:

```ts
const [companyWalletBalance, setCompanyWalletBalance] = useState(
  () => TRUST_ACCOUNT_BALANCE - getEmoneyLiabilities(),
)
const [topUpTarget, setTopUpTarget] = useState<Cashier | null>(null)
```

Import `TRUST_ACCOUNT_BALANCE` and `getEmoneyLiabilities` into the existing `import {
getCashierFloatBalance } from '../../ledger/data'` line.

- [ ] **Step 2: Add the open handler**

Add, alongside the existing `requestDelete`:

```ts
const openTopUp = (id: string) => {
  const cashier = cashiers.find((item) => item.id === id)
  if (!cashier) return
  setTopUpTarget(cashier)
  closeActionMenu()
}
```

- [ ] **Step 3: Add the submit handler**

```ts
const handleTopUpSubmit = (amount: number) => {
  if (!topUpTarget) return
  try {
    const targetId = topUpTarget.id
    const name = topUpTarget.name
    setCashiers((prev) =>
      prev.map((cashier) =>
        cashier.id === targetId
          ? { ...cashier, openingFloatBalance: cashier.openingFloatBalance + amount }
          : cashier,
      ),
    )
    setCompanyWalletBalance((prev) => prev - amount)
    setTopUpTarget(null)
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Float Top-Up Successful',
      text: `TSh ${amount.toLocaleString()} added to ${name}'s float.`,
      showConfirmButton: false,
      timer: 1500,
    })
  } catch (error) {
    console.error('Cashier top-up error:', error)
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Float Top-Up Failed',
      text: 'An error occurred while transferring the float. Please try again.',
      showConfirmButton: false,
    })
  }
}
```

- [ ] **Step 4: Add the row-menu entry point**

In the row action dropdown (the `AnimatePresence`/`motion.div` block already listing View/Edit/
Delete), add a "Top Up Float" button above "Edit", using the `CirclePlus` icon, calling
`openTopUp(actionMenu.id)` — same shape and styling as the existing `View`/`Edit` buttons there.

- [ ] **Step 5: Add the drawer entry point**

In the detail drawer, next to the existing "Assigned Float" card (`formatAmount(getCashierFloatBalance(selected))`),
add a "Top Up Float" button (same icon) calling `openTopUp(selected.id)`.

- [ ] **Step 6: Render the modal**

```tsx
<Modal
  open={!!topUpTarget}
  onClose={() => setTopUpTarget(null)}
  title={
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
        <CirclePlus size={16} />
      </span>
      Top Up Float
    </>
  }
>
  {topUpTarget && (
    <CashierTopUpForm
      cashier={topUpTarget}
      companyWalletBalance={companyWalletBalance}
      onSubmit={handleTopUpSubmit}
      onCancel={() => setTopUpTarget(null)}
    />
  )}
</Modal>
```

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit -p .`
Expected: no errors.

Run `npm run dev` and manually walk through, in order:
1. Open `/dashboard/cashiers`, pick cashier A, open Top Up from the row menu. Try, in turn: an
   empty amount, `0`, a negative number, non-numeric text, and an amount greater than the shown
   Company Wallet balance → confirm each shows an inline error under the amount field and submit
   does nothing for any of them.
2. Enter a valid amount with the wrong PIN → confirm an inline error appears under the PIN field,
   no toast fires, and the modal stays open.
3. Enter a valid amount with the correct admin PIN → confirm the success toast fires, the modal
   closes, A's float balance increases by that amount in both the table and (if opened) the
   drawer's "Assigned Float" card.
4. Immediately open Top Up again for a *different* cashier B from the drawer button → confirm the
   form shows blank/reset fields (not A's leftover values) and B's own data.
5. Top up B as well, then reopen Top Up for A a second time → confirm the Company Wallet balance
   shown in the form has decreased by both of A's and B's prior top-ups combined (proves the local
   `companyWalletBalance` state isn't stale across modal re-opens), and that entering more than
   this new, lower balance is correctly rejected.

- [ ] **Step 8: Commit**

```bash
git add src/features/cashiers/pages/Cashiers.tsx
git commit -m "feat: wire cashier float top-up entry points, modal, and submit handling"
```

## Task 3: Fix the stale guidance in `CashierRegisterForm.tsx`

**Files:**
- Modify: `src/features/cashiers/pages/CashierRegisterForm.tsx`

- [ ] **Step 1: Reword the post-create banner**

Find the green `CheckCircle2` note under "Float Wallet Assignment" (currently: `A float wallet
will be created and linked to this cashier. Use the "Top-Up Cashier Float" quick action afterward
to assign starting float.`). Replace its second sentence so it no longer names the Financial quick
action, e.g.: `After saving, use this cashier's "Top Up Float" action (from the row menu or their
detail view) to assign starting float.`

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit -p .`
Expected: no errors.

Run `npm run dev`, open the "Add Cashier" form, and visually confirm the new banner text reads
correctly and no longer mentions Financial's quick action.

- [ ] **Step 3: Commit**

```bash
git add src/features/cashiers/pages/CashierRegisterForm.tsx
git commit -m "fix: point the post-create float banner at the row/drawer top-up action"
```
