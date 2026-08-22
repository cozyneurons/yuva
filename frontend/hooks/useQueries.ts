"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi, leaveApi, dashboardApi } from "@/lib/api";

// ─── Dashboard ───────────────────────────────────────────────────────────────

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.getSummary().then((r) => r.data),
    refetchInterval: 30_000, // live refresh fallback
  });
}

export function useAdminOverview() {
  return useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => dashboardApi.getAdminOverview().then((r) => r.data),
    refetchInterval: 30_000,
  });
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export function useAttendance() {
  return useQuery({
    queryKey: ["attendance"],
    queryFn: () => attendanceApi.getWeekly().then((r) => r.data),
    refetchInterval: 30_000,
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceApi.checkIn(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance"] }),
  });
}

// ─── Leave ───────────────────────────────────────────────────────────────────

export function useLeaves() {
  return useQuery({
    queryKey: ["leaves"],
    queryFn: () => leaveApi.list().then((r) => r.data),
  });
}

export function useRequestLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => leaveApi.request(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leaves"] }),
  });
}

export function useUpdateLeaveStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      admin_comments,
    }: {
      id: number;
      status: "approved" | "rejected";
      admin_comments?: string;
    }) => leaveApi.updateStatus(id, status, admin_comments),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leaves"] }),
  });
}
