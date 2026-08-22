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
    <div className="brutal-card p-8 sm:p-10 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-4xl font-serif font-bold text-theme-dark tracking-tight">Complete your profile</h1>
        <p className="text-sm text-theme-dark/70 mt-2 font-bold">
          Just a couple of details before you start
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="complete-profile-form">
        <div>
          <label htmlFor="cp-emp-code" className="block text-sm font-bold text-theme-dark mb-1.5">
            Employee ID
          </label>
          <input
            id="cp-emp-code"
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
          <label htmlFor="cp-full-name" className="block text-sm font-bold text-theme-dark mb-1.5">
            Full name
          </label>
          <input
            id="cp-full-name"
            type="text"
            placeholder="Ankita Sharma"
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

        {serverErr && (
          <div className="p-3 bg-[#FFB5B5] border-2 border-theme-dark rounded-xl text-sm text-red-900 font-bold flex items-start gap-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {serverErr}
          </div>
        )}

        <button
          id="complete-profile-submit"
          type="submit"
          disabled={isSubmitting}
          className="brutal-btn w-full py-3.5 flex items-center justify-center gap-2 mt-4"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? "Saving..." : "Go to dashboard"}
        </button>
      </form>
    </div>
  );
}
