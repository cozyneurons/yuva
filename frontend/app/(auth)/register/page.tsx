"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterInput } from "@/lib/schemas";
import { authApi } from "@/lib/api";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
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
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
        <CheckCircle2 size={36} className="text-green-500 mx-auto mb-3" />
        <h2 className="text-base font-semibold text-gray-900">Account created</h2>
        <p className="text-sm text-gray-500 mt-1">Redirecting to login…</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-gray-900">Create an account</h1>
        <p className="text-sm text-gray-500 mt-1">Enter your details to get started</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="register-form">
        <div>
          <label htmlFor="reg-emp-code" className="block text-sm font-medium text-gray-700 mb-1">
            Employee ID
          </label>
          <input
            id="reg-emp-code"
            type="text"
            placeholder="EMP-001"
            {...register("employee_code")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          />
          {errors.employee_code && (
            <p className="text-xs text-red-500 mt-1">{errors.employee_code.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
            Work email
          </label>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            {...register("email")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="reg-password"
            type="password"
            autoComplete="new-password"
            placeholder="Min 8 characters"
            {...register("password")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          />
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm password
          </label>
          <input
            id="reg-confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat password"
            {...register("confirm_password")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          />
          {errors.confirm_password && (
            <p className="text-xs text-red-500 mt-1">{errors.confirm_password.message}</p>
          )}
        </div>

        {serverErr && (
          <p className="text-sm text-red-500">{serverErr}</p>
        )}

        <button
          id="register-submit"
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
          Create account
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-5">
        Already have an account?{" "}
        <Link href="/login" className="text-gray-900 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
