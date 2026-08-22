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
    <nav className="flex flex-col gap-1 mt-4">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 overflow-hidden",
              active
                ? "text-indigo-700 font-semibold bg-indigo-50/80"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
            )}
          >
            {active && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-indigo-600 rounded-r-full" />
            )}
            <Icon size={18} className={cn("transition-transform duration-200", active ? "scale-110" : "group-hover:scale-110")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-slate-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span className="font-bold tracking-tight text-slate-900">Dayflow</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button
            id="sidebar-mobile-toggle"
            onClick={() => setMobileOpen((o) => !o)}
            className="text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-md transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation-drawer"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div id="mobile-navigation-drawer" className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 w-64 bg-white/95 backdrop-blur-xl border-r border-slate-200/60 p-5 flex flex-col shadow-2xl">
            <div className="flex items-center gap-2 mb-6 px-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <span className="font-bold tracking-tight text-slate-900">Dayflow</span>
            </div>
            <NavLinks />
            <button
              onClick={logout}
              className="mt-auto flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200/60 bg-white/60 backdrop-blur-xl px-4 py-6 z-10 sticky top-0 h-screen">
        <div className="flex items-center gap-2.5 px-4 mb-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Dayflow</h1>
        </div>

        <NavLinks />

        <div className="mt-auto pt-6 border-t border-slate-200/60">
          <div className="flex items-center justify-between mb-4 px-4 bg-slate-100/50 p-3 rounded-xl border border-slate-200/50">
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.full_name ?? "User"}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <NotificationBell />
          </div>
          <button
            id="logout-btn"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 py-2.5 rounded-xl transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
