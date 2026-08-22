"""Schemas for dashboard & analytics endpoints (Nihaal — Backend Support).

Field names mirror the frontend contracts:
  - DashboardSummary  → app/(app)/dashboard/page.tsx
  - AdminOverview     → app/(app)/admin/dashboard/page.tsx
  - AdminReport       → lib/types.ts `AdminReport` (analytics/page.tsx / Recharts)
"""
from datetime import date, datetime

from pydantic import BaseModel


# ── GET /dashboard/summary ──────────────────────────────────────────────────
class RecentActivity(BaseModel):
    id: int
    message: str
    created_at: datetime


class DashboardSummary(BaseModel):
    present_days: int          # present days this month (current user)
    absent_days: int           # absent days this month
    leave_balance: int         # annual quota minus approved leave days taken this year
    team_size: int             # total employees in the org
    recent_activity: list[RecentActivity]


# ── GET /admin/overview ─────────────────────────────────────────────────────
class PendingLeaveRequest(BaseModel):
    id: int
    employee_name: str
    leave_type: str
    start_date: date
    end_date: date
    status: str


class AdminOverview(BaseModel):
    total_employees: int
    present_today: int
    on_leave_today: int
    pending_leaves: int
    attendance_rate: float     # present_today / total_employees * 100, one decimal
    pending_leave_requests: list[PendingLeaveRequest]


# ── GET /admin/employees/{id}/summary ───────────────────────────────────────
class EmployeeSummary(BaseModel):
    employee_id: int
    full_name: str
    employee_code: str
    email: str
    present_days: int          # this month
    absent_days: int           # this month
    leave_days: int            # approved leave days this year
    pending_leaves: int
    net_salary: float


# ── GET /admin/reports?period=YYYY-MM ───────────────────────────────────────
class DeptBreakdown(BaseModel):
    department: str
    headcount: int
    avg_salary: float


class AttendanceTrendPoint(BaseModel):
    date: str                  # "YYYY-MM-DD"
    present: int
    absent: int
    leave: int


class AdminReport(BaseModel):
    period: str                # "YYYY-MM"
    total_employees: int
    present_days: int
    absent_days: int
    leave_days: int
    total_payroll: float
    department_breakdown: list[DeptBreakdown]
    attendance_trend: list[AttendanceTrendPoint]
