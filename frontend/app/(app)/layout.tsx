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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 relative selection:bg-indigo-100 selection:text-indigo-900">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/40 blur-[120px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-200/40 blur-[120px]" />
      </div>
      
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 max-w-6xl mx-auto relative z-10 w-full animate-fade-in-up">
        {children}
      </main>
    </div>
  );
}
