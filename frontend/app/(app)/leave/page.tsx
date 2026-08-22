"use client";

import { useLeaves, useRequestLeave, useUpdateLeaveStatus } from "@/hooks/useQueries";
import { useAuth } from "@/lib/auth-context";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { leaveRequestSchema, LeaveRequestInput } from "@/lib/schemas";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, X, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

const statusStyle: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400",
  approved: "bg-green-500/15 text-green-400",
  rejected: "bg-red-500/15 text-red-400",
};

type LeaveRecord = {
  id: number;
  leave_type: "paid" | "sick" | "unpaid";
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  admin_comments?: string;
  employee_name?: string; // only visible to admin
};

export default function LeavePage() {
  const { user } = useAuth();
  const { data: leaves, isLoading } = useLeaves();
  const requestLeave = useRequestLeave();
  const updateStatus = useUpdateLeaveStatus();
  const [showForm, setShowForm] = useState(false);
  const [adminComment, setAdminComment] = useState<Record<number, string>>({});

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LeaveRequestInput>({ resolver: zodResolver(leaveRequestSchema) });

  const onSubmit = async (data: LeaveRequestInput) => {
    await requestLeave.mutateAsync(data);
    reset();
    setShowForm(false);
  };

  const handleStatus = (id: number, status: "approved" | "rejected") => {
    updateStatus.mutate({ id, status, admin_comments: adminComment[id] });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-100">Leave</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your time off</p>
        </div>
        {user?.role === "employee" && (
          <button
            id="request-leave-btn"
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200"
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? "Cancel" : "Request leave"}
          </button>
        )}
      </div>

      {/* Request form */}
      {showForm && (
        <div className="glass rounded-2xl p-6">
          <h3 className="text-base font-semibold text-gray-200 mb-5">
            New leave request
          </h3>
          <form
            id="leave-request-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Leave type */}
              <div>
                <label
                  htmlFor="leave-type"
                  className="block text-sm text-gray-300 mb-1.5"
                >
                  Leave type
                </label>
                <select
                  id="leave-type"
                  {...register("leave_type")}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                >
                  <option value="" className="bg-gray-900">
                    Select type
                  </option>
                  <option value="paid" className="bg-gray-900">
                    Paid
                  </option>
                  <option value="sick" className="bg-gray-900">
                    Sick
                  </option>
                  <option value="unpaid" className="bg-gray-900">
                    Unpaid
                  </option>
                </select>
                {errors.leave_type && (
                  <p className="text-xs text-red-400 mt-1">
                    {errors.leave_type.message}
                  </p>
                )}
              </div>

              {/* Start date */}
              <div>
                <label
                  htmlFor="leave-start"
                  className="block text-sm text-gray-300 mb-1.5"
                >
                  Start date
                </label>
                <input
                  id="leave-start"
                  type="date"
                  {...register("start_date")}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                {errors.start_date && (
                  <p className="text-xs text-red-400 mt-1">
                    {errors.start_date.message}
                  </p>
                )}
              </div>

              {/* End date */}
              <div>
                <label
                  htmlFor="leave-end"
                  className="block text-sm text-gray-300 mb-1.5"
                >
                  End date
                </label>
                <input
                  id="leave-end"
                  type="date"
                  {...register("end_date")}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                {errors.end_date && (
                  <p className="text-xs text-red-400 mt-1">
                    {errors.end_date.message}
                  </p>
                )}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label
                htmlFor="leave-remarks"
                className="block text-sm text-gray-300 mb-1.5"
              >
                Remarks{" "}
                <span className="text-gray-600">(optional)</span>
              </label>
              <textarea
                id="leave-remarks"
                rows={3}
                {...register("remarks")}
                placeholder="Any details the admin should know…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
              />
              {errors.remarks && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.remarks.message}
                </p>
              )}
            </div>

            <button
              id="leave-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-all duration-200 flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Submit request
            </button>
          </form>
        </div>
      )}

      {/* Leave list */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-base font-semibold text-gray-200 mb-4">
          {user?.role === "admin" ? "All leave requests" : "My requests"}
        </h3>

        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 size={14} className="animate-spin" />
            Loading…
          </div>
        )}

        {!isLoading && (!leaves || leaves.length === 0) && (
          <p className="text-sm text-gray-600">No leave requests yet.</p>
        )}

        <div className="space-y-3">
          {(leaves as LeaveRecord[] | undefined)?.map((leave) => (
            <div
              key={leave.id}
              className="bg-white/5 rounded-xl p-4 hover:bg-white/8 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  {user?.role === "admin" && leave.employee_name && (
                    <p className="text-sm font-semibold text-gray-100 mb-0.5">
                      {leave.employee_name}
                    </p>
                  )}
                  <p className="text-sm text-gray-300 capitalize">
                    {leave.leave_type} leave
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(leave.start_date)} → {formatDate(leave.end_date)}
                  </p>
                  {leave.remarks && (
                    <p className="text-xs text-gray-600 mt-1 italic">
                      &ldquo;{leave.remarks}&rdquo;
                    </p>
                  )}
                  {leave.admin_comments && (
                    <p className="text-xs text-gray-500 mt-1">
                      Admin note: {leave.admin_comments}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span
                    className={cn(
                      "px-3 py-0.5 rounded-full text-xs font-medium capitalize",
                      statusStyle[leave.status]
                    )}
                  >
                    {leave.status}
                  </span>

                  {/* Admin approval actions */}
                  {user?.role === "admin" && leave.status === "pending" && (
                    <div className="space-y-2 text-right">
                      <input
                        type="text"
                        placeholder="Admin comment (optional)"
                        value={adminComment[leave.id] ?? ""}
                        onChange={(e) =>
                          setAdminComment((prev) => ({
                            ...prev,
                            [leave.id]: e.target.value,
                          }))
                        }
                        className="text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-gray-300 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
                      />
                      <div className="flex gap-2">
                        <button
                          id={`approve-leave-${leave.id}`}
                          onClick={() => handleStatus(leave.id, "approved")}
                          className="flex items-center gap-1 text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <CheckCircle2 size={12} />
                          Approve
                        </button>
                        <button
                          id={`reject-leave-${leave.id}`}
                          onClick={() => handleStatus(leave.id, "rejected")}
                          className="flex items-center gap-1 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <XCircle size={12} />
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
