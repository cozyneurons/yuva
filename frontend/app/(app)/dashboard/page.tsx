"use client";

import { useDashboard } from "@/hooks/useQueries";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";
import {
  Clock,
  CalendarOff,
  CheckCircle2,
  Users,
  Loader2,
} from "lucide-react";

type StatCardProps = {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
};

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform duration-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-100">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboard();
  const today = formatDate(new Date());

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100">
          Good morning,{" "}
          <span className="gradient-text">{user?.email?.split("@")[0]}</span>
        </h2>
        <p className="text-gray-500 text-sm mt-1">{today}</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 size={16} className="animate-spin" />
          Loading dashboard…
        </div>
      )}

      {isError && (
        <p className="text-red-400 text-sm">
          Could not load dashboard data. Using cached data if available.
        </p>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Present this month"
          value={data?.present_days ?? "—"}
          icon={CheckCircle2}
          color="bg-green-500/15 text-green-400"
        />
        <StatCard
          label="Absences this month"
          value={data?.absent_days ?? "—"}
          icon={Clock}
          color="bg-red-500/15 text-red-400"
        />
        <StatCard
          label="Leave balance"
          value={data?.leave_balance ?? "—"}
          icon={CalendarOff}
          color="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          label="Team size"
          value={data?.team_size ?? "—"}
          icon={Users}
          color="bg-indigo-500/15 text-indigo-400"
        />
      </div>

      {/* Recent activity */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-base font-semibold text-gray-200 mb-4">
          Recent activity
        </h3>
        {data?.recent_activity?.length ? (
          <ul className="space-y-3">
            {data.recent_activity.map(
              (item: { id: number; message: string; created_at: string }) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <div>
                    <p className="text-sm text-gray-300">{item.message}</p>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                </li>
              )
            )}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">No recent activity</p>
        )}
      </div>
    </div>
  );
}
