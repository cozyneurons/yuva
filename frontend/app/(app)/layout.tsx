"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useAuth } from "@/lib/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || isLoading) return;
    
    if (!user) {
      router.replace("/login");
    } else if (!user.employee_code) {
      router.replace("/complete-profile");
    } else if (pathname.startsWith("/admin") && user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [user, isLoading, isHydrated, pathname, router]);

  if (
    !isHydrated ||
    isLoading ||
    !user ||
    !user.employee_code ||
    (pathname.startsWith("/admin") && user.role !== "admin")
  ) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-4xl">{children}</main>
    </div>
  );
}
