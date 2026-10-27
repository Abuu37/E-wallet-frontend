import { Role } from './roles'
import { Permission } from './permissions'

/**
 * Which permissions each actor holds. This is the contract a real backend would enforce once
 * authentication exists — nothing in this frontend-only app currently reads it to gate access
 * (there is no login/session yet), but it's the single source of truth for that future wiring.
 *
 * FINANCIAL isn't one of the three actors named in the product (Admin, Cashier, Customer), but
 * it's already part of the Role enum and is the natural owner of reconciliation/financial-report
 * permissions, so it's included here rather than left dangling.
 *
 * CASHIER's RECONCILIATION_* permissions are intended to be scoped to that cashier's own float
 * only (not company-wide reconciliation) — this flat permission list has no concept of
 * per-record scoping, so a real backend must enforce that narrower scope itself.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: Object.values(Permission),

  [Role.FINANCIAL]: [
    Permission.CUSTOMER_VIEW,
    Permission.WALLET_VIEW,
    Permission.TRANSACTION_VIEW,
    Permission.TOPUP_VIEW,
    Permission.FLOAT_VIEW,
    Permission.FLOAT_MANAGE,
    Permission.LOAN_VIEW,
    Permission.LOAN_APPROVE,
    Permission.RECONCILIATION_VIEW,
    Permission.RECONCILIATION_MANAGE,
    Permission.FINANCIAL_REPORT_VIEW,
    Permission.FEE_VIEW,
    Permission.FEE_MANAGE,
  ],

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

  [Role.CUSTOMER]: [
    Permission.WALLET_VIEW,
    Permission.WALLET_TRANSFER,
    Permission.TRANSACTION_VIEW,
    // Self-service bank withdrawal (W2B) — the one withdrawal type with no cashier involved.
    Permission.WITHDRAWAL_CREATE,
    Permission.LOAN_VIEW,
    Permission.LOAN_APPLY,
    Permission.LOAN_REPAY,
  ],
}

export const hasPermission = (role: Role, permission: Permission): boolean =>
  ROLE_PERMISSIONS[role]?.includes(permission) ?? false
