"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/lib/schemas";
import { authApi } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { setUserAfterRegister } = useAuth();
  const [serverErr, setServerErr] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setServerErr("");
    try {
      const res = await authApi.register({
        employee_code: data.employee_code,
        full_name: data.full_name,
        email: data.email,
        password: data.password,
      });
      const { access_token, refresh_token } = res.data as { access_token: string; refresh_token: string };
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      // Decode sub (user id) from token
      const payload = JSON.parse(atob(access_token.split(".")[1]));
      setUserAfterRegister({
        id: parseInt(payload.sub),
        email: data.email,
        role: (payload.role ?? "employee") as "admin" | "employee",
        employee_code: data.employee_code,
      });
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string | unknown[] } } };
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : (Array.isArray(detail) ? (detail[0] as { msg?: string })?.msg : null);
      setServerErr(msg ?? "Registration failed. Try again.");
    }
  };


  if (success) {
    return (
      <div className="brutal-card p-8 bg-theme-mint text-center">
        <CheckCircle2 size={36} className="text-theme-dark mx-auto mb-3" />
        <h2 className="text-2xl font-serif font-bold text-theme-dark">Account created!</h2>
        <p className="text-sm text-theme-dark/70 mt-1 font-bold">Taking you to your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="brutal-card p-8 sm:p-10">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-theme-dark tracking-tight">Create an account</h1>
        <p className="text-sm text-theme-dark/70 mt-2 font-bold">Enter your details to get started</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="register-form">
        <div>
          <label htmlFor="reg-emp-code" className="block text-sm font-bold text-theme-dark mb-1.5">
            Employee ID
          </label>
          <input
            id="reg-emp-code"
            type="text"
            placeholder="EMP-001"
            {...register("employee_code")}
            className="brutal-input"
          />
          {errors.employee_code && (
            <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errors.employee_code.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reg-full-name" className="block text-sm font-bold text-theme-dark mb-1.5">
            Full name
          </label>
          <input
            id="reg-full-name"
            type="text"
            placeholder="John Doe"
            {...register("full_name")}
            className="brutal-input"
          />
          {errors.full_name && (
            <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-bold text-theme-dark mb-1.5">
            Work email
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...register("email")}
            className="brutal-input"
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-bold text-theme-dark mb-1.5">
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            placeholder="Min 8 characters"
            {...register("password")}
            className="brutal-input"
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reg-confirm-password" className="block text-sm font-bold text-theme-dark mb-1.5">
            Confirm password
          </label>
          <input
            id="reg-confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            {...register("confirm_password")}
            className="brutal-input"
          />
          {errors.confirm_password && (
            <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errors.confirm_password.message}
            </p>
          )}
        </div>

        {serverErr && (
          <div className="p-3 bg-[#FFB5B5] border-2 border-theme-dark rounded-xl text-sm text-red-900 font-bold flex items-start gap-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {serverErr}
          </div>
        )}

        <button
          id="register-submit"
          type="submit"
          disabled={isSubmitting}
          className="brutal-btn w-full py-3.5 flex items-center justify-center gap-2 mt-4"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-theme-dark/70 mt-8 font-bold">
        Already have an account?{" "}
        <Link href="/login" className="text-theme-dark underline hover:text-theme-green transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
