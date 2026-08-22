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
};

type AuthCtx = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  googleLogin: () => void;
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
      // Decode minimal info from token payload (no jwt-decode dep needed)
      const payload = JSON.parse(atob(data.access_token.split(".")[1]));
      const me: User = {
        id: payload.sub,
        email: payload.email,
        role: data.role as "admin" | "employee",
        employee_code: payload.employee_code,
      };
      localStorage.setItem("user", JSON.stringify(me));
      setUser(me);
      router.push(me.role === "admin" ? "/admin/dashboard" : "/dashboard");
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
    router.push("/login");
  }, [router]);

  const googleLogin = () => authApi.googleLogin();

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
