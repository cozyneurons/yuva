"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi, leaveApi, dashboardApi, profileApi, payrollApi, analyticsApi } from "@/lib/api";

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaves"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leaves"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => profileApi.getMe().then((r) => r.data),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      full_name?: string;
      address?: string;
      phone?: string;
      profile_picture_url?: string;
    }) => profileApi.updateMe(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

// ─── Payroll ──────────────────────────────────────────────────────────────────

export function usePayroll(employeeId: number | undefined) {
  return useQuery({
    queryKey: ["payroll", employeeId],
    queryFn: () => payrollApi.get(employeeId!).then((r) => r.data),
    enabled: !!employeeId,
  });
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function useAnalyticsReport(period?: string) {
  return useQuery({
    queryKey: ["analytics-report", period ?? "current"],
    queryFn: () => analyticsApi.getReport(period).then((r) => r.data),
    staleTime: 60_000, // report data is stable; don't hammer the DB
  });
}
