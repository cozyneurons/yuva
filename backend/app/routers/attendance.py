from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_admin
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.models.user import User, UserRole
from app.schemas.attendance import AttendanceRead, CheckInResponse, CheckOutResponse

router = APIRouter(prefix="/attendance", tags=["attendance"])


async def _get_employee(user: User, db: AsyncSession) -> Employee:
    result = await db.execute(select(Employee).where(Employee.user_id == user.id))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
    return emp


@router.post("/check-in", response_model=CheckInResponse)
async def check_in(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record today's check-in. Blocked if already checked in today."""
    emp = await _get_employee(current_user, db)
    today = date.today()

    existing = await db.execute(
        select(Attendance).where(
            Attendance.employee_id == emp.id,
            Attendance.date == today,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Already checked in today",
        )

    now = datetime.now(timezone.utc)
    record = Attendance(
        employee_id=emp.id,
        date=today,
        check_in=now,
        status=AttendanceStatus.present,
    )
    db.add(record)
    await db.commit()

    return CheckInResponse(message="Checked in successfully", check_in=now)


@router.post("/check-out", response_model=CheckOutResponse)
async def check_out(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Record today's check-out. Must check in first."""
    emp = await _get_employee(current_user, db)
    today = date.today()

    result = await db.execute(
        select(Attendance).where(
            Attendance.employee_id == emp.id,
            Attendance.date == today,
        )
    )
    record = result.scalar_one_or_none()

    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No check-in found for today")
    if record.check_out:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already checked out today")

    now = datetime.now(timezone.utc)
    record.check_out = now
    await db.commit()

    return CheckOutResponse(message="Checked out successfully", check_out=now)


@router.get("", response_model=list[AttendanceRead])
async def get_attendance(
    range: str = Query(default="week", pattern="^(week|day)$"),
    employee_id: int | None = Query(default=None, description="Admin only: filter by employee"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get attendance records. Employees see own; admins can pass employee_id to see any."""
    today = date.today()
    start = today - timedelta(days=6) if range == "week" else today

    query = select(Attendance).where(Attendance.date >= start, Attendance.date <= today)

    if current_user.role == UserRole.admin and employee_id:
        query = query.where(Attendance.employee_id == employee_id)
    else:
        emp = await _get_employee(current_user, db)
        query = query.where(Attendance.employee_id == emp.id)

    result = await db.execute(query.order_by(Attendance.date.desc()))
    return result.scalars().all()
