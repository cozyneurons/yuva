"""Schemas for payroll endpoints (Nihaal — Backend Support).

`SalaryStructure` matches the frontend contract in lib/types.ts exactly:
    { basic, hra, allowances, deductions, net_salary }

There is no `payroll` table in the schema (see master-plan merge notes), so payroll
is derived from `employees.salary_structure` (JSONB). `net_salary` is always the
server-computed identity `basic + hra + allowances - deductions`.
"""
from datetime import datetime

from pydantic import BaseModel


class SalaryStructure(BaseModel):
    basic: float = 0
    hra: float = 0
    allowances: float = 0
    deductions: float = 0
    net_salary: float = 0


class PayrollRead(BaseModel):
    """A single month's payroll for an employee (matches lib/types.ts PayrollRecord)."""

    id: int                      # == employee_id (no payroll table; kept for FE compatibility)
    employee_id: int
    employee_code: str
    full_name: str
    month: str                   # "YYYY-MM"
    salary_structure: SalaryStructure
    paid_at: datetime | None = None


class SalaryStructureUpdate(BaseModel):
    """Admin PATCH /payroll/{id}: partial salary edit. net_salary is recomputed."""

    basic: float | None = None
    hra: float | None = None
    allowances: float | None = None
    deductions: float | None = None
