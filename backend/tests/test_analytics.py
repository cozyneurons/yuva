"""Tests for the dashboard & analytics endpoints (Nihaal — Backend Support)."""
from datetime import date, timedelta
from types import SimpleNamespace

import pytest

from app.models.attendance import AttendanceStatus
from app.models.leave import LeaveStatus, LeaveType
from tests.factories import (
    add_attendance,
    add_leave,
    add_notification,
    auth,
    create_admin,
    create_user,
)

EMP_SALARY = {"basic": 50000, "hra": 20000, "allowances": 10000,
              "deductions": 8000, "net_salary": 72000}


def _recent_days(today: date) -> list[date]:
    """Up to 4 most-recent dates that fall within the current month (today first)."""
    month_start = today.replace(day=1)
    days, d = [], today
    while len(days) < 4 and d >= month_start:
        days.append(d)
        d -= timedelta(days=1)
    return days


async def _seed(session_factory) -> SimpleNamespace:
    today = date.today()
    admin = await create_admin(session_factory)  # no salary/job_details → dept "General", net 0
    emp = await create_user(
        session_factory,
        employee_code="EMP001",
        email="emp1@dayflow.com",
        full_name="Emp One",
        salary_structure=dict(EMP_SALARY),
        job_details="Backend Engineer — Engineering",
    )

    days = _recent_days(today)
    for i, d in enumerate(days):
        status = AttendanceStatus.present if i < 3 else AttendanceStatus.absent
        await add_attendance(session_factory, emp.employee_id, d, status)

    # Approved leave in the recent past (2 days, this year) → leave balance/leave_days.
    await add_leave(
        session_factory, emp.employee_id, LeaveType.paid,
        today - timedelta(days=6), today - timedelta(days=5), LeaveStatus.approved,
    )
    # Pending leave in the future → admin approval queue.
    await add_leave(
        session_factory, emp.employee_id, LeaveType.sick,
        today + timedelta(days=5), today + timedelta(days=6), LeaveStatus.pending,
    )
    await add_notification(session_factory, emp.user_id, "Welcome to Dayflow")
    await add_notification(session_factory, emp.user_id, "Your profile is ready")

    return SimpleNamespace(
        admin=admin,
        emp=emp,
        today=today,
        present_expected=min(3, len(days)),
        absent_expected=1 if len(days) >= 4 else 0,
    )


@pytest.mark.asyncio
async def test_dashboard_summary(client, session_factory):
    s = await _seed(session_factory)

    resp = await client.get("/api/v1/dashboard/summary", headers=auth(s.emp.token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["present_days"] == s.present_expected
    assert body["absent_days"] == s.absent_expected
    assert body["leave_balance"] == 24 - 2  # annual quota minus 2 approved days
    assert body["team_size"] == 2           # admin + employee both have Employee rows
    assert len(body["recent_activity"]) == 2


@pytest.mark.asyncio
async def test_dashboard_summary_requires_auth(client):
    resp = await client.get("/api/v1/dashboard/summary")
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_overview(client, session_factory):
    s = await _seed(session_factory)

    resp = await client.get("/api/v1/admin/overview", headers=auth(s.admin.token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_employees"] == 2
    assert body["present_today"] == 1              # employee marked present today
    assert body["on_leave_today"] == 0             # approved leave was in the past
    assert body["pending_leaves"] == 1
    assert body["attendance_rate"] == 50.0         # 1 present / 2 employees
    assert len(body["pending_leave_requests"]) == 1
    req = body["pending_leave_requests"][0]
    assert req["employee_name"] == "Emp One"
    assert req["status"] == "pending"


@pytest.mark.asyncio
async def test_admin_overview_forbidden_for_employee(client, session_factory):
    s = await _seed(session_factory)
    resp = await client.get("/api/v1/admin/overview", headers=auth(s.emp.token))
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_employee_summary(client, session_factory):
    s = await _seed(session_factory)

    resp = await client.get(
        f"/api/v1/admin/employees/{s.emp.employee_id}/summary", headers=auth(s.admin.token)
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["employee_id"] == s.emp.employee_id
    assert body["employee_code"] == "EMP001"
    assert body["present_days"] == s.present_expected
    assert body["absent_days"] == s.absent_expected
    assert body["leave_days"] == 2
    assert body["pending_leaves"] == 1
    assert body["net_salary"] == 72000


@pytest.mark.asyncio
async def test_admin_reports(client, session_factory):
    s = await _seed(session_factory)
    period = f"{s.today:%Y-%m}"

    resp = await client.get(
        f"/api/v1/admin/reports?period={period}", headers=auth(s.admin.token)
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["period"] == period
    assert body["total_employees"] == 2
    assert body["present_days"] == s.present_expected
    assert body["absent_days"] == s.absent_expected
    assert body["leave_days"] == 0                 # no attendance rows with 'leave' status
    assert body["total_payroll"] == 72000

    depts = {d["department"]: d for d in body["department_breakdown"]}
    assert depts["Engineering"]["headcount"] == 1
    assert depts["Engineering"]["avg_salary"] == 72000
    assert "General" in depts                       # admin (no job_details)

    expected_points = (s.today - s.today.replace(day=1)).days + 1
    assert len(body["attendance_trend"]) == expected_points


@pytest.mark.asyncio
async def test_admin_reports_bad_period_returns_422(client, session_factory):
    s = await _seed(session_factory)
    resp = await client.get(
        "/api/v1/admin/reports?period=not-a-month", headers=auth(s.admin.token)
    )
    assert resp.status_code == 422
