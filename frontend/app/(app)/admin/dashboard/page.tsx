"use client";

import { useAdminOverview } from "@/hooks/useQueries";
import { formatDate } from "@/lib/utils";
import { Users, Clock, CalendarOff, TrendingUp, Loader2 } from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 hover:scale-[1.02] transition-transform duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-100 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
}

type LeaveItem = {
  id: number;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: string;
};

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminOverview();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Admin Overview</h2>
        <p className="text-gray-500 text-sm mt-1">{formatDate(new Date())}</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading overview…
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total employees"
          value={data?.total_employees ?? "—"}
          icon={Users}
          color="bg-indigo-500/15 text-indigo-400"
        />
        <StatCard
          label="Present today"
          value={data?.present_today ?? "—"}
          icon={Clock}
          color="bg-green-500/15 text-green-400"
          sub={`${data?.attendance_rate ?? "—"}% attendance`}
        />
        <StatCard
          label="On leave today"
          value={data?.on_leave_today ?? "—"}
          icon={CalendarOff}
          color="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          label="Pending leave requests"
          value={data?.pending_leaves ?? "—"}
          icon={TrendingUp}
          color="bg-red-500/15 text-red-400"
        />
      </div>

      {/* Pending leave approvals */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-base font-semibold text-gray-200 mb-4">
          Pending leave requests
        </h3>
        {data?.pending_leave_requests?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b border-white/5">
                  <th className="pb-3 font-medium">Employee</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Dates</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.pending_leave_requests.map((req: LeaveItem) => (
                  <tr key={req.id} className="text-gray-300">
                    <td className="py-3">{req.employee_name}</td>
                    <td className="py-3 capitalize">{req.leave_type}</td>
                    <td className="py-3">
                      {formatDate(req.start_date)} – {formatDate(req.end_date)}
                    </td>
                    <td className="py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-400 capitalize">
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-600">No pending requests 🎉</p>
        )}
      </div>
    </div>
  );
}
