from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_admin
from app.models.employee import Employee
from app.models.leave import Leave, LeaveStatus
from app.models.notification import Notification
from app.models.user import User, UserRole
from app.schemas.leave import LeaveApplyRequest, LeaveRead, LeaveStatusUpdate
from app.ws.manager import manager

router = APIRouter(prefix="/leave", tags=["leave"])


async def _get_employee(user: User, db: AsyncSession) -> Employee:
    result = await db.execute(select(Employee).where(Employee.user_id == user.id))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee profile not found")
    return emp


@router.post("", response_model=LeaveRead, status_code=status.HTTP_201_CREATED)
async def apply_leave(
    payload: LeaveApplyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Employee applies for leave. Creates notification for all admin users."""
    emp = await _get_employee(current_user, db)

    leave = Leave(
        employee_id=emp.id,
        leave_type=payload.leave_type,
        start_date=payload.start_date,
        end_date=payload.end_date,
        remarks=payload.remarks,
        status=LeaveStatus.pending,
    )
    db.add(leave)
    await db.flush()

    # Notify all admins
    admins = await db.execute(select(User).where(User.role == UserRole.admin))
    msg = f"New {payload.leave_type.value} leave request from {emp.full_name} ({payload.start_date} – {payload.end_date})"
    for admin in admins.scalars():
        db.add(Notification(user_id=admin.id, message=msg))
        await manager.send_personal(admin.id, {"type": "leave_request", "message": msg})

    await db.commit()
    await db.refresh(leave)
    return leave


@router.get("", response_model=list[LeaveRead])
async def list_leaves(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Employees see their own leaves; admins see all."""
    if current_user.role == UserRole.admin:
        result = await db.execute(select(Leave).order_by(Leave.id.desc()))
    else:
        emp = await _get_employee(current_user, db)
        result = await db.execute(
            select(Leave).where(Leave.employee_id == emp.id).order_by(Leave.id.desc())
        )
    return result.scalars().all()


@router.patch("/{leave_id}/status", response_model=LeaveRead)
async def update_leave_status(
    leave_id: int,
    payload: LeaveStatusUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin approves or rejects a leave request. Notifies the employee via DB + WebSocket."""
    result = await db.execute(select(Leave).where(Leave.id == leave_id))
    leave = result.scalar_one_or_none()
    if not leave:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Leave request not found")

    if leave.status != LeaveStatus.pending:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Leave request has already been processed"
        )

    leave.status = payload.status
    leave.admin_comments = payload.admin_comments

    # Notify the employee
    emp_result = await db.execute(select(Employee).where(Employee.id == leave.employee_id))
    emp = emp_result.scalar_one_or_none()
    if emp:
        action = "approved" if payload.status == LeaveStatus.approved else "rejected"
        msg = f"Your leave request ({leave.start_date} – {leave.end_date}) was {action}."
        if payload.admin_comments:
            msg += f" Note: {payload.admin_comments}"
        db.add(Notification(user_id=emp.user_id, message=msg))
        await manager.send_personal(emp.user_id, {"type": "leave_update", "status": action, "message": msg})

    await db.commit()
    await db.refresh(leave)
    return leave
