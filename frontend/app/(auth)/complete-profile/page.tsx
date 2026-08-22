"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { completeProfileSchema, CompleteProfileInput } from "@/lib/schemas";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function CompleteProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [serverErr, setServerErr] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompleteProfileInput>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { employee_code: user?.employee_code ?? "" },
  });

  const onSubmit = async (data: CompleteProfileInput) => {
    setServerErr("");
    try {
      await api.patch("/employees/me", data);
      router.push("/dashboard");
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string | any[] } } };
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : (Array.isArray(detail) ? detail[0]?.msg : null);
      setServerErr(msg ?? "Failed to save. Try again.");
    }
  };

  return (
    <div className="glass rounded-2xl p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-100">Complete your profile</h1>
        <p className="text-gray-400 mt-2 text-sm">
          Just a couple of details before you start
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="complete-profile-form">
        <div>
          <label htmlFor="cp-emp-code" className="block text-sm text-gray-300 mb-1.5">
            Employee ID
          </label>
          <input
            id="cp-emp-code"
            type="text"
            placeholder="EMP-001"
            {...register("employee_code")}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          {errors.employee_code && (
            <p className="text-xs text-red-400 mt-1">{errors.employee_code.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="cp-full-name" className="block text-sm text-gray-300 mb-1.5">
            Full name
          </label>
          <input
            id="cp-full-name"
            type="text"
            placeholder="Ankita Sharma"
            {...register("full_name")}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          {errors.full_name && (
            <p className="text-xs text-red-400 mt-1">{errors.full_name.message}</p>
          )}
        </div>

        {serverErr && (
          <p className="text-sm text-red-400 text-center">{serverErr}</p>
        )}

        <button
          id="complete-profile-submit"
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Go to dashboard
        </button>
      </form>
    </div>
  );
}
