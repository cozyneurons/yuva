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
import { useState, useEffect, useRef } from "react";
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
  const drawerRef = useRef<HTMLDivElement>(null);
  const prevActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (mobileOpen) {
      prevActiveElement.current = document.activeElement as HTMLElement;
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setMobileOpen(false);
          return;
        }
        
        if (e.key === "Tab" && drawerRef.current) {
          const focusable = Array.from(
            drawerRef.current.querySelectorAll<HTMLElement>(
              'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
            )
          ).filter(el => !el.hasAttribute('disabled'));

          if (focusable.length === 0) {
            e.preventDefault();
            return;
          }

          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              last.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === last) {
              first.focus();
              e.preventDefault();
            }
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      
      // Delay focus slightly to ensure the drawer is rendered
      const timeoutId = setTimeout(() => {
         if (drawerRef.current) {
            const focusable = drawerRef.current.querySelector<HTMLElement>('a[href], button');
            if (focusable) focusable.focus();
         }
      }, 0);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener("keydown", handleKeyDown);
        if (prevActiveElement.current) {
          prevActiveElement.current.focus();
        }
      };
    }
  }, [mobileOpen]);

  const links = navItems.filter((item) => !item.adminOnly || user?.role === "admin");

  const NavLinks = () => (
    <nav className="flex flex-col gap-2 mt-6">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 border-2 border-transparent",
              active
                ? "bg-theme-mint text-theme-dark border-theme-dark shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] translate-x-[-2px] translate-y-[-2px]"
                : "text-slate-600 hover:text-theme-dark hover:bg-white hover:border-theme-dark hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
            )}
          >
            <Icon size={18} className={cn("transition-transform duration-200", active ? "scale-110 stroke-[2.5px]" : "group-hover:scale-110")} />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden flex items-center justify-between px-5 py-4 border-b-2 border-theme-dark bg-theme-beige sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-theme-green border-2 border-theme-dark flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <span className="font-serif font-bold text-xl tracking-tight text-theme-dark">Dayflow.</span>
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
        <div id="mobile-navigation-drawer" role="dialog" aria-modal="true" ref={drawerRef} className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-theme-dark/40 backdrop-blur-sm transition-opacity" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 w-64 bg-theme-beige border-r-2 border-theme-dark p-5 flex flex-col shadow-[8px_0_0_0_rgba(17,17,17,1)]">
            <div className="flex items-center gap-2 mb-6 px-2">
              <div className="w-8 h-8 rounded-lg bg-theme-green border-2 border-theme-dark flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <span className="font-serif font-bold text-xl tracking-tight text-theme-dark">Dayflow.</span>
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
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r-2 border-theme-dark bg-theme-beige px-5 py-6 z-10 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-theme-green border-2 border-theme-dark flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
          </div>
          <h1 className="text-2xl font-serif font-bold tracking-tight text-theme-dark mt-1">Dayflow.</h1>
        </div>

        <NavLinks />

        <div className="mt-auto pt-6 border-t-2 border-theme-dark">
          <div className="flex items-center justify-between mb-4 px-4 bg-white border-2 border-theme-dark p-3 rounded-xl shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-theme-dark truncate">{user?.full_name ?? "User"}</p>
              <p className="text-xs text-slate-500 font-medium truncate">{user?.email}</p>
            </div>
            <NotificationBell />
          </div>
          <button
            id="logout-btn"
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 text-sm font-bold text-slate-600 border-2 border-transparent hover:text-white hover:bg-theme-dark hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] py-2.5 rounded-xl transition-all duration-200"
          >
            <LogOut size={16} className="stroke-[2.5px]" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
