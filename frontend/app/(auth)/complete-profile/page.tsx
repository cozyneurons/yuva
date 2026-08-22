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
    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      <div className="mb-7">
        <h1 className="text-xl font-semibold text-gray-900">Complete your profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Just a couple of details before you start
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="complete-profile-form">
        <div>
          <label htmlFor="cp-emp-code" className="block text-sm font-medium text-gray-700 mb-1">
            Employee ID
          </label>
          <input
            id="cp-emp-code"
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
          <label htmlFor="cp-full-name" className="block text-sm font-medium text-gray-700 mb-1">
            Full name
          </label>
          <input
            id="cp-full-name"
            type="text"
            placeholder="Ankita Sharma"
            {...register("full_name")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
          />
          {errors.full_name && (
            <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>
          )}
        </div>

        {serverErr && (
          <p className="text-sm text-red-500 text-center">{serverErr}</p>
        )}

        <button
          id="complete-profile-submit"
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition-colors flex justify-center items-center gap-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          Go to dashboard
        </button>
      </form>
    </div>
  );
}
