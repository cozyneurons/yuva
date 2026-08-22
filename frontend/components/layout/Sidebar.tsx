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
  Users,
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
  { href: "/admin/employees", label: "Employees", icon: Users, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = navItems.filter((item) => !item.adminOnly || user?.role === "admin");

  const NavLinks = () => (
    <nav className="flex flex-col gap-0.5 mt-2">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
              active
                ? "bg-gray-100 text-gray-900 font-medium"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            )}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white">
        <span className="font-semibold text-gray-900">Dayflow</span>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            id="sidebar-mobile-toggle"
            onClick={() => setMobileOpen((o) => !o)}
            className="text-gray-500 hover:text-gray-900 p-1"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 w-56 bg-white border-r border-gray-200 p-4 flex flex-col">
            <span className="font-semibold text-gray-900 mb-3">Dayflow</span>
            <NavLinks />
            <button
              onClick={logout}
              className="mt-auto flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-gray-900"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-52 shrink-0 border-r border-gray-200 bg-white px-3 py-5">
        <div className="px-3 mb-5">
          <h1 className="text-base font-semibold text-gray-900">Dayflow</h1>
        </div>

        <NavLinks />

        <div className="mt-auto pt-4 border-t border-gray-100 px-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            <NotificationBell />
          </div>
          <button
            id="logout-btn"
            onClick={logout}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <LogOut size={12} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
