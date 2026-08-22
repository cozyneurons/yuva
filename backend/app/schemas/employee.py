from datetime import datetime
from typing import Any

from pydantic import BaseModel


class EmployeeRead(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    user_id: int
    full_name: str
    address: str | None
    phone: str | None
    job_details: str | None
    salary_structure: Any | None
    documents: Any | None
    profile_picture_url: str | None
    updated_at: datetime


class EmployeeUpdate(BaseModel):
    """Fields employees can self-edit. Admin can patch all via a different endpoint."""
    address: str | None = None
    phone: str | None = None
    profile_picture_url: str | None = None


class EmployeeAdminUpdate(EmployeeUpdate):
    """All fields — admin only."""
    full_name: str | None = None
    job_details: str | None = None
    salary_structure: dict | None = None
    documents: dict | None = None
