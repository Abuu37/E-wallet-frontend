# Cashier Float Top-Up

## Intent and why

Admins need a way to add float to a cashier's wallet from the Company Wallet — today this is a
dead end: Financial's "Top-Up Cashier Float" quick action (`src/features/financial/pages/
Financial.tsx`) only navigates to `/dashboard/cashiers` and does nothing once there, and
`CashierRegisterForm.tsx` tells the admin to "use the Top-Up Cashier Float quick action
afterward" to fund a brand-new cashier — a feature that was never built.

While scoping this, a second, pre-existing gap surfaced: this app has no shared state across
dashboard pages, so a top-up's effect on the cashier's float and the Company Wallet's balance
would only be visible on the Cashiers page itself, not on Financial/Overview/Company Wallet
without a refresh. A first pass at this plan designed a shared `DashboardDataContext` to fix that
everywhere at once. On reflection, that's deliberately out of scope now: it would be real,
non-trivial infrastructure built purely to compensate for having no backend, and the moment a
real API arrives it gets thrown away in favor of a server-driven data layer (React Query or
similar) rather than extended. Since this app has no backend today and may never need one for
real, paying that cost now for a mock-only feature isn't worth it — simple wins. This plan builds
Top-Up scoped to the Cashiers page alone, accepting the same cross-page staleness that already
exists for every other cashier edit today.

## Goals

- An admin can top up a specific cashier's float from the Company Wallet, from either that
  cashier's row action menu or their detail drawer on the Cashiers page.
- The form shows the funding source ("Company Wallet") with its current available balance, an
  amount field validated against that balance, a live "balance after transfer" preview, and an
  admin PIN field that confirms the transfer.
- A successful top-up immediately updates the cashier's displayed float balance and the Company
  Wallet balance shown in the form, both visible without a page refresh, scoped to the Cashiers
  page.
- Wrong PIN shows as an inline field error, matching every other validation in this app's forms —
  no toast for that case.
- A genuine failure (an exception during the update) shows a SweetAlert2 error toast; success
  shows a SweetAlert2 success toast — both matching the existing toast style already used for
  cashier create/edit and fee edit.

## Non-goals

- Not introducing a real backend/API — this stays a frontend-only mock.
- Not introducing any shared/cross-page state (no Context, no Redux/Zustand). `Financial.tsx`,
  `Overview.tsx`, and `CompanyWallet.tsx` are not touched by this plan and will not reflect a
  top-up without a page refresh — the same pre-existing limitation every other cashier edit
  already has today. If a real backend arrives later, that's the point at which cross-page
  consistency gets solved properly (a data-fetching layer), not before.
- Not posting a new journal entry to `ledger/data.ts`'s `journalEntries`, and not changing
  `getAccountBalance`, `TRUST_ACCOUNT_BALANCE`, or `chartOfAccounts` — those stay exactly as they
  are today, matching the explicit non-goal already set in `docs/superpowers/specs/
  2026-10-26-ledger-sourced-balances-design.md`. A top-up is a direct balance adjustment, not a
  modeled transaction.
- Not wiring Financial's "Top-Up Cashier Float" quick action to open this form directly or to
  pick a cashier itself — it keeps navigating to `/dashboard/cashiers` exactly as it does today;
  the admin picks the cashier there.
- Not touching `Reconciliation.tsx` or `reconciliation/data.ts` — unaffected by this change.

## Anti-goals

- A top-up that silently fails to update the cashier's float balance or the Company Wallet
  balance shown within the Cashiers page itself — within that one page, the numbers must always
  be correct and immediate.
- Treating the Cashiers-page-local "Company Wallet balance" as if it were the Company Wallet
  page's "Trust Account Balance" or "E-money Liabilities" — it's a separate, smaller-scoped
  number (see Constraints) and this plan doesn't display it anywhere outside the Top-Up form.

## Constraints

- Frontend-only, static mock data, no API.
- Match existing conventions: Formik + Yup for the form, `Modal` for presentation (not a routed
  page — this is a contextual action on an already-open cashier, same reasoning as Fees' inline
  edit modal), SweetAlert2 toasts in the exact style already used in `Cashiers.tsx` (`top-end`
  position, 1500ms timer on success, no timer on error, `console.error` before the error toast).
- Extract the form's fields/validation into their own component, but keep the `Modal` open/close
  state and wrapper in `Cashiers.tsx` — the same split already agreed for Fees' edit form, applied
  here from the start.
- Admin PIN is checked against the current session's own PIN (`sessionStorage.getItem('user')`,
  same field `Settings.tsx` already reads/writes) — not the cashier's PIN.
- The "Company Wallet balance" the Top-Up form caps against is local `useState` in `Cashiers.tsx`
  only, seeded once from `TRUST_ACCOUNT_BALANCE - getEmoneyLiabilities()` (trust-account cash not
  already backing an issued liability) — not shared with, or read from, any other page.

## The plan

### Step 1 — Add a reusable e-money liabilities function

File: `src/features/ledger/data.ts`

- Add `export const getEmoneyLiabilities = () => ...`, summing the `2000`/`2005`/`2010`/`2020`
  account balances via the existing `chartOfAccounts`/`getAccountBalance`. `Cashiers.tsx` (Step 2)
  uses this once to seed its local Company Wallet balance. (`CompanyWallet.tsx` keeps its own
  existing local calculation unchanged — it isn't touched by this plan.)

### Step 2 — The Top-Up form component

File: `src/features/cashiers/components/CashierTopUpForm.tsx` (new)

Props: `cashier: Cashier`, `companyWalletBalance: number`, `onSubmit: (amount: number) => void`,
`onCancel: () => void`.

- Formik values: `{ amount: string; pin: string }`.
- Yup schema (built inside the component, so it can close over `companyWalletBalance` and the
  session PIN — same pattern `CashierRegisterForm.tsx`'s and `Reconciliation.tsx`'s schemas
  already use):
  - `amount`: number, `moreThan(0, ...)`, `max(companyWalletBalance, 'Amount exceeds the Company
    Wallet balance')`, required.
  - `pin`: required, and a `.test(...)` that compares it to the session's own PIN (read the same
    way `Settings.tsx`'s `readSessionPin` does), failing with `'Incorrect PIN'` — this is the
    inline field error the conversation settled on; a wrong PIN never reaches `onSubmit` and never
    triggers a toast.
- Fields, matching this app's existing field styling (`getInputClass`/`errorClass` pattern):
  - Funding Source — read-only display, not an editable input: "Company Wallet", with its current
    balance shown directly beneath or beside it.
  - Float Amount — number input. Below it, a live line: "Company Wallet balance after transfer:
    {formatAmount(companyWalletBalance - Number(values.amount || 0))}" that updates on every
    keystroke.
  - Admin PIN — password-style input (masked, matching how `Settings.tsx`'s PIN fields are
    presented).
- On submit, call `onSubmit(Number(values.amount))` — the parent (`Cashiers.tsx`) owns the actual
  balance update, the toast, and closing the modal (form owns fields/validation only, caller owns
  the action and modal state).

### Step 3 — Entry points, local state, and the modal, in Cashiers.tsx

File: `src/features/cashiers/pages/Cashiers.tsx`

- Add `const [companyWalletBalance, setCompanyWalletBalance] = useState(() =>
  TRUST_ACCOUNT_BALANCE - getEmoneyLiabilities())` (both imported from `../../ledger/data`,
  alongside the `getCashierFloatBalance` already imported there).
- Add `const [topUpTarget, setTopUpTarget] = useState<Cashier | null>(null)`.
- Add `openTopUp(id)` (same shape as the existing `requestDelete`): looks up the cashier, sets
  `topUpTarget`, closes the row action menu.
- Row action menu (the 3-dot dropdown already standardized across this table): add a "Top Up
  Float" item above or below "Edit", using the same `CirclePlus` icon Financial's quick action
  already uses for this concept, calling `openTopUp(actionMenu.id)`.
- Detail drawer: add a "Top Up Float" button next to the existing "Assigned Float" card (the one
  showing `formatAmount(getCashierFloatBalance(selected))`), calling `openTopUp(selected.id)`.
- Submit handler, in one state update per setter: adds the amount to the target cashier's
  `openingFloatBalance` (via `setCashiers`) and subtracts it from `companyWalletBalance` (via
  `setCompanyWalletBalance`), then fires the success toast; an exception fires the error toast
  instead. Both only affect this page's own state.
- Render `<Modal open={!!topUpTarget} onClose={() => setTopUpTarget(null)} title={...}>`
  containing `<CashierTopUpForm cashier={topUpTarget} companyWalletBalance={companyWalletBalance}
  onSubmit={...} onCancel={...}>` when `topUpTarget` is set.

### Step 4 — Fix the stale guidance in CashierRegisterForm.tsx

File: `src/features/cashiers/pages/CashierRegisterForm.tsx`

- The green `CheckCircle2` note under "Float Wallet Assignment" currently reads: `A float wallet
  will be created and linked to this cashier. Use the "Top-Up Cashier Float" quick action
  afterward to assign starting float.` That sentence points at Financial's quick action, which
  this plan deliberately leaves as a dead-end navigation link (see Non-goals) — the real new
  capability lives on this cashier's own row menu / detail drawer instead, once they exist in the
  list. Reword it to point there, e.g.: `A float wallet will be created and linked to this
  cashier. After saving, use this cashier's "Top Up Float" action (row menu or detail view) to
  assign starting float.` Exact phrasing is the builder's call — the only requirement is that it
  no longer names the Financial quick action as the mechanism.

### Step 5 — Verify

- `tsc --noEmit` clean.
- Manually: top up a cashier from the row menu, confirm the drawer's "Assigned Float" updates on
  the Cashiers page; confirm a wrong PIN shows inline under the PIN field and never closes the
  modal or fires a toast; confirm an amount above the available balance shows inline under the
  amount field; confirm `CashierRegisterForm.tsx`'s updated banner no longer names the Financial
  quick action.

## What's left to the builder

- Exact icon/wording for the "Top Up Float" menu item and button (something clearly distinct from
  View/Edit/Delete).
- Where exactly in the drawer's layout the new button sits relative to the Assigned Float card
  (inside it vs. beside it) — a small visual call, not a behavioral one.

## What needs confirmation before/while building

- None outside the usual review of the finished UI.

## Decisions made during review

- **Scope cut after the first pass.** An earlier version of this plan designed a shared
  `DashboardDataContext` so a top-up would stay consistent across the Cashiers, Financial,
  Overview, and Company Wallet pages without a refresh. That was dropped in favor of keeping
  everything local to `Cashiers.tsx`: the Context would be real infrastructure built solely to
  compensate for having no backend, and it would most likely be thrown away (not extended) the
  moment a real API and a proper data-fetching layer arrive. Given that risk, simplicity won —
  this plan accepts the same cross-page staleness every other cashier edit already has today,
  rather than building and later discarding a bespoke sync layer.
- **`CashierRegisterForm.tsx`'s post-create banner names the wrong mechanism.** A builder-check
  pass against the first version of this plan flagged that it currently points the admin at
  Financial's "Top-Up Cashier Float" quick action, which this plan keeps as a dead-end — the real
  action lives on the Cashiers page's row menu / drawer instead. Resolved by Step 4 above.
