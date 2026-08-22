import axios from "axios";
import type { LeaveRequestInput } from "@/lib/schemas";

// ─── Axios instance ──────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/auth/refresh`,
            { refresh_token: refresh }
          );
          localStorage.setItem("access_token", data.access_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(err);
  }
);

// ─── Auth endpoints ──────────────────────────────────────────────────────────

export const authApi = {
  register: (data: unknown) => api.post("/auth/register", data),
  login: (data: unknown) =>
    api.post<{ access_token: string; refresh_token: string; role: string }>(
      "/auth/login",
      data
    ),
  googleLogin: () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/auth/google/login`;
  },
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const dashboardApi = {
  getSummary: () => api.get("/dashboard/summary"),
  getAdminOverview: () => api.get("/admin/overview"),
};

// ─── Attendance ──────────────────────────────────────────────────────────────

export const attendanceApi = {
  getWeekly: () => api.get("/attendance?range=week"),
  checkIn: () => api.post("/attendance/check-in"),
  checkOut: () => api.post("/attendance/check-out"),
};

// ─── Leave ───────────────────────────────────────────────────────────────────

export const leaveApi = {
  request: (data: LeaveRequestInput) => api.post("/leave", data),
  list: () => api.get("/leave"),
  updateStatus: (id: number, status: "approved" | "rejected", admin_comments?: string) =>
    api.patch(`/leave/${id}/status`, { status, admin_comments }),
};

// ─── Notifications ────────────────────────────────────────────────────────────

export const notificationsApi = {
  list: () => api.get("/notifications"),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
};

// ─── Profile ─────────────────────────────────────────────────────────────────

export const profileApi = {
  getMe: () => api.get("/employees/me"),
  updateMe: (data: unknown) => api.patch("/employees/me", data),
  getEmployee: (id: number) => api.get(`/employees/${id}`),
  updateEmployee: (id: number, data: unknown) => api.patch(`/employees/${id}`, data),
};

// ─── Payroll ──────────────────────────────────────────────────────────────────

export const payrollApi = {
  get: (employeeId: number) => api.get(`/payroll/${employeeId}`),
  update: (employeeId: number, data: unknown) => api.patch(`/payroll/${employeeId}`, data),
  downloadSlip: (employeeId: number) =>
    api.get(`/payroll/${employeeId}/slip`, { responseType: "blob" }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  listEmployees: () => api.get("/admin/employees"),
  getEmployeeSummary: (id: number) => api.get(`/admin/employees/${id}/summary`),
};
