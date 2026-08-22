/**
 * Shared TypeScript types — mirror the Pydantic schemas from the backend.
 * These are the contracts Abir's pages are built against.
 */

// ── Employee / Profile ────────────────────────────────────────────────────────
export interface Employee {
  id: number;
  user_id: number;
  employee_code: string;
  email: string;
  role: "admin" | "employee";
  is_verified: boolean;
  full_name: string;
  address: string | null;
  phone: string | null;
  job_details: string | null;
  salary_structure: SalaryStructure | null;
  documents: Record<string, string> | null;
  profile_picture_url: string | null;
  updated_at: string; // ISO datetime
}

export interface EmployeeUpdate {
  full_name?: string;
  address?: string;
  phone?: string;
  profile_picture_url?: string;
}

// ── Salary / Payroll ──────────────────────────────────────────────────────────
export interface SalaryStructure {
  basic: number;
  hra: number;
  allowances: number;
  deductions: number;
  net_salary: number;
}

export interface PayrollRecord {
  id: number;
  employee_id: number;
  employee_code: string;
  full_name: string;
  month: string; // e.g. "2025-06"
  salary_structure: SalaryStructure;
  paid_at: string | null;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface AdminReport {
  period: string; // e.g. "2025-06"
  total_employees: number;
  present_days: number;
  absent_days: number;
  leave_days: number;
  total_payroll: number;
  department_breakdown: DeptBreakdown[];
  attendance_trend: AttendanceTrendPoint[];
}

export interface DeptBreakdown {
  department: string;
  headcount: number;
  avg_salary: number;
}

export interface AttendanceTrendPoint {
  date: string;
  present: number;
  absent: number;
  leave: number;
}
