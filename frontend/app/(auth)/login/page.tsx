"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginInput } from "@/lib/schemas";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const [serverErr, setServerErr] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginInput) => {
    setServerErr("");
    try {
      await login(data.email, data.password);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string | any[] } } };
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : (Array.isArray(detail) ? detail[0]?.msg : null);
      setServerErr(msg ?? "Invalid email or password");
    }
  };

  return (
    <div className="brutal-card p-8 sm:p-10">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-theme-dark tracking-tight">Sign in</h1>
        <p className="text-sm text-theme-dark/70 mt-2 font-bold">Welcome back to Dayflow.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="login-form">
        <div>
          <label htmlFor="login-email" className="block text-sm font-bold text-theme-dark mb-1.5">
            Work Email
          </label>
          <input
            id="login-email"
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
          <label htmlFor="login-password" className="block text-sm font-bold text-theme-dark mb-1.5">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
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

        {serverErr && (
          <div className="p-3 bg-[#FFB5B5] border-2 border-theme-dark rounded-xl text-sm text-red-900 font-bold flex items-start gap-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {serverErr}
          </div>
        )}

        <button
          id="login-submit"
          type="submit"
          disabled={isSubmitting}
          className="brutal-btn w-full py-3.5 flex items-center justify-center gap-2 mt-4"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-0.5 bg-theme-dark/10" />
        <span className="text-xs font-bold text-theme-dark/50 uppercase tracking-wider">or</span>
        <div className="flex-1 h-0.5 bg-theme-dark/10" />
      </div>

      <button
        id="google-login-btn"
        onClick={googleLogin}
        className="brutal-btn-outline w-full bg-white flex items-center justify-center gap-3 py-3.5"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-sm text-theme-dark/70 mt-8 font-bold">
        Don't have an account?{" "}
        <Link href="/register" className="text-theme-dark underline hover:text-theme-green transition-colors">
          Create account
        </Link>
      </p>
    </div>
  );
}
