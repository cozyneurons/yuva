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
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h2 className="text-4xl font-serif font-bold text-theme-dark tracking-tight">Attendance</h2>
        <p className="text-sm font-bold text-slate-600 mt-2">{formatDate(new Date())}</p>
      </div>

      {/* Today */}
      <div className="brutal-card p-6 sm:p-8">
        <p className="text-sm font-bold text-theme-dark mb-6 uppercase tracking-wider">Today's Status</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-[#D9F5CC] rounded-xl p-4 border-2 border-theme-dark shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            <p className="text-xs font-bold text-theme-dark/70 mb-1 uppercase tracking-wider">Check-in</p>
            <p className="text-2xl font-serif font-bold text-theme-dark">
              {today?.check_in ? formatTime(today.check_in) : "—"}
            </p>
          </div>
          <div className="bg-[#FFB5B5] rounded-xl p-4 border-2 border-theme-dark shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            <p className="text-xs font-bold text-theme-dark/70 mb-1 uppercase tracking-wider">Check-out</p>
            <p className="text-2xl font-serif font-bold text-theme-dark">
              {today?.check_out ? formatTime(today.check_out) : "—"}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            id="check-in-btn"
            onClick={() => checkIn.mutate()}
            disabled={checkInDisabled}
            className={cn(
              "flex-1 flex items-center justify-center gap-2",
              checkInDisabled
                ? "bg-slate-200 text-slate-400 border-2 border-slate-300 rounded-full px-6 py-3 font-bold cursor-not-allowed opacity-70"
                : "brutal-btn py-3"
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
              "flex-1 flex items-center justify-center gap-2",
              checkOutDisabled
                ? "bg-slate-200 text-slate-400 border-2 border-slate-300 rounded-full px-6 py-3 font-bold cursor-not-allowed opacity-70"
                : "brutal-btn-outline bg-[#F9F871] py-3"
            )}
          >
            {checkOut.isPending && <Loader2 size={16} className="animate-spin" />}
            {hasCheckedOut ? "Checked out" : "Check out"}
          </button>
        </div>
      </div>

      {/* Weekly */}
      <div className="brutal-card p-6 sm:p-8">
        <p className="text-sm font-bold text-theme-dark mb-4 uppercase tracking-wider">This week</p>
        {isError ? (
          <div className="text-sm font-bold text-red-700 py-4 px-5 bg-[#FFB5B5] rounded-xl border-2 border-theme-dark flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(17,17,17,1)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Failed to load attendance history.
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-3 text-theme-dark text-sm font-bold py-8 justify-center">
            <Loader2 size={18} className="animate-spin" /> Loading attendance...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b-2 border-theme-dark">
                  <th className="pb-3 px-2">Date</th>
                  <th className="pb-3 px-2">In</th>
                  <th className="pb-3 px-2">Out</th>
                  <th className="pb-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-theme-dark/10">
                {weekly.map((r) => (
                  <tr key={r.id ?? r.date} className="text-slate-800 hover:bg-theme-mint/20 transition-colors group">
                    <td className="py-4 px-2 font-bold text-theme-dark">{formatDate(r.date)}</td>
                    <td className="py-4 px-2 font-medium">{r.check_in ? formatTime(r.check_in) : "—"}</td>
                    <td className="py-4 px-2 font-medium">{r.check_out ? formatTime(r.check_out) : "—"}</td>
                    <td className="py-4 px-2">
                      <span className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border-2 border-theme-dark shadow-[1px_1px_0px_0px_rgba(17,17,17,1)]",
                        r.status === "present" ? "bg-theme-green text-white" :
                        r.status === "absent" ? "bg-[#FFB5B5] text-red-900" :
                        r.status === "half_day" ? "bg-[#F9F871] text-amber-900" :
                        "bg-[#C8B8E8] text-indigo-900"
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
