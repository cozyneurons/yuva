"use client";

import { useDashboard } from "@/hooks/useQueries";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Good morning, {user?.email?.split("@")[0]}
        </h2>
        <p className="text-sm text-gray-500">{formatDate(new Date())}</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      )}
      {isError && (
        <p className="text-sm text-red-500">Could not load dashboard data.</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Present this month" value={data?.present_days ?? "—"} />
        <Stat label="Absences" value={data?.absent_days ?? "—"} />
        <Stat label="Leave balance" value={data?.leave_balance ?? "—"} />
        <Stat label="Team size" value={data?.team_size ?? "—"} />
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Recent activity</h3>
        {data?.recent_activity?.length ? (
          <ul className="space-y-2.5">
            {data.recent_activity.map(
              (item: { id: number; message: string; created_at: string }) => (
                <li key={item.id} className="flex items-start gap-2">
                  <span className="mt-2 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-700">{item.message}</p>
                    <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
                  </div>
                </li>
              )
            )}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">No recent activity</p>
        )}
      </div>
    </div>
  );
}
