"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { completeProfileSchema, CompleteProfileInput } from "@/lib/schemas";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function CompleteProfilePage() {
  const { user, updateUser, isLoading } = useAuth();
  const router = useRouter();
  const [serverErr, setServerErr] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CompleteProfileInput>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { employee_code: user?.employee_code ?? "" },
  });

  useEffect(() => {
    if (user && !isLoading) {
      reset({ employee_code: user.employee_code ?? "" });
    }
  }, [user, isLoading, reset]);

  const onSubmit = async (data: CompleteProfileInput) => {
    if (!user) return;
    setServerErr("");
    try {
      await api.patch("/employees/me", data);
      updateUser({ employee_code: data.employee_code, full_name: data.full_name });
      router.push(user.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string | any[] } } };
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : (Array.isArray(detail) ? detail[0]?.msg : null);
      setServerErr(msg ?? "Failed to save. Try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8 text-indigo-500">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Complete your profile</h1>
        <p className="text-sm text-slate-500 mt-2 font-medium">
          Just a couple of details before you start
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="complete-profile-form">
        <div>
          <label htmlFor="cp-emp-code" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Employee ID
          </label>
          <input
            id="cp-emp-code"
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
          <label htmlFor="cp-full-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Full name
          </label>
          <input
            id="cp-full-name"
            type="text"
            placeholder="Ankita Sharma"
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

        {serverErr && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 font-medium flex items-start gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {serverErr}
          </div>
        )}

        <button
          id="complete-profile-submit"
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-slate-900 hover:bg-indigo-600 text-white text-sm font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-[0.98] mt-4"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? "Saving..." : "Go to dashboard"}
        </button>
      </form>
    </div>
  );
}
