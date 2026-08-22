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
  const { data, isLoading } = useAttendance();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const today = data?.today as AttendanceRecord | undefined;
  const weekly = (data?.weekly ?? []) as AttendanceRecord[];
  const hasCheckedIn = !!today?.check_in;
  const hasCheckedOut = !!today?.check_out;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Attendance</h2>
        <p className="text-sm text-gray-500">{formatDate(new Date())}</p>
      </div>

      {/* Today */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-sm font-medium text-gray-700 mb-4">Today</p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Check-in</p>
            <p className="text-sm font-medium text-gray-900">
              {today?.check_in ? formatTime(today.check_in) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-0.5">Check-out</p>
            <p className="text-sm font-medium text-gray-900">
              {today?.check_out ? formatTime(today.check_out) : "—"}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            id="check-in-btn"
            onClick={() => checkIn.mutate()}
            disabled={!attendance || hasCheckedIn || checkIn.isPending}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium border transition",
              hasCheckedIn
                ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                : "border-gray-900 text-gray-900 bg-white hover:bg-gray-50"
            )}
          >
            {checkIn.isPending && <Loader2 size={13} className="animate-spin" />}
            {hasCheckedIn ? "Checked in ✓" : "Check in"}
          </button>
          <button
            id="check-out-btn"
            onClick={() => checkOut.mutate()}
            disabled={!hasCheckedIn || hasCheckedOut || checkOut.isPending}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium border transition",
              !hasCheckedIn || hasCheckedOut
                ? "border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed"
                : "border-gray-900 text-gray-900 bg-white hover:bg-gray-50"
            )}
          >
            {checkOut.isPending && <Loader2 size={13} className="animate-spin" />}
            {hasCheckedOut ? "Checked out ✓" : "Check out"}
          </button>
        </div>
      </div>

      {/* Weekly */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">This week</p>
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 size={13} className="animate-spin" /> Loading…
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                <th className="pb-2 font-normal">Date</th>
                <th className="pb-2 font-normal">In</th>
                <th className="pb-2 font-normal">Out</th>
                <th className="pb-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {weekly.map((r) => (
                <tr key={r.id ?? r.date} className="text-gray-700">
                  <td className="py-2">{formatDate(r.date)}</td>
                  <td className="py-2">{r.check_in ? formatTime(r.check_in) : "—"}</td>
                  <td className="py-2">{r.check_out ? formatTime(r.check_out) : "—"}</td>
                  <td className="py-2 text-gray-500">{statusLabel[r.status] ?? r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
