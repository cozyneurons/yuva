"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/lib/schemas";
import { authApi } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
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
      await authApi.register({
        employee_code: data.employee_code,
        email: data.email,
        password: data.password,
      });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } };
      setServerErr(err?.response?.data?.detail ?? "Registration failed. Try again.");
    }
  };

  if (success) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <CheckCircle2 size={48} className="text-green-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-100">Account created!</h2>
        <p className="text-gray-400 text-sm mt-2">Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold gradient-text">Dayflow</h1>
        <p className="text-gray-400 mt-2 text-sm">Create your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="register-form">
        {/* Employee ID */}
        <div>
          <label htmlFor="reg-emp-code" className="block text-sm text-gray-300 mb-1.5">
            Employee ID
          </label>
          <input
            id="reg-emp-code"
            type="text"
            placeholder="EMP-001"
            {...register("employee_code")}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          {errors.employee_code && (
            <p className="text-xs text-red-400 mt-1">{errors.employee_code.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="block text-sm text-gray-300 mb-1.5">
            Work email
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...register("email")}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          {errors.email && (
            <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className="block text-sm text-gray-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="reg-password"
              type={showPw ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Min 8 characters"
              {...register("password")}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="reg-confirm-password" className="block text-sm text-gray-300 mb-1.5">
            Confirm password
          </label>
          <input
            id="reg-confirm-password"
            type={showPw ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Repeat password"
            {...register("confirm_password")}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          {errors.confirm_password && (
            <p className="text-xs text-red-400 mt-1">{errors.confirm_password.message}</p>
          )}
        </div>

        {serverErr && (
          <p className="text-sm text-red-400 text-center">{serverErr}</p>
        )}

        <button
          id="register-submit"
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Create account
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
