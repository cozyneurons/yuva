from datetime import date, datetime

from pydantic import BaseModel

from app.models.attendance import AttendanceStatus


class AttendanceRead(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    employee_id: int
    date: date
    check_in: datetime | None
    check_out: datetime | None
    status: AttendanceStatus


class CheckInResponse(BaseModel):
    message: str
    check_in: datetime


class CheckOutResponse(BaseModel):
    message: str
    check_out: datetime
