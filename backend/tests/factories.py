"""Test data factories (Nihaal backend suite).

Each helper opens a short-lived session, commits, and returns plain primitives
(ids, codes, JWT) so no session/connection is held while the HTTP client runs —
important because the test database uses a single shared StaticPool connection.
"""
from __future__ import annotations

from datetime import date, datetime, timezone
from types import SimpleNamespace

from app.core.security import create_access_token, hash_password
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.models.leave import Leave, LeaveStatus, LeaveType
from app.models.notification import Notification
from app.models.user import User, UserRole


def _now() -> datetime:
    # Set timestamps explicitly: the models declare server_default=text("now()"),
    # which SQLite (used in tests) cannot evaluate. Postgres is unaffected.
    return datetime.now(timezone.utc)


async def create_user(
    session_factory,
    *,
    employee_code: str,
    email: str,
    full_name: str,
    role: UserRole = UserRole.employee,
    salary_structure: dict | None = None,
    job_details: str | None = None,
    password: str = "Secret123",
) -> SimpleNamespace:
    """Create a User + linked Employee and return a handle with a ready JWT."""
    async with session_factory() as s:
        user = User(
            employee_code=employee_code,
            email=email,
            password_hash=hash_password(password),
            role=role,
            is_verified=True,
            created_at=_now(),
        )
        s.add(user)
        await s.flush()

        emp = Employee(
            user_id=user.id,
            full_name=full_name,
            salary_structure=salary_structure,
            job_details=job_details,
            updated_at=_now(),
        )
        s.add(emp)
        await s.commit()
        await s.refresh(user)
        await s.refresh(emp)

        return SimpleNamespace(
            user_id=user.id,
            employee_id=emp.id,
            employee_code=employee_code,
            email=email,
            full_name=full_name,
            role=role,
            token=create_access_token(user.id, role.value),
        )


async def create_admin(session_factory, **kwargs) -> SimpleNamespace:
    kwargs.setdefault("employee_code", "ADM001")
    kwargs.setdefault("email", "admin@dayflow.com")
    kwargs.setdefault("full_name", "HR Admin")
    return await create_user(session_factory, role=UserRole.admin, **kwargs)


async def add_attendance(
    session_factory,
    employee_id: int,
    day: date,
    status: AttendanceStatus,
    check_in: datetime | None = None,
    check_out: datetime | None = None,
) -> None:
    async with session_factory() as s:
        s.add(
            Attendance(
                employee_id=employee_id,
                date=day,
                status=status,
                check_in=check_in,
                check_out=check_out,
            )
        )
        await s.commit()


async def add_leave(
    session_factory,
    employee_id: int,
    leave_type: LeaveType,
    start: date,
    end: date,
    status: LeaveStatus,
) -> None:
    async with session_factory() as s:
        s.add(
            Leave(
                employee_id=employee_id,
                leave_type=leave_type,
                start_date=start,
                end_date=end,
                status=status,
            )
        )
        await s.commit()


async def add_notification(session_factory, user_id: int, message: str) -> None:
    async with session_factory() as s:
        s.add(Notification(user_id=user_id, message=message, created_at=_now()))
        await s.commit()


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
