"use client";

import { useAttendance, useCheckIn, useCheckOut } from "@/hooks/useQueries";
import { formatDate, formatTime } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AttendanceRecord = {
  id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: "present" | "absent" | "half_day" | "leave";
};

const statusLabel: Record<string, string> = {
  present: "Present",
  absent: "Absent",
  half_day: "Half day",
  leave: "Leave",
};

export default function AttendancePage() {
  const { data, isLoading, isError } = useAttendance();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const today = data?.today as AttendanceRecord | undefined;
  const weekly = (data?.weekly ?? []) as AttendanceRecord[];
  const hasCheckedIn = !!today?.check_in;
  const hasCheckedOut = !!today?.check_out;

  const checkInDisabled = !data || isLoading || hasCheckedIn || checkIn.isPending;
  const checkOutDisabled = !hasCheckedIn || hasCheckedOut || checkOut.isPending;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">{formatDate(new Date())}</p>
      </div>

      {/* Today */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-wider">Today's Status</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Check-in</p>
            <p className="text-lg font-bold text-slate-900">
              {today?.check_in ? formatTime(today.check_in) : "—"}
            </p>
          </div>
          <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Check-out</p>
            <p className="text-lg font-bold text-slate-900">
              {today?.check_out ? formatTime(today.check_out) : "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            id="check-in-btn"
            onClick={() => checkIn.mutate()}
            disabled={checkInDisabled}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold border transition-all duration-300",
              checkInDisabled
                ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed opacity-70"
                : "border-transparent text-white bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
            )}
          >
            {checkIn.isPending && <Loader2 size={16} className="animate-spin" />}
            {hasCheckedIn ? "Checked in" : "Check in"}
          </button>
          <button
            id="check-out-btn"
            onClick={() => checkOut.mutate()}
            disabled={checkOutDisabled}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold border transition-all duration-300",
              checkOutDisabled
                ? "border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed opacity-70"
                : "border-transparent text-white bg-slate-900 hover:bg-slate-800 shadow-md hover:shadow-xl hover:-translate-y-0.5 active:scale-95"
            )}
          >
            {checkOut.isPending && <Loader2 size={16} className="animate-spin" />}
            {hasCheckedOut ? "Checked out" : "Check out"}
          </button>
        </div>
      </div>

      {/* Weekly */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <p className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">This week</p>
        {isError ? (
          <div className="text-sm font-medium text-red-500 py-4 px-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Failed to load attendance history.
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-3 text-indigo-500 text-sm font-medium py-8 justify-center">
            <Loader2 size={18} className="animate-spin" /> Loading attendance...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200/60">
                  <th className="pb-3 px-2">Date</th>
                  <th className="pb-3 px-2">In</th>
                  <th className="pb-3 px-2">Out</th>
                  <th className="pb-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {weekly.map((r) => (
                  <tr key={r.id ?? r.date} className="text-slate-700 hover:bg-slate-50/50 transition-colors group">
                    <td className="py-3 px-2 font-medium text-slate-900">{formatDate(r.date)}</td>
                    <td className="py-3 px-2">{r.check_in ? formatTime(r.check_in) : "—"}</td>
                    <td className="py-3 px-2">{r.check_out ? formatTime(r.check_out) : "—"}</td>
                    <td className="py-3 px-2">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                        r.status === "present" ? "bg-green-100 text-green-700" :
                        r.status === "absent" ? "bg-red-100 text-red-700" :
                        r.status === "half_day" ? "bg-amber-100 text-amber-700" :
                        "bg-indigo-100 text-indigo-700"
                      )}>
                        {statusLabel[r.status] ?? r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
