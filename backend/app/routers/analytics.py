"""Dashboard & analytics aggregation endpoints (Nihaal — Backend Support).

    GET /api/v1/dashboard/summary              — per-user snapshot (Employee/Admin)
    GET /api/v1/admin/overview                 — org-wide snapshot (Admin)
    GET /api/v1/admin/employees/{id}/summary   — one employee's stats (Admin)
    GET /api/v1/admin/reports?period=YYYY-MM   — workforce report for Recharts (Admin)

All aggregation is deliberately dialect-agnostic: rows are fetched and reduced in
Python rather than using Postgres-only date functions, so the same code runs against
the SQLite test DB and the Postgres production DB. Fine at hackathon data volumes.

There is no `department` column in the schema, so department is derived from the
`job_details` text (seed writes it as "<title> — <department>"); unknown → "General".
"""
import calendar
from collections import defaultdict
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_admin
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.models.leave import Leave, LeaveStatus
from app.models.notification import Notification
from app.models.user import User
from app.schemas.analytics import (
    AdminOverview,
    AdminReport,
    AttendanceTrendPoint,
    DashboardSummary,
    DeptBreakdown,
    EmployeeSummary,
    PendingLeaveRequest,
    RecentActivity,
)

router = APIRouter(tags=["analytics"])

ANNUAL_LEAVE_QUOTA = 24  # working days of paid+sick leave per calendar year


# ── helpers ─────────────────────────────────────────────────────────────────
async def _get_own_employee(user: User, db: AsyncSession) -> Employee:
    result = await db.execute(select(Employee).where(Employee.user_id == user.id))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
    return emp


def _month_bounds(period: str | None) -> tuple[date, date, str]:
    """Parse a 'YYYY-MM' period into (first_day, last_day, normalized_label).

    Defaults to the current month when *period* is omitted.
    """
    today = date.today()
    if period:
        try:
            year_s, month_s = period.split("-")
            year, month = int(year_s), int(month_s)
            date(year, month, 1)  # validates month range
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="period must be in YYYY-MM format",
            )
    else:
        year, month = today.year, today.month
    last_day = calendar.monthrange(year, month)[1]
    return date(year, month, 1), date(year, month, last_day), f"{year:04d}-{month:02d}"


def _department(job_details: str | None) -> str:
    """Derive a department label from free-text job_details ('<title> — <dept>')."""
    if not job_details:
        return "General"
    for sep in ("—", "–", " - "):
        if sep in job_details:
            tail = job_details.rsplit(sep, 1)[-1].strip()
            return tail or "General"
    return "General"


def _net_salary(salary_structure) -> float:
    if isinstance(salary_structure, dict):
        try:
            return float(salary_structure.get("net_salary") or 0)
        except (TypeError, ValueError):
            return 0.0
    return 0.0


def _leave_days(lv: Leave) -> int:
    return (lv.end_date - lv.start_date).days + 1


# ── GET /dashboard/summary ──────────────────────────────────────────────────
@router.get("/dashboard/summary", response_model=DashboardSummary)
async def dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Personal snapshot for the logged-in user (works for employees and admins)."""
    emp = await _get_own_employee(current_user, db)
    today = date.today()
    month_start = today.replace(day=1)
    year_start = date(today.year, 1, 1)

    statuses = (
        await db.execute(
            select(Attendance.status).where(
                Attendance.employee_id == emp.id,
                Attendance.date >= month_start,
                Attendance.date <= today,
            )
        )
    ).scalars().all()
    present_days = sum(1 for s in statuses if s == AttendanceStatus.present)
    absent_days = sum(1 for s in statuses if s == AttendanceStatus.absent)

    approved = (
        await db.execute(
            select(Leave).where(
                Leave.employee_id == emp.id,
                Leave.status == LeaveStatus.approved,
                Leave.start_date >= year_start,
            )
        )
    ).scalars().all()
    taken = sum(_leave_days(lv) for lv in approved)
    leave_balance = max(0, ANNUAL_LEAVE_QUOTA - taken)

    team_size = (await db.execute(select(func.count(Employee.id)))).scalar_one()

    notifs = (
        await db.execute(
            select(Notification)
            .where(Notification.user_id == current_user.id)
            .order_by(Notification.created_at.desc(), Notification.id.desc())
            .limit(8)
        )
    ).scalars().all()

    return DashboardSummary(
        present_days=present_days,
        absent_days=absent_days,
        leave_balance=leave_balance,
        team_size=team_size,
        recent_activity=[
            RecentActivity(id=n.id, message=n.message, created_at=n.created_at) for n in notifs
        ],
    )


# ── GET /admin/overview ─────────────────────────────────────────────────────
@router.get("/admin/overview", response_model=AdminOverview)
async def admin_overview(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Org-wide snapshot: headcount, today's attendance, pending approvals."""
    today = date.today()

    total_employees = (await db.execute(select(func.count(Employee.id)))).scalar_one()
    present_today = (
        await db.execute(
            select(func.count(Attendance.id)).where(
                Attendance.date == today,
                Attendance.status == AttendanceStatus.present,
            )
        )
    ).scalar_one()
    on_leave_today = (
        await db.execute(
            select(func.count(func.distinct(Leave.employee_id))).where(
                Leave.status == LeaveStatus.approved,
                Leave.start_date <= today,
                Leave.end_date >= today,
            )
        )
    ).scalar_one()
    pending_leaves = (
        await db.execute(
            select(func.count(Leave.id)).where(Leave.status == LeaveStatus.pending)
        )
    ).scalar_one()

    attendance_rate = round(present_today / total_employees * 100, 1) if total_employees else 0.0

    rows = (
        await db.execute(
            select(Leave, Employee.full_name)
            .join(Employee, Employee.id == Leave.employee_id)
            .where(Leave.status == LeaveStatus.pending)
            .order_by(Leave.id.desc())
            .limit(10)
        )
    ).all()
    pending_leave_requests = [
        PendingLeaveRequest(
            id=lv.id,
            employee_name=name,
            leave_type=lv.leave_type.value,
            start_date=lv.start_date,
            end_date=lv.end_date,
            status=lv.status.value,
        )
        for lv, name in rows
    ]

    return AdminOverview(
        total_employees=total_employees,
        present_today=present_today,
        on_leave_today=on_leave_today,
        pending_leaves=pending_leaves,
        attendance_rate=attendance_rate,
        pending_leave_requests=pending_leave_requests,
    )


