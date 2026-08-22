"""Payroll endpoints (Nihaal — Backend Support).

    GET   /api/v1/payroll/{employee_id}          — that employee's payroll (self or admin)
    PATCH /api/v1/payroll/{employee_id}          — admin edits the salary structure
    GET   /api/v1/payroll/{employee_id}/slip     — download the month's salary slip (PDF)

There is no dedicated `payroll` table in the schema; payroll is derived from
`employees.salary_structure` (JSONB) for the current month. `net_salary` is never
trusted from the client — it is always recomputed server-side as
`basic + hra + allowances - deductions`.

RBAC: an employee may only read / download their own payroll; an admin may access
anyone's. Editing the salary structure is admin-only.
"""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user, get_db
from app.models.employee import Employee
from app.models.user import User
from app.schemas.payroll import PayrollRead, SalaryStructure, SalaryStructureUpdate
from app.services.payslip import build_payslip_pdf

router = APIRouter(prefix="/payroll", tags=["payroll"])


# ── helpers ───────────────────────────────────────────────────────────────────
def _num(value) -> float:
    try:
        return round(float(value or 0), 2)
    except (TypeError, ValueError):
        return 0.0


def _normalize_salary(raw) -> dict:
    """Coerce a stored salary_structure JSONB into the canonical 5-key dict.

    `net_salary` is always recomputed so the stored value can never drift from
    its components.
    """
    raw = raw if isinstance(raw, dict) else {}
    basic = _num(raw.get("basic"))
    hra = _num(raw.get("hra"))
    allowances = _num(raw.get("allowances"))
    deductions = _num(raw.get("deductions"))
    return {
        "basic": basic,
        "hra": hra,
        "allowances": allowances,
        "deductions": deductions,
        "net_salary": round(basic + hra + allowances - deductions, 2),
    }


async def _load_employee_and_owner(
    employee_id: int, current_user: User, db: AsyncSession, *, admin_only: bool
) -> tuple[Employee, User]:
    """Load an employee + owning user, enforcing RBAC.

    admin_only=True  → only admins may proceed (used for edits).
    admin_only=False → admins, or the employee themselves, may proceed.
    """
    is_admin = current_user.role.value == "admin"
    if admin_only and not is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

    emp = (
        await db.execute(select(Employee).where(Employee.id == employee_id))
    ).scalar_one_or_none()
    if not emp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found")

    if not is_admin and emp.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own payroll",
        )

    owner = (await db.execute(select(User).where(User.id == emp.user_id))).scalar_one()
    return emp, owner


def _to_payroll(emp: Employee, owner: User, month: str) -> PayrollRead:
    salary = _normalize_salary(emp.salary_structure)
    return PayrollRead(
        id=emp.id,
        employee_id=emp.id,
        employee_code=owner.employee_code,
        full_name=emp.full_name,
        month=month,
        salary_structure=SalaryStructure(**salary),
        paid_at=None,
    )


# ── GET /payroll/{employee_id} ──────────────────────────────────────────────
@router.get("/{employee_id}", response_model=list[PayrollRead])
async def get_payroll(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return the employee's payroll records (the current month's, derived from
    their salary structure). Returns a list so the frontend payroll table can
    render it directly and grow to multiple periods later."""
    emp, owner = await _load_employee_and_owner(
        employee_id, current_user, db, admin_only=False
    )
    month = date.today().strftime("%Y-%m")
    return [_to_payroll(emp, owner, month)]


# ── PATCH /payroll/{employee_id} ────────────────────────────────────────────
@router.patch("/{employee_id}", response_model=PayrollRead)
async def update_payroll(
    employee_id: int,
    payload: SalaryStructureUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Admin-only: edit an employee's salary structure. `net_salary` is recomputed
    from the components and persisted; any client-supplied net is ignored."""
    emp, owner = await _load_employee_and_owner(
        employee_id, current_user, db, admin_only=True
    )

    salary = _normalize_salary(emp.salary_structure)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        salary[field] = _num(value)
    salary = _normalize_salary(salary)  # re-derive net_salary from new components

    # Reassign (not in-place mutate) so SQLAlchemy flags the JSONB column dirty.
    emp.salary_structure = salary
    await db.commit()
    await db.refresh(emp)

    month = date.today().strftime("%Y-%m")
    return _to_payroll(emp, owner, month)


# ── GET /payroll/{employee_id}/slip ─────────────────────────────────────────
@router.get("/{employee_id}/slip")
async def download_payslip(
    employee_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Generate and stream a PDF salary slip for the current month (self or admin)."""
    emp, owner = await _load_employee_and_owner(
        employee_id, current_user, db, admin_only=False
    )
    month = date.today().strftime("%Y-%m")
    salary = _normalize_salary(emp.salary_structure)

    pdf_bytes = build_payslip_pdf(
        employee_code=owner.employee_code,
        full_name=emp.full_name,
        period=month,
        basic=salary["basic"],
        hra=salary["hra"],
        allowances=salary["allowances"],
        deductions=salary["deductions"],
        net_salary=salary["net_salary"],
        job_details=emp.job_details,
    )

    filename = f"payslip_{owner.employee_code}_{month}.pdf"
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
