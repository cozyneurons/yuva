from datetime import date

from pydantic import BaseModel, model_validator

from app.models.leave import LeaveStatus, LeaveType


class LeaveApplyRequest(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    remarks: str | None = None

    @model_validator(mode="after")
    def check_dates(self) -> "LeaveApplyRequest":
        if self.end_date < self.start_date:
            raise ValueError("end_date must be >= start_date")
        return self


class LeaveRead(BaseModel):
    model_config = {"from_attributes": True}

    id: int
    employee_id: int
    leave_type: LeaveType
    start_date: date
    end_date: date
    status: LeaveStatus
    remarks: str | None
    admin_comments: str | None


class LeaveStatusUpdate(BaseModel):
    status: LeaveStatus
    admin_comments: str | None = None
