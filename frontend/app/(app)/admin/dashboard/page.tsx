"use client";

import { useAdminOverview } from "@/hooks/useQueries";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type LeaveItem = {
  id: number;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
};

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminOverview();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Admin overview</h2>
        <p className="text-sm text-gray-500">{formatDate(new Date())}</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total employees" value={data?.total_employees ?? "—"} />
        <Stat label="Present today" value={data?.present_today ?? "—"} sub={data?.attendance_rate ? `${data.attendance_rate}%` : undefined} />
        <Stat label="On leave" value={data?.on_leave_today ?? "—"} />
        <Stat label="Pending leaves" value={data?.pending_leaves ?? "—"} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-sm font-medium text-gray-900 mb-3">Pending leave requests</p>
        {data?.pending_leave_requests?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-2 font-normal">Employee</th>
                <th className="pb-2 font-normal">Type</th>
                <th className="pb-2 font-normal">Dates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.pending_leave_requests.map((req: LeaveItem) => (
                <tr key={req.id} className="text-gray-700">
                  <td className="py-2">{req.employee_name}</td>
                  <td className="py-2 capitalize">{req.leave_type}</td>
                  <td className="py-2 text-gray-500">
                    {formatDate(req.start_date)} – {formatDate(req.end_date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-gray-400">No pending requests</p>
        )}
      </div>
    </div>
  );
}
