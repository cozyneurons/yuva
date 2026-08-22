"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { attendanceApi, leaveApi, dashboardApi, profileApi, payrollApi } from "@/lib/api";

// ─── Profile ─────────────────────────────────────────────────────────────────

export function useMyProfile() {
  return useQuery({
    queryKey: ["profile-me"],
    queryFn: () => profileApi.getMe().then((r) => r.data),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => profileApi.updateMe(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["profile-me"] }),
  });
}

export function useUpdateEmployeeAdmin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: unknown }) =>
      profileApi.updateEmployee(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-employees"] }),
  });
}

// ─── Payroll ─────────────────────────────────────────────────────────────────

export function usePayroll(employeeId: number | undefined) {
  return useQuery({
    queryKey: ["payroll", employeeId],
    queryFn: () => payrollApi.get(employeeId!).then((r) => r.data),
    enabled: !!employeeId,
  });
}

export function useUpdatePayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: number; data: unknown }) =>
      payrollApi.update(employeeId, data),
    onSuccess: (_data, vars) =>
      qc.invalidateQueries({ queryKey: ["payroll", vars.employeeId] }),
  });
}

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
