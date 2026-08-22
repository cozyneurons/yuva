"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        if (
          parsed &&
          typeof parsed === "object" &&
          Object.prototype.hasOwnProperty.call(parsed, "role")
        ) {
          const { role } = parsed as { role?: unknown };
          if (role === "admin") {
            router.replace("/admin/dashboard");
            return;
          } else if (role === "employee") {
            router.replace("/dashboard");
            return;
          }
        }
        router.replace("/login");
      } catch {
        router.replace("/login");
      }
    } else {
      router.replace("/login");
    }
  }, [router]);

  return null;
}
