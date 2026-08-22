"""Schemas for the profile endpoints (Nihaal — Backend Support).

`ProfileRead` is the shape returned by GET /employees/me — the Employee row
enriched with the account-level fields (email, role, employee_code) that live
on the User model, so the frontend profile page has everything in one call.

The self-edit update body is defined here rather than editing the shared
`schemas/employee.py` contract. It mirrors `EmployeeUpdate` and additionally
allows `full_name` (the profile page + complete-profile step both edit it).
"""
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models.user import UserRole


class ProfileRead(BaseModel):
    """Employee profile + account fields, returned by GET /employees/me."""

    id: int
    user_id: int
    employee_code: str
    email: str
    role: UserRole
    is_verified: bool
    full_name: str
    address: str | None = None
    phone: str | None = None
    job_details: str | None = None
    salary_structure: Any | None = None
    documents: dict[str, str] | None = None
    profile_picture_url: str | None = None
    updated_at: datetime


class ProfileUpdate(BaseModel):
    """Fields an employee may edit on their own profile.

    Mirrors the shared `EmployeeUpdate` contract (address / phone /
    profile_picture_url) and adds `full_name`. `employee_code`, `salary_structure`,
    `documents` and `job_details` are intentionally NOT self-editable — those are
    admin-managed via PATCH /employees/{id}.
    """

    full_name: str | None = None
    address: str | None = None
    phone: str | None = None
    profile_picture_url: str | None = None
