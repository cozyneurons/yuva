"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-950">
    <div className="text-center">
      <Loader2 size={40} className="animate-spin text-indigo-400 mx-auto mb-4" />
      <p className="text-gray-400 text-sm">Signing you in…</p>
    </div>
  </div>
);

// Inner component uses useSearchParams — must be wrapped in Suspense
function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const access = params.get("access_token");
    const refresh = params.get("refresh_token");
    const role = params.get("role");

    if (!access || !refresh) {
      router.replace("/login?error=oauth_failed");
      return;
    }

    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);

    try {
      const payload = JSON.parse(atob(access.split(".")[1]));
      const user = { id: payload.sub, email: payload.email, role, employee_code: payload.employee_code };
      localStorage.setItem("user", JSON.stringify(user));

      if (!payload.employee_code) {
        router.replace("/complete-profile");
      } else {
        router.replace(role === "admin" ? "/admin/dashboard" : "/dashboard");
      }
    } catch {
      router.replace("/login?error=token_parse");
    }
  }, [params, router]);

  return <Spinner />;
}

// Backend redirects here after Google OAuth: /auth/callback?access_token=...&refresh_token=...&role=...
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackInner />
    </Suspense>
  );
}
