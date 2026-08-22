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
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["payroll", vars.employeeId] });
      qc.invalidateQueries({ queryKey: ["admin-employees"] });
    },
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
    queryFn: () => attendanceApi.getWeekly().then((r) => {
      const records = r.data as any[];
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const todayRecord = records.find((rec) => rec.date === todayStr);
      return {
        today: todayRecord,
        weekly: records,
      };
    }),
    refetchInterval: 30_000,
  });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceApi.checkIn().then(r => r.data),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["attendance"] });
      const previous = qc.getQueryData(["attendance"]);
      
      qc.setQueryData(["attendance"], (old: any) => {
        if (!old) return old;
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        return {
          ...old,
          today: {
            ...(old.today || {}),
            id: old.today?.id || Date.now(),
            date: todayStr,
            check_in: new Date().toISOString(),
            status: "present"
          }
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["attendance"], context.previous);
      }
    },
    onSuccess: (data) => {
      qc.setQueryData(["attendance"], (old: any) => {
        if (!old || !old.today) return old;
        return { ...old, today: { ...old.today, check_in: data.check_in } };
      });
      qc.invalidateQueries({ queryKey: ["attendance"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceApi.checkOut().then(r => r.data),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["attendance"] });
      const previous = qc.getQueryData(["attendance"]);
      
      qc.setQueryData(["attendance"], (old: any) => {
        if (!old || !old.today) return old;
        return {
          ...old,
          today: {
            ...old.today,
            check_out: new Date().toISOString(),
          }
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        qc.setQueryData(["attendance"], context.previous);
      }
    },
    onSuccess: (data) => {
      qc.setQueryData(["attendance"], (old: any) => {
        if (!old || !old.today) return old;
        return { ...old, today: { ...old.today, check_out: data.check_out } };
      });
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
    mutationFn: (data: LeaveRequestInput) => leaveApi.request(data),
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
