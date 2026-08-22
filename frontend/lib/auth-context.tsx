"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";

type User = {
  id: number;
  email: string;
  role: "admin" | "employee";
  employee_code: string;
  full_name?: string;
};

type AuthCtx = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  setUserAfterRegister: (user: User) => void;
  logout: () => void;
  googleLogin: () => void;
  updateUser: (data: Partial<User>) => void;
};

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await authApi.login({ email, password });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      // Fetch profile from /employees/me to get employee_code and full_name
      const payload = JSON.parse(atob(data.access_token.split(".")[1]));
      // Get employee_code from the profile endpoint
      const profileRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/employees/me`,
        { headers: { Authorization: `Bearer ${data.access_token}` } }
      );
      let employeeCode = "";
      let fullName = "";
      if (profileRes.ok) {
        const profile = await profileRes.json();
        employeeCode = profile.employee_code ?? "";
        fullName = profile.full_name ?? "";
      }
      const me: User = {
        id: parseInt(payload.sub),
        email: email,
        role: data.role as "admin" | "employee",
        employee_code: employeeCode,
        ...(fullName && { full_name: fullName }),
      };
      localStorage.setItem("user", JSON.stringify(me));
      setUser(me);
      router.push(me.role === "admin" ? "/admin/dashboard" : "/dashboard");
    },
    [router]
  );

  const setUserAfterRegister = useCallback((newUser: User) => {
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
    router.push("/login");
  }, [router]);

  const googleLogin = () => authApi.googleLogin();

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, setUserAfterRegister, logout, googleLogin, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
