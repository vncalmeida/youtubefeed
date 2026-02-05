import React from "react";
import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  Settings as SettingsIcon,
  ChevronLeft,
  ChevronRight,
  BarChart2,
} from "lucide-react";
import type { Summary } from "../types";

const cx = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(" ");

interface AdminSidebarProps {
  collapsed: boolean;
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  summary: Summary;
}

export default function AdminSidebar({
  collapsed,
  setCollapsed,
  summary,
}: AdminSidebarProps) {
  const nav = React.useMemo(
    () => [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true as const },
      { to: "/admin/companies", label: "Empresas", icon: Building2 },
      { to: "/admin/settings", label: "Configurações", icon: SettingsIcon },
    ],
    []
  );

  return (
    <aside
      className={cx(
        "fixed inset-y-0 left-0 z-40 hidden h-full border-r border-gray-200/70 bg-white/90 backdrop-blur md:block dark:border-white/10 dark:bg-[#0F0F11]/90",
        collapsed ? "w-[84px]" : "w-[260px]",
        "overflow-hidden"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[var(--primary)]" />
          {!collapsed && (
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              Admin
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
          aria-label="Alternar sidebar"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      <nav className="mt-2 px-2">
        {nav.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={Boolean(end)} className="block">
            {({ isActive }) => (
              <div
                className={cx(
                  "group mb-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                )}
              >
                <Icon className="h-5 w-5 flex-none" />
                {!collapsed && <span className="truncate">{label}</span>}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

    </aside>
  );
}
