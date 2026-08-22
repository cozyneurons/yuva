"use client";

import { useDashboard } from "@/hooks/useQueries";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { DashboardChart } from "@/components/dashboard/DashboardChart";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="brutal-card p-6 flex flex-col justify-between h-full relative overflow-hidden group hover:bg-theme-mint hover:-translate-y-1">
      <div className="absolute top-0 right-0 w-20 h-20 bg-theme-mint rounded-bl-full opacity-50 group-hover:scale-[1.2] transition-transform duration-500 ease-out border-b-2 border-l-2 border-transparent group-hover:border-theme-dark" />
      <p className="text-4xl font-serif font-bold text-theme-dark tracking-tight relative z-10">{value}</p>
      <p className="text-sm font-bold text-slate-700 mt-2 tracking-wide uppercase relative z-10">{label}</p>
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
        <h2 className="text-4xl font-serif font-bold text-theme-dark tracking-tight">
          {greeting}, {user?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0]}
        </h2>
        <p className="text-sm font-bold text-slate-600 mt-2 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {formatDate(new Date())}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-3 text-theme-dark text-sm font-bold bg-white p-4 rounded-xl border-2 border-theme-dark w-max shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
          <Loader2 size={18} className="animate-spin" /> Loading dashboard statistics...
        </div>
      )}
      {isError && (
        <div className="text-sm font-bold text-red-700 py-4 px-5 bg-[#FFB5B5] rounded-xl border-2 border-theme-dark flex items-center gap-2 w-max shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <div className="lg:col-span-1 brutal-card p-6 group flex flex-col hover:shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] hover:-translate-y-1">
              <h3 className="text-sm font-bold text-theme-dark mb-1 uppercase tracking-wider flex items-center gap-2">
                <div className="p-1.5 bg-[#F9F871] border-2 border-theme-dark rounded-md">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-theme-dark"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>
                </div>
                Overview
              </h3>
              <p className="text-xs text-slate-600 font-bold mb-6 mt-2">Current month&apos;s statistics</p>
              
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
                <Link href="/attendance" className="brutal-card p-6 bg-theme-mint flex flex-col hover:shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] hover:-translate-y-1">
                  <div className="w-12 h-12 bg-white border-2 border-theme-dark rounded-xl flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-theme-dark"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-theme-dark tracking-tight mb-1">Log Attendance</h3>
                  <p className="text-theme-dark/70 text-sm font-bold">Record your daily check-in</p>
                </Link>
                
                <Link href="/leave" className="brutal-card p-6 bg-[#C8B8E8] flex flex-col hover:shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] hover:-translate-y-1">
                  <div className="w-12 h-12 bg-white border-2 border-theme-dark rounded-xl flex items-center justify-center mb-4 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-theme-dark"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </div>
                  <h3 className="text-xl font-serif font-bold text-theme-dark tracking-tight mb-1">Request Leave</h3>
                  <p className="text-theme-dark/70 text-sm font-bold">Apply for time off</p>
                </Link>
              </div>

              {/* Recent Activity Feed */}
              <div className="flex-1 brutal-card p-6 sm:p-8 hover:shadow-[6px_6px_0px_0px_rgba(17,17,17,1)] hover:-translate-y-1">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-sm font-bold text-theme-dark mb-1 uppercase tracking-wider flex items-center gap-2">
                      <div className="p-1.5 bg-[#E37A7A] border-2 border-theme-dark rounded-md">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-theme-dark"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                      </div>
                      Recent Activity
                    </h3>
                    <p className="text-xs text-slate-600 font-bold mt-2">Latest updates from your profile</p>
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
                              <div className="absolute left-[22px] top-10 w-[3px] h-[calc(100%+4px)] bg-theme-dark transition-colors duration-300" />
                            )}
                            <div className="w-11 h-11 rounded-xl bg-white border-2 border-theme-dark flex items-center justify-center shrink-0 z-10 group-hover:-translate-y-1 group-hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] transition-all duration-200 text-theme-dark">
                              {isLeave ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                              ) : isCheckIn ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                              ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                              )}
                            </div>
                            <div className="flex-1 bg-white border-2 border-transparent group-hover:border-theme-dark group-hover:shadow-[2px_2px_0px_0px_rgba(17,17,17,1)] rounded-xl p-3 -mt-2 transition-all duration-200 group-hover:-translate-y-1 group-hover:-translate-x-1">
                              <p className="text-sm font-bold text-theme-dark">{item.message}</p>
                              <p className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                {formatDate(item.created_at)}
                              </p>
                            </div>
                          </li>
                        );
                      }
                    )}
                  </ul>
                ) : (
                  <div className="text-center py-10 bg-theme-beige rounded-xl border-2 border-theme-dark">
                    <div className="w-14 h-14 bg-white border-2 border-theme-dark rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-theme-dark"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
                    </div>
                    <p className="text-sm font-bold text-theme-dark">No recent activity</p>
                    <p className="text-xs text-slate-500 mt-1 font-bold">Your updates will appear here</p>
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

