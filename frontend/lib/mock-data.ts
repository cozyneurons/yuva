/**
 * Mock data — used while backend endpoints aren't live.
 * Swap to real API calls by replacing these with useQuery hooks hitting api.ts.
 */
import type {
  Employee,
  PayrollRecord,
  AdminReport,
} from "./types";

export const MOCK_EMPLOYEE: Employee = {
  id: 1,
  user_id: 1,
  employee_code: "EMP001",
  email: "abir.das@dayflow.io",
  role: "employee",
  is_verified: true,
  full_name: "Abir Das",
  address: "42 Saltlake Sector V, Kolkata 700091",
  phone: "+91 98300 00001",
  job_details: "Frontend Engineer — Product Team",
  salary_structure: {
    basic: 60000,
    hra: 24000,
    allowances: 8000,
    deductions: 5000,
    net_salary: 87000,
  },
  documents: {
    offer_letter: "https://example.com/docs/offer.pdf",
    id_proof: "https://example.com/docs/id.pdf",
  },
  profile_picture_url: null,
  updated_at: "2025-06-01T10:00:00Z",
};

export const MOCK_PAYROLL_RECORDS: PayrollRecord[] = [
  {
    id: 1,
    employee_id: 1,
    employee_code: "EMP001",
    full_name: "Abir Das",
    month: "2025-06",
    salary_structure: { basic: 60000, hra: 24000, allowances: 8000, deductions: 5000, net_salary: 87000 },
    paid_at: "2025-06-30T18:00:00Z",
  },
  {
    id: 2,
    employee_id: 1,
    employee_code: "EMP001",
    full_name: "Abir Das",
    month: "2025-05",
    salary_structure: { basic: 60000, hra: 24000, allowances: 8000, deductions: 5500, net_salary: 86500 },
    paid_at: "2025-05-31T18:00:00Z",
  },
  {
    id: 3,
    employee_id: 1,
    employee_code: "EMP001",
    full_name: "Abir Das",
    month: "2025-04",
    salary_structure: { basic: 58000, hra: 23200, allowances: 7500, deductions: 5000, net_salary: 83700 },
    paid_at: "2025-04-30T18:00:00Z",
  },
  {
    id: 4,
    employee_id: 1,
    employee_code: "EMP001",
    full_name: "Abir Das",
    month: "2025-03",
    salary_structure: { basic: 58000, hra: 23200, allowances: 7500, deductions: 4800, net_salary: 83900 },
    paid_at: "2025-03-31T18:00:00Z",
  },
  {
    id: 5,
    employee_id: 1,
    employee_code: "EMP001",
    full_name: "Abir Das",
    month: "2025-02",
    salary_structure: { basic: 55000, hra: 22000, allowances: 7000, deductions: 4500, net_salary: 79500 },
    paid_at: "2025-02-28T18:00:00Z",
  },
  {
    id: 6,
    employee_id: 1,
    employee_code: "EMP001",
    full_name: "Abir Das",
    month: "2025-01",
    salary_structure: { basic: 55000, hra: 22000, allowances: 7000, deductions: 4500, net_salary: 79500 },
    paid_at: "2025-01-31T18:00:00Z",
  },
];

export const MOCK_ADMIN_REPORT: AdminReport = {
  period: "2025-06",
  total_employees: 48,
  present_days: 1056,
  absent_days: 96,
  leave_days: 48,
  total_payroll: 4176000,
  department_breakdown: [
    { department: "Engineering", headcount: 18, avg_salary: 95000 },
    { department: "Design", headcount: 8, avg_salary: 85000 },
    { department: "Product", headcount: 6, avg_salary: 105000 },
    { department: "HR", headcount: 5, avg_salary: 72000 },
    { department: "Finance", headcount: 5, avg_salary: 80000 },
    { department: "Marketing", headcount: 6, avg_salary: 78000 },
  ],
  attendance_trend: Array.from({ length: 20 }, (_, i) => {
    const date = new Date("2025-06-01");
    date.setDate(date.getDate() + i);
    const weekday = date.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    return {
      date: date.toISOString().split("T")[0],
      present: isWeekend ? 0 : 40 + Math.floor(Math.random() * 6),
      absent: isWeekend ? 0 : 2 + Math.floor(Math.random() * 4),
      leave: isWeekend ? 0 : 1 + Math.floor(Math.random() * 3),
    };
  }),
};
