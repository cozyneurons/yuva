"""Profile endpoints (Nihaal — Backend Support).

    GET   /api/v1/employees/me        — current user's profile (+ account fields)
    PATCH /api/v1/employees/me        — self-edit (address, phone, name, photo)
    PATCH /api/v1/employees/{id}      — admin edits any employee (all fields)

Depends on Shubham's auth/RBAC (`get_current_user`, `require_admin`).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db, require_admin
from app.models.employee import Employee
from app.models.user import User
from app.schemas.employee import EmployeeAdminUpdate
from app.schemas.profile import ProfileRead, ProfileUpdate

router = APIRouter(prefix="/employees", tags=["profile"])


async def _get_own_employee(user: User, db: AsyncSession) -> Employee:
    result = await db.execute(select(Employee).where(Employee.user_id == user.id))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee profile not found",
        )
    return emp


def _to_profile(emp: Employee, user: User) -> ProfileRead:
    """Merge the Employee row with account fields from its User."""
    return ProfileRead(
        id=emp.id,
        user_id=user.id,
        employee_code=user.employee_code,
        email=user.email,
        role=user.role,
        is_verified=user.is_verified,
        full_name=emp.full_name,
        address=emp.address,
        phone=emp.phone,
        job_details=emp.job_details,
        salary_structure=emp.salary_structure,
        documents=emp.documents,
        profile_picture_url=emp.profile_picture_url,
        updated_at=emp.updated_at,
    )


@router.get("/me", response_model=ProfileRead)
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the authenticated user's employee profile plus account fields."""
    emp = await _get_own_employee(current_user, db)
    return _to_profile(emp, current_user)


@router.patch("/me", response_model=ProfileRead)
async def update_my_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Self-edit: employees update their own contact details / display name / photo."""
    emp = await _get_own_employee(current_user, db)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(emp, field, value)

    await db.commit()
    await db.refresh(emp)
    return _to_profile(emp, current_user)


@router.patch("/{employee_id}", response_model=ProfileRead)
async def admin_update_employee(
    employee_id: int,
    payload: EmployeeAdminUpdate,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin edits any employee — all fields, including job details & salary structure."""
    result = await db.execute(select(Employee).where(Employee.id == employee_id))
    emp = result.scalar_one_or_none()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found",
        )

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(emp, field, value)

    await db.commit()
    await db.refresh(emp)

    # Load the owning user so the response carries account fields too.
    user_result = await db.execute(select(User).where(User.id == emp.user_id))
    owner = user_result.scalar_one()
    return _to_profile(emp, owner)
