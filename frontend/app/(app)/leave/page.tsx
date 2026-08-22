"use client";

import { useLeaves, useRequestLeave, useUpdateLeaveStatus } from "@/hooks/useQueries";
import { useAuth } from "@/lib/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leaveRequestSchema, LeaveRequestInput } from "@/lib/schemas";
import { formatDate, cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { useState } from "react";

type LeaveRecord = {
  id: number;
  leave_type: "paid" | "sick" | "unpaid";
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  admin_comments?: string;
  employee_name?: string;
};

const statusColors: Record<string, string> = {
  pending: "text-amber-600",
  approved: "text-green-600",
  rejected: "text-red-500",
};

export default function LeavePage() {
  const { user } = useAuth();
  const { data: leaves, isLoading, isError } = useLeaves();
  const requestLeave = useRequestLeave();
  const updateStatus = useUpdateLeaveStatus();
  const [showForm, setShowForm] = useState(false);
  const [adminComment, setAdminComment] = useState<Record<number, string>>({});
  const [serverErr, setServerErr] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeaveRequestInput>({ resolver: zodResolver(leaveRequestSchema) });

  const onSubmit = async (data: LeaveRequestInput) => {
    setServerErr("");
    try {
      await requestLeave.mutateAsync(data);
      reset();
      setShowForm(false);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string | any[] } } };
      const detail = err?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : (Array.isArray(detail) ? detail[0]?.msg : null);
      setServerErr(msg ?? "Failed to submit request.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-serif font-bold text-theme-dark tracking-tight">Leave</h2>
          <p className="text-sm font-bold text-slate-600 mt-2">Manage your time off</p>
        </div>
        <button
          id="request-leave-btn"
          onClick={() => setShowForm((s) => !s)}
          className="text-sm font-medium text-gray-900 border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 transition"
        >
          {showForm ? "Cancel" : "Request leave"}
        </button>
      </div>

      {/* Request form */}
      {showForm && (
        <div className="brutal-card p-6 bg-theme-mint">
          <p className="text-sm font-bold text-theme-dark mb-4 uppercase tracking-wider">New request</p>
          <form id="leave-request-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="leave-type" className="block text-sm font-bold text-theme-dark mb-2">Type</label>
                <select
                  id="leave-type"
                  {...register("leave_type")}
                  className="brutal-input"
                >
                  <option value="">Select</option>
                  <option value="paid">Paid</option>
                  <option value="sick">Sick</option>
                  <option value="unpaid">Unpaid</option>
                </select>
                {errors.leave_type && <p className="text-xs font-bold text-red-700 mt-1">{errors.leave_type.message}</p>}
              </div>
              <div>
                <label htmlFor="leave-start" className="block text-sm font-bold text-theme-dark mb-2">Start</label>
                <input id="leave-start" type="date" {...register("start_date")}
                  className="brutal-input" />
                {errors.start_date && <p className="text-xs font-bold text-red-700 mt-1">{errors.start_date.message}</p>}
              </div>
              <div>
                <label htmlFor="leave-end" className="block text-sm font-bold text-theme-dark mb-2">End</label>
                <input id="leave-end" type="date" {...register("end_date")}
                  className="brutal-input" />
                {errors.end_date && <p className="text-xs font-bold text-red-700 mt-1">{errors.end_date.message}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="leave-remarks" className="block text-sm font-bold text-theme-dark mb-2">
                Remarks <span className="text-theme-dark/60 font-normal">(optional)</span>
              </label>
              <textarea id="leave-remarks" rows={2} {...register("remarks")}
                placeholder="Any details…"
                className="brutal-input resize-none" />
            </div>
            {serverErr && <p className="text-sm font-bold text-red-700 bg-[#FFB5B5] p-3 rounded-lg border-2 border-theme-dark">{serverErr}</p>}
            <button id="leave-submit-btn" type="submit" disabled={isSubmitting}
              className="brutal-btn flex items-center justify-center gap-2 w-full sm:w-auto mt-2">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Submit Request
            </button>
          </form>
        </div>
      )}

      {/* Leave list */}
      <div className="brutal-card p-6 sm:p-8">
        <p className="text-sm font-bold text-theme-dark mb-6 uppercase tracking-wider">
          {user?.role === "admin" ? "All requests" : "My requests"}
        </p>
        {isLoading && (
          <div className="flex items-center gap-3 text-theme-dark text-sm font-bold">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        )}
        {isError && (
          <p className="text-sm font-bold text-red-700">Failed to load leave requests.</p>
        )}
        {!isLoading && !isError && (!leaves || (leaves as LeaveRecord[]).length === 0) && (
          <p className="text-sm font-bold text-slate-500">No leave requests yet.</p>
        )}
        <div className="divide-y-2 divide-theme-dark/10">
          {(leaves as LeaveRecord[] | undefined)?.map((leave) => (
            <div key={leave.id} className="py-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                {user?.role === "admin" && leave.employee_name && (
                  <p className="text-lg font-serif font-bold text-theme-dark mb-1">{leave.employee_name}</p>
                )}
                <p className="text-sm font-bold text-theme-dark capitalize">{leave.leave_type} leave</p>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  {formatDate(leave.start_date)} – {formatDate(leave.end_date)}
                </p>
                {leave.remarks && (
                  <p className="text-sm text-slate-700 mt-2 bg-slate-50 p-3 rounded-lg border-2 border-theme-dark shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]">{leave.remarks}</p>
                )}
                {leave.admin_comments && (
                  <p className="text-xs font-bold text-theme-dark mt-2 bg-[#F9F871] p-2 rounded border-2 border-theme-dark inline-block">Note: {leave.admin_comments}</p>
                )}
              </div>

              <div className="flex flex-col items-start sm:items-end gap-3 shrink-0 mt-3 sm:mt-0">
                <span className={cn(
                  "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 border-theme-dark shadow-[1px_1px_0px_0px_rgba(17,17,17,1)] capitalize",
                  leave.status === "approved" ? "bg-theme-green text-white" :
                  leave.status === "rejected" ? "bg-[#FFB5B5] text-red-900" :
                  "bg-[#F9F871] text-amber-900"
                )}>
                  {leave.status}
                </span>
                {user?.role === "admin" && leave.status === "pending" && (
                  <div className="space-y-2 text-right w-full">
                    <input
                      type="text"
                      placeholder="Comment (optional)"
                      value={adminComment[leave.id] ?? ""}
                      onChange={(e) => setAdminComment((prev) => ({ ...prev, [leave.id]: e.target.value }))}
                      className="brutal-input py-2 px-3 text-xs w-full sm:w-48"
                    />
                    <div className="flex gap-2 justify-end">
                      <button id={`approve-leave-${leave.id}`}
                        onClick={() => updateStatus.mutate({ id: leave.id, status: "approved", admin_comments: adminComment[leave.id] })}
                        disabled={updateStatus.isPending}
                        className="bg-theme-green text-white border-2 border-theme-dark rounded-md px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50">
                        Approve
                      </button>
                      <button id={`reject-leave-${leave.id}`}
                        onClick={() => updateStatus.mutate({ id: leave.id, status: "rejected", admin_comments: adminComment[leave.id] })}
                        disabled={updateStatus.isPending}
                        className="bg-[#FFB5B5] text-theme-dark border-2 border-theme-dark rounded-md px-3 py-1 text-xs font-bold shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(17,17,17,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50">
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
