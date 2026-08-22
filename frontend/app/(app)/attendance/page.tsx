"use client";

import { useAttendance, useCheckIn, useCheckOut } from "@/hooks/useQueries";
import { formatDate, formatTime } from "@/lib/utils";
import { Clock, LogIn, LogOut, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type AttendanceRecord = {
  id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: "present" | "absent" | "half_day" | "leave";
};

const statusStyle: Record<string, string> = {
  present: "bg-green-500/15 text-green-400",
  absent: "bg-red-500/15 text-red-400",
  half_day: "bg-amber-500/15 text-amber-400",
  leave: "bg-indigo-500/15 text-indigo-400",
};

export default function AttendancePage() {
  const { data, isLoading } = useAttendance();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const today = data?.today as AttendanceRecord | undefined;
  const weekly = (data?.weekly ?? []) as AttendanceRecord[];

  const hasCheckedIn = !!today?.check_in;
  const hasCheckedOut = !!today?.check_out;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Attendance</h2>
        <p className="text-gray-500 text-sm mt-1">{formatDate(new Date())}</p>
      </div>

      {/* Today card */}
      <div className="glass rounded-2xl p-6 glow">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-base font-semibold text-gray-200">Today</p>
            <p className="text-xs text-gray-500">{formatDate(new Date())}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Check-in</p>
            <p className="text-lg font-semibold text-gray-100">
              {today?.check_in ? formatTime(today.check_in) : "—"}
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Check-out</p>
            <p className="text-lg font-semibold text-gray-100">
              {today?.check_out ? formatTime(today.check_out) : "—"}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            id="check-in-btn"
            onClick={() => checkIn.mutate()}
            disabled={hasCheckedIn || checkIn.isPending}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
              hasCheckedIn
                ? "bg-white/5 text-gray-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-500 text-white"
            )}
          >
            {checkIn.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogIn size={16} />
            )}
            {hasCheckedIn ? "Checked in ✓" : "Check in"}
          </button>

          <button
            id="check-out-btn"
            onClick={() => checkOut.mutate()}
            disabled={!hasCheckedIn || hasCheckedOut || checkOut.isPending}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-200",
              !hasCheckedIn || hasCheckedOut
                ? "bg-white/5 text-gray-600 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-500 text-white"
            )}
          >
            {checkOut.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}
            {hasCheckedOut ? "Checked out ✓" : "Check out"}
          </button>
        </div>
      </div>

      {/* Weekly history */}
      <div className="glass rounded-2xl p-6">
        <h3 className="text-base font-semibold text-gray-200 mb-4">This week</h3>
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 size={14} className="animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="space-y-2">
            {weekly.map((record) => (
              <div
                key={record.id ?? record.date}
                className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-gray-200">
                    {formatDate(record.date)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {record.check_in ? formatTime(record.check_in) : "—"} →{" "}
                    {record.check_out ? formatTime(record.check_out) : "—"}
                  </p>
                </div>
                <span
                  className={cn(
                    "px-3 py-0.5 rounded-full text-xs font-medium capitalize",
                    statusStyle[record.status] ?? "bg-gray-500/15 text-gray-400"
                  )}
                >
                  {record.status.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
