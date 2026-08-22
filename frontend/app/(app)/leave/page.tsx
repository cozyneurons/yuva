"use client";

import { useLeaves, useRequestLeave, useUpdateLeaveStatus } from "@/hooks/useQueries";
import { useAuth } from "@/lib/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leaveRequestSchema, LeaveRequestInput } from "@/lib/schemas";
import { formatDate } from "@/lib/utils";
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
          <h2 className="text-lg font-semibold text-gray-900">Leave</h2>
          <p className="text-sm text-gray-500">Manage your time off</p>
        </div>
        {user?.role === "employee" && (
          <button
            id="request-leave-btn"
            onClick={() => setShowForm((s) => !s)}
            className="text-sm font-medium text-gray-900 border border-gray-300 px-3 py-1.5 rounded-md hover:bg-gray-50 transition"
          >
            {showForm ? "Cancel" : "Request leave"}
          </button>
        )}
      </div>

      {/* Request form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-sm font-medium text-gray-900 mb-4">New request</p>
          <form id="leave-request-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="leave-type" className="block text-sm text-gray-700 mb-1">Type</label>
                <select
                  id="leave-type"
                  {...register("leave_type")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                >
                  <option value="">Select</option>
                  <option value="paid">Paid</option>
                  <option value="sick">Sick</option>
                  <option value="unpaid">Unpaid</option>
                </select>
                {errors.leave_type && <p className="text-xs text-red-500 mt-1">{errors.leave_type.message}</p>}
              </div>
              <div>
                <label htmlFor="leave-start" className="block text-sm text-gray-700 mb-1">Start</label>
                <input id="leave-start" type="date" {...register("start_date")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                {errors.start_date && <p className="text-xs text-red-500 mt-1">{errors.start_date.message}</p>}
              </div>
              <div>
                <label htmlFor="leave-end" className="block text-sm text-gray-700 mb-1">End</label>
                <input id="leave-end" type="date" {...register("end_date")}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent" />
                {errors.end_date && <p className="text-xs text-red-500 mt-1">{errors.end_date.message}</p>}
              </div>
            </div>
            <div>
              <label htmlFor="leave-remarks" className="block text-sm text-gray-700 mb-1">
                Remarks <span className="text-gray-400">(optional)</span>
              </label>
              <textarea id="leave-remarks" rows={2} {...register("remarks")}
                placeholder="Any details…"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none" />
            </div>
            {serverErr && <p className="text-sm text-red-500">{serverErr}</p>}
            <button id="leave-submit-btn" type="submit" disabled={isSubmitting}
              className="bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition flex items-center gap-2">
              {isSubmitting && <Loader2 size={13} className="animate-spin" />}
              Submit
            </button>
          </form>
        </div>
      )}

      {/* Leave list */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-sm font-medium text-gray-900 mb-3">
          {user?.role === "admin" ? "All requests" : "My requests"}
        </p>
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 size={13} className="animate-spin" /> Loading…
          </div>
        )}
        {isError && (
          <p className="text-sm text-red-500">Failed to load leave requests.</p>
        )}
        {!isLoading && !isError && (!leaves || (leaves as LeaveRecord[]).length === 0) && (
          <p className="text-sm text-gray-400">No leave requests yet.</p>
        )}
        <div className="divide-y divide-gray-100">
          {(leaves as LeaveRecord[] | undefined)?.map((leave) => (
            <div key={leave.id} className="py-3 flex items-start justify-between gap-4">
              <div>
                {user?.role === "admin" && leave.employee_name && (
                  <p className="text-sm font-medium text-gray-900">{leave.employee_name}</p>
                )}
                <p className="text-sm text-gray-700 capitalize">{leave.leave_type} leave</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(leave.start_date)} – {formatDate(leave.end_date)}
                </p>
                {leave.remarks && (
                  <p className="text-xs text-gray-400 mt-0.5 italic">{leave.remarks}</p>
                )}
                {leave.admin_comments && (
                  <p className="text-xs text-gray-500 mt-0.5">Note: {leave.admin_comments}</p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-xs font-medium capitalize ${statusColors[leave.status] ?? "text-gray-500"}`}>
                  {leave.status}
                </span>
                {user?.role === "admin" && leave.status === "pending" && (
                  <div className="space-y-1.5 text-right">
                    <input
                      type="text"
                      placeholder="Comment (optional)"
                      value={adminComment[leave.id] ?? ""}
                      onChange={(e) => setAdminComment((prev) => ({ ...prev, [leave.id]: e.target.value }))}
                      className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 w-36"
                    />
                    <div className="flex gap-1.5">
                      <button id={`approve-leave-${leave.id}`}
                        onClick={() => updateStatus.mutate({ id: leave.id, status: "approved", admin_comments: adminComment[leave.id] })}
                        disabled={updateStatus.isPending}
                        className="text-xs border border-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition disabled:opacity-50">
                        Approve
                      </button>
                      <button id={`reject-leave-${leave.id}`}
                        onClick={() => updateStatus.mutate({ id: leave.id, status: "rejected", admin_comments: adminComment[leave.id] })}
                        disabled={updateStatus.isPending}
                        className="text-xs border border-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-50 transition disabled:opacity-50">
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
