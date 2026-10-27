import { Role } from './roles'
import { Permission } from './permissions'

/**
 * Which permissions each actor holds. This is the contract a real backend would enforce once
 * authentication exists — nothing in this frontend-only app currently reads it to gate access
 * (there is no login/session yet), but it's the single source of truth for that future wiring.
 *
 * Scoped to the three real actors (Admin, Cashier, Customer) and to the four money-movement
 * transaction types this app currently implements — Cash In ("topup"), Cash Out ("withdraw"),
 * W2W, and W2B — matching src/features/transactions/data.ts's TxType exactly. Loan and fee
 * management, role assignment, and system config are left to Admin only for now; they're real
 * permissions already (features/permission/permissions.ts), just not this pass's focus — revisit
 * once loans/fees get their own actor-level rollout.
 *
 * CASHIER's RECONCILIATION_* permissions are intended to be scoped to that cashier's own float
 * only (not company-wide reconciliation) — this flat permission list has no concept of
 * per-record scoping, so a real backend must enforce that narrower scope itself.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  // Full access — oversees everything, including the features not yet broken out to a
  // dedicated actor (loans, fees, system config, role assignment).
  [Role.ADMIN]: Object.values(Permission),

  // Serves Cash In ("topup") and Cash Out ("withdraw") at the counter. Never serves W2W or
  // W2B — both are self-service and never carry an Agent channel in this app's data model.
  [Role.CASHIER]: [
    Permission.CUSTOMER_VIEW,
    Permission.WALLET_VIEW,
    Permission.TRANSACTION_VIEW,
    Permission.TOPUP_CREATE,
    Permission.TOPUP_VIEW,
    Permission.WITHDRAWAL_CREATE,
    Permission.FLOAT_VIEW,
    // Scoped to their own float in practice — see file comment above.
    Permission.RECONCILIATION_VIEW,
    Permission.RECONCILIATION_MANAGE,
  ],

  // Self-service only: W2W (wallet-to-wallet) and W2B (wallet-to-bank withdrawal). Cash In and
  // Cash Out are never self-initiated in this app's model, so no TOPUP_CREATE here — only
  // TOPUP_VIEW, since the money is theirs even though a cashier created the transaction.
  [Role.CUSTOMER]: [
    Permission.WALLET_VIEW,
    Permission.WALLET_TRANSFER,
    Permission.TRANSACTION_VIEW,
    Permission.TOPUP_VIEW,
    // Self-service bank withdrawal (W2B) — the one withdrawal type with no cashier involved.
    Permission.WITHDRAWAL_CREATE,
  ],
}

export const hasPermission = (role: Role, permission: Permission): boolean =>
  ROLE_PERMISSIONS[role]?.includes(permission) ?? false
