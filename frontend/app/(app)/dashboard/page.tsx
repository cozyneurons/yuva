"use client";

import { useDashboard } from "@/hooks/useQueries";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { DashboardChart } from "@/components/dashboard/DashboardChart";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] card-hover flex flex-col justify-between h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-bl-full opacity-50 group-hover:scale-[1.2] transition-transform duration-500 ease-out" />
      <p className="text-4xl font-bold text-slate-900 tracking-tight relative z-10">{value}</p>
      <p className="text-sm font-bold text-slate-500 mt-2 tracking-wide uppercase relative z-10">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboard();

  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          {greeting}, {user?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0]}
        </h2>
        <p className="text-sm font-medium text-slate-500 mt-1.5 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {formatDate(new Date())}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 text-indigo-500 text-sm font-semibold bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100/50 w-max">
          <Loader2 size={18} className="animate-spin" /> Loading dashboard statistics...
        </div>
      )}
      {isError && (
        <div className="text-sm font-semibold text-red-500 py-4 px-5 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-2 w-max">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Could not load dashboard data. Please refresh.
        </div>
      )}

      {!isLoading && !isError && data && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <Stat label="Present" value={data?.present_days ?? "—"} />
            <Stat label="Absences" value={data?.absent_days ?? "—"} />
            <Stat label="Leaves left" value={data?.leave_balance ?? "—"} />
            <Stat label="Team size" value={data?.team_size ?? "—"} />
          </div>

          {/* Bento Box Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <div className="lg:col-span-1 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-300 group flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 mb-1 uppercase tracking-wider flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
                Overview
              </h3>
              <p className="text-xs text-slate-500 font-medium mb-6">Current month&apos;s statistics</p>
              
              <div className="flex-1 flex items-center justify-center -ml-4">
                 <DashboardChart 
                   present={data.present_days} 
                   absent={data.absent_days} 
                   leaves={data.leave_balance} 
                 />
              </div>
            </div>

            {/* Middle Section: Quick Actions & Activity Feed */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/attendance" className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl p-6 text-white shadow-[0_10px_30px_rgb(99,102,241,0.25)] group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgb(99,102,241,0.35)]">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-1">Log Attendance</h3>
                  <p className="text-indigo-100 text-sm font-medium">Record your daily check-in</p>
                </Link>
                
                <Link href="/leave" className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-indigo-200">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-50/60 rounded-full blur-2xl group-hover:bg-indigo-100/60 transition-colors" />
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4 text-indigo-600 group-hover:scale-110 transition-transform duration-300">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1">Request Leave</h3>
                  <p className="text-slate-500 text-sm font-medium">Apply for time off</p>
                </Link>
              </div>

              {/* Recent Activity Feed */}
              <div className="flex-1 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 mb-1 uppercase tracking-wider flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                      Recent Activity
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Latest updates from your profile</p>
                  </div>
                </div>
                
                {data?.recent_activity?.length ? (
                  <ul className="space-y-6">
                    {data.recent_activity.map(
                      (item: { id: number; message: string; created_at: string }, i: number) => {
                        const isLeave = item.message.toLowerCase().includes("leave");
                        const isCheckIn = item.message.toLowerCase().includes("check");
                        
                        return (
                          <li key={item.id} className="group flex items-start gap-5 relative">
                            {i !== data.recent_activity.length - 1 && (
                              <div className="absolute left-[22px] top-10 w-[2px] h-[calc(100%+4px)] bg-slate-100 group-hover:bg-indigo-100 transition-colors duration-300" />
                            )}
                            <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm flex items-center justify-center shrink-0 z-10 group-hover:scale-110 group-hover:bg-indigo-50 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-all duration-300 text-slate-400">
                              {isLeave ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              ) : isCheckIn ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                              )}
                            </div>
                            <div className="flex-1 bg-transparent group-hover:bg-slate-50/80 rounded-2xl p-2.5 -mt-2 transition-colors duration-300">
                              <p className="text-sm font-bold text-slate-800">{item.message}</p>
                              <p className="text-xs font-semibold text-slate-400 mt-1 flex items-center gap-1.5">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                {formatDate(item.created_at)}
                              </p>
                            </div>
                          </li>
                        );
                      }
                    )}
                  </ul>
                ) : (
                  <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
                    </div>
                    <p className="text-sm font-bold text-slate-600">No recent activity</p>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Your updates will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

