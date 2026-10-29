import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import type { LucideIcon } from "lucide-react";
import {
  CreditCard,
  LayoutDashboard,
  ArrowLeftRight,
  Landmark,
  Users,
  UserCog,
  Banknote,
  Scale,
  HandCoins,
  Percent,
  ShieldCheck,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { confirmLogout } from "../../features/auth/confirmLogout";
import type { UserRole } from "../../features/auth/utils/mockAuth";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  roles: UserRole[];
}

const navGroups: Array<{ label: string | null; items: NavItem[] }> = [
  {
    label: null,
    items: [
      {
        path: "/dashboard",
        label: "Overview",
        icon: LayoutDashboard,
        roles: ["Admin", "Cashier"],
        end: true,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        path: "/dashboard/transactions",
        label: "Transactions",
        icon: ArrowLeftRight,
        roles: ["Admin", "Cashier"],
      },
      {
        path: "/dashboard/company-wallet",
        label: "Company Wallet",
        icon: Landmark,
        roles: ["Admin", "Cashier"],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        path: "/dashboard/customers",
        label: "Customers",
        icon: Users,
        roles: ["Admin", "Cashier"],
      },
      {
        path: "/dashboard/cashiers",
        label: "Cashiers",
        icon: UserCog,
        roles: ["Admin"],
      },
    ],
  },
  {
    label: "Management",
    items: [
      {
        path: "/dashboard/financial",
        label: "Financial",
        icon: Banknote,
        roles: ["Admin"],
      },
      {
        path: "/dashboard/ledger",
        label: "Ledger",
        icon: Scale,
        roles: ["Admin"],
      },
      {
        path: "/dashboard/loans",
        label: "Loans",
        icon: HandCoins,
        roles: ["Admin"],
      },
      {
        path: "/dashboard/fees",
        label: "Fees",
        icon: Percent,
        roles: ["Admin"],
      },
      {
        path: "/dashboard/reconciliation",
        label: "Reconciliation",
        icon: ShieldCheck,
        roles: ["Admin"],
      },
      {
        path: "/dashboard/settings",
        label: "Settings",
        icon: Settings,
        roles: ["Admin", "Cashier"],
      },
    ],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive
        ? "bg-brand text-white"
        : "text-white/70 hover:bg-white/10 hover:text-white"
    }`;

  const handleLogout = async () => {
    const confirmed = await confirmLogout();
    if (!confirmed) return;
    sessionStorage.removeItem("user");
    onNavigate?.();
    navigate("/");
  }; 

  const storedUser = sessionStorage.getItem("user");
  let currentRole: UserRole | null = null;

  try {
    const user = storedUser ? JSON.parse(storedUser) : null;
    if (user && typeof user === "object" && "role" in user) {
      currentRole = user.role as UserRole;
    }
  } catch {
    currentRole = null;
  }

  const visibleGroups = navGroups.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) => currentRole !== null && item.roles.includes(currentRole),
    ),
  }))
  .filter((group) => group.items.length > 0);


  return (
    <>
      <NavLink
        to="/dashboard"
        end
        className="flex items-center gap-2 px-2 text-lg font-extrabold tracking-tight text-white"
        onClick={onNavigate}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white">
          <CreditCard size={18} />
        </span>
        WalletPesa
      </NavLink>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {visibleGroups.map((group) => (
          <div key={group.label ?? "root"}>
            {group.label && (
              <p className="mb-1 mt-4 px-3 text-[11px] font-bold uppercase tracking-wide text-white/35">
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {group.items
                .filter(
                  (item) =>
                    currentRole !== null && item.roles.includes(currentRole),
                )
                .map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.path}
                    end={item.end}
                    className={linkClass}
                    onClick={onNavigate}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                ))}
            </div>
          </div>
        ))}

        <div className="mt-auto border-t border-white/10 pt-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
            text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>
    </>
  );
}

interface DashboardSidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function DashboardSidebar({
  open,
  onClose,
}: DashboardSidebarProps) {
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 flex-col overflow-y-auto bg-ink px-4 py-6 lg:flex">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {open && (
          <motion.div
            key="sidebar-backdrop"
            className="fixed inset-0 z-40 bg-ink/60 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            key="sidebar-panel"
            className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink px-4 py-6 lg:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Close menu"
              className="absolute right-4 top-6 text-white/70 hover:text-white"
            >
              <X size={22} />
            </button>
            <SidebarContent onNavigate={onClose} />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
