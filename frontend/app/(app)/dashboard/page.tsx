"use client";

import { useDashboard } from "@/hooks/useQueries";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] card-hover flex flex-col justify-between h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform duration-300" />
      <p className="text-3xl font-bold text-slate-900 tracking-tight relative z-10">{value}</p>
      <p className="text-sm font-semibold text-slate-500 mt-2 tracking-wide uppercase relative z-10">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboard();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Good morning, {user?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0]}
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-1">{formatDate(new Date())}</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 text-indigo-500 text-sm font-medium">
          <Loader2 size={18} className="animate-spin" /> Loading dashboard...
        </div>
      )}
      {isError && (
        <div className="text-sm font-medium text-red-500 py-4 px-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Could not load dashboard data.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Present" value={data?.present_days ?? "—"} />
        <Stat label="Absences" value={data?.absent_days ?? "—"} />
        <Stat label="Leaves left" value={data?.leave_balance ?? "—"} />
        <Stat label="Team size" value={data?.team_size ?? "—"} />
      </div>

      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Recent activity</h3>
        {data?.recent_activity?.length ? (
          <ul className="space-y-5">
            {data.recent_activity.map(
              (item: { id: number; message: string; created_at: string }, i: number) => (
                <li key={item.id} className="flex items-start gap-4 relative">
                  {i !== data.recent_activity.length - 1 && (
                    <div className="absolute left-2.5 top-6 w-[2px] h-full bg-slate-100" />
                  )}
                  <div className="w-5 h-5 rounded-full bg-indigo-100 border-[3px] border-white shadow-sm flex items-center justify-center shrink-0 z-10 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.message}</p>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">{formatDate(item.created_at)}</p>
                  </div>
                </li>
              )
            )}
          </ul>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
            </div>
            <p className="text-sm font-medium text-slate-500">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}