# ── GET /admin/employees/{id}/summary ───────────────────────────────────────
@router.get("/admin/employees/{employee_id}/summary", response_model=EmployeeSummary)
async def admin_employee_summary(
    employee_id: int,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Per-employee stats for the admin's employee-detail view."""
    emp = (
        await db.execute(select(Employee).where(Employee.id == employee_id))
    ).scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")
    owner = (await db.execute(select(User).where(User.id == emp.user_id))).scalar_one()

    today = date.today()
    month_start = today.replace(day=1)
    year_start = date(today.year, 1, 1)

    statuses = (
        await db.execute(
            select(Attendance.status).where(
                Attendance.employee_id == emp.id,
                Attendance.date >= month_start,
                Attendance.date <= today,
            )
        )
    ).scalars().all()
    present_days = sum(1 for s in statuses if s == AttendanceStatus.present)
    absent_days = sum(1 for s in statuses if s == AttendanceStatus.absent)

    approved = (
        await db.execute(
            select(Leave).where(
                Leave.employee_id == emp.id,
                Leave.status == LeaveStatus.approved,
                Leave.start_date >= year_start,
            )
        )
    ).scalars().all()
    leave_days = sum(_leave_days(lv) for lv in approved)

    pending_leaves = (
        await db.execute(
            select(func.count(Leave.id)).where(
                Leave.employee_id == emp.id,
                Leave.status == LeaveStatus.pending,
            )
        )
    ).scalar_one()

    return EmployeeSummary(
        employee_id=emp.id,
        full_name=emp.full_name,
        employee_code=owner.employee_code,
        email=owner.email,
        present_days=present_days,
        absent_days=absent_days,
        leave_days=leave_days,
        pending_leaves=pending_leaves,
        net_salary=_net_salary(emp.salary_structure),
    )


# ── GET /admin/reports?period=YYYY-MM ───────────────────────────────────────
@router.get("/admin/reports", response_model=AdminReport)
async def admin_reports(
    period: str | None = Query(default=None, description="Report month, YYYY-MM (defaults to current)"),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Workforce report powering the analytics/Recharts page."""
    start, end, label = _month_bounds(period)
    today = date.today()

    employees = (await db.execute(select(Employee))).scalars().all()
    total_employees = len(employees)
    total_payroll = sum(_net_salary(e.salary_structure) for e in employees)

    # Department breakdown (derived from job_details)
    dept_nets: dict[str, list[float]] = defaultdict(list)
    for e in employees:
        dept_nets[_department(e.job_details)].append(_net_salary(e.salary_structure))
    department_breakdown = [
        DeptBreakdown(
            department=dept,
            headcount=len(nets),
            avg_salary=round(sum(nets) / len(nets), 2) if nets else 0.0,
        )
        for dept, nets in sorted(dept_nets.items())
    ]

    # Attendance rows for the period, reduced in Python
    att = (
        await db.execute(
            select(Attendance.date, Attendance.status).where(
                Attendance.date >= start, Attendance.date <= end
            )
        )
    ).all()
    present_days = sum(1 for _, s in att if s == AttendanceStatus.present)
    absent_days = sum(1 for _, s in att if s == AttendanceStatus.absent)
    leave_days = sum(1 for _, s in att if s == AttendanceStatus.leave)

    # Daily trend up to today (or month end for past months)
    last = min(end, today)
    day_map: dict[date, list[int]] = {}
    d = start
    while d <= last:
        day_map[d] = [0, 0, 0]
        d += timedelta(days=1)
    for dt, s in att:
        bucket = day_map.get(dt)
        if bucket is None:
            continue
        if s == AttendanceStatus.present:
            bucket[0] += 1
        elif s == AttendanceStatus.absent:
            bucket[1] += 1
        elif s == AttendanceStatus.leave:
            bucket[2] += 1
    attendance_trend = [
        AttendanceTrendPoint(date=d.isoformat(), present=v[0], absent=v[1], leave=v[2])
        for d, v in sorted(day_map.items())
    ]

    return AdminReport(
        period=label,
        total_employees=total_employees,
        present_days=present_days,
        absent_days=absent_days,
        leave_days=leave_days,
        total_payroll=total_payroll,
        department_breakdown=department_breakdown,
        attendance_trend=attendance_trend,
    )
