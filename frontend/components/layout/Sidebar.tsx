"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Clock,
  CalendarOff,
  User,
  BarChart3,
  CreditCard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { NotificationBell } from "./NotificationBell";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/attendance", label: "Attendance", icon: Clock },
  { href: "/leave", label: "Leave", icon: CalendarOff },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/payroll", label: "Payroll", icon: CreditCard },
  { href: "/admin/dashboard", label: "Admin Overview", icon: BarChart3, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = navItems.filter(
    (item) => !item.adminOnly || user?.role === "admin"
  );

  const NavLinks = () => (
    <nav className="flex flex-col gap-1 mt-4">
      {links.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/dashboard"
            ? pathname === href
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              active
                ? "bg-indigo-600/20 text-indigo-400 shadow-sm"
                : "text-gray-400 hover:text-gray-100 hover:bg-white/5"
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 bg-gray-950">
        <span className="font-bold text-lg gradient-text">Dayflow</span>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            id="sidebar-mobile-toggle"
            onClick={() => setMobileOpen((o) => !o)}
            className="text-gray-400 hover:text-white"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-64 bg-gray-950 border-r border-white/5 p-4 flex flex-col">
            <span className="font-bold text-lg gradient-text mb-2">Dayflow</span>
            <NavLinks />
            <button
              onClick={logout}
              className="mt-auto flex items-center gap-3 px-4 py-2.5 text-sm text-gray-500 hover:text-red-400 transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </aside>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-white/5 bg-gray-950 px-3 py-6">
        <div className="px-4 mb-6">
          <h1 className="text-xl font-bold gradient-text">Dayflow</h1>
          <p className="text-xs text-gray-500 mt-0.5">HRMS</p>
        </div>
        <NavLinks />
        <div className="mt-auto px-4">
          <div className="flex items-center gap-3 mb-4 pt-4 border-t border-white/5">
            <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-semibold text-sm">
              {user?.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">
                {user?.email}
              </p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            <NotificationBell />
          </div>
          <button
            id="logout-btn"
            onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
