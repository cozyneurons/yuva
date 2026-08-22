"use client";

import { useRouter } from "next/navigation";

// Root page: redirect handled client-side based on localStorage user
export default function HomePage() {
  const router = useRouter();

  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        router.replace(parsed.role === "admin" ? "/admin/dashboard" : "/dashboard");
      } catch {
        router.replace("/login");
      }
    } else {
      router.replace("/login");
    }
  }

  return null;
}
