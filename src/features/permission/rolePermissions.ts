import { Role } from './roles'
import { Permission } from './permissions'

/**
 * Which permissions each actor holds, and at what scope. This is the contract a real backend
 * would enforce once authentication exists — nothing in this frontend-only app currently reads
 * it to gate access (there is no login/session yet), but it's the single source of truth for
 * that future wiring.
 *
 * Scope matters because there are many Cashiers and many Customers in this app, each only ever
 * touching their own records:
 *   - 'own'  — limited to records tied to this specific actor: a customer's own wallet/loans,
 *              a cashier's own float and the customers/transactions they personally served.
 *   - 'all'  — every record of that kind in the whole app, with no such limit.
 *
 * Only Admin ever gets 'all' — it manages the whole app. Grouped below by the same modules
 * permissions.ts itself is grouped by, so each role's section reads as "what can they do in
 * the Wallet module, the Loan module," etc.
 */
export type PermissionScope = 'own' | 'all'

export interface ScopedPermission {
  permission: Permission
  scope: PermissionScope
}

const all = (permission: Permission): ScopedPermission => ({ permission, scope: 'all' })
const own = (permission: Permission): ScopedPermission => ({ permission, scope: 'own' })

export const ROLE_PERMISSIONS: Record<Role, ScopedPermission[]> = {
  // Manages the whole app — every module, every record, not scoped to any one actor.
  [Role.ADMIN]: Object.values(Permission).map(all),

  // Serves Cash In ("topup") and Cash Out ("withdraw") at the counter. Never W2W or W2B — both
  // are self-service and never carry an Agent channel in this app's data model. Every
  // permission below is 'own': this cashier's own float, and the customers/transactions they
  // personally served — not every cashier's, not every customer's.
  [Role.CASHIER]: [
    // Customer module — whichever customer they're currently serving
    own(Permission.CUSTOMER_VIEW),
    // Wallet module — the serving customer's wallet, to check balance before Cash In/Out
    own(Permission.WALLET_VIEW),
    // Transaction module — transactions they personally served
    own(Permission.TRANSACTION_VIEW),
    // Top Up module — Cash In
    own(Permission.TOPUP_CREATE),
    own(Permission.TOPUP_VIEW),
    // Withdrawal module — Cash Out
    own(Permission.WITHDRAWAL_CREATE),
    // Cashier / Float module — their own float only
    own(Permission.FLOAT_VIEW),
    // Financial module — reconciling their own float (see RCN scope note above)
    own(Permission.RECONCILIATION_VIEW),
    own(Permission.RECONCILIATION_MANAGE),
  ],

  // Self-service only: W2W (wallet-to-wallet) and W2B (wallet-to-bank withdrawal), plus their
  // own loans. Cash In and Cash Out are never self-initiated in this app's model, so no
  // TOPUP_CREATE — only TOPUP_VIEW, since the money is theirs even though a cashier created it.
  // Every permission below is 'own': this customer's own wallet, transactions, and loans —
  // never another customer's.
  [Role.CUSTOMER]: [
    // Wallet module — their own wallet, and sending via W2W
    own(Permission.WALLET_VIEW),
    own(Permission.WALLET_TRANSFER),
    // Transaction module — their own transaction history
    own(Permission.TRANSACTION_VIEW),
    // Top Up module — view only; a cashier creates it, the money is theirs
    own(Permission.TOPUP_VIEW),
    // Withdrawal module — W2B, the one withdrawal type with no cashier involved
    own(Permission.WITHDRAWAL_CREATE),
    // Loan module — apply for, view, and repay their own loans
    own(Permission.LOAN_VIEW),
    own(Permission.LOAN_APPLY),
    own(Permission.LOAN_REPAY),
  ],
}

export const hasPermission = (role: Role, permission: Permission): boolean =>
  ROLE_PERMISSIONS[role]?.some((entry) => entry.permission === permission) ?? false

export const getPermissionScope = (role: Role, permission: Permission): PermissionScope | undefined =>
  ROLE_PERMISSIONS[role]?.find((entry) => entry.permission === permission)?.scope
