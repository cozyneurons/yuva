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
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
        <CheckCircle2 size={36} className="text-green-500 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-gray-900">Account created!</h2>
        <p className="text-sm text-gray-500 mt-1">Taking you to your dashboard…</p>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create an account</h1>
        <p className="text-sm text-slate-500 mt-2 font-medium">Enter your details to get started</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="register-form">
        <div>
          <label htmlFor="reg-emp-code" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Employee ID
          </label>
          <input
            id="reg-emp-code"
            type="text"
            placeholder="EMP-001"
            {...register("employee_code")}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
          />
          {errors.employee_code && (
            <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errors.employee_code.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reg-full-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Full name
          </label>
          <input
            id="reg-full-name"
            type="text"
            placeholder="John Doe"
            {...register("full_name")}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
          />
          {errors.full_name && (
            <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Work email
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...register("email")}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            placeholder="Min 8 characters"
            {...register("password")}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="reg-confirm-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Confirm password
          </label>
          <input
            id="reg-confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            {...register("confirm_password")}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-200"
          />
          {errors.confirm_password && (
            <p className="text-xs text-red-500 mt-1.5 font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {errors.confirm_password.message}
            </p>
          )}
        </div>

        {serverErr && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {serverErr}
          </div>
        )}

        <button
          id="register-submit"
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-slate-900 hover:bg-indigo-600 text-white text-sm font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-8 font-medium">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
