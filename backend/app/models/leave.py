from sqlalchemy import Column, Integer, ForeignKey, Date, Text, Enum as SAEnum, CheckConstraint
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class LeaveType(str, enum.Enum):
    paid = "paid"
    sick = "sick"
    unpaid = "unpaid"


class LeaveStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Leave(Base):
    __tablename__ = "leaves"
    __table_args__ = (
        CheckConstraint("end_date >= start_date", name="ck_leave_dates"),
    )

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    leave_type = Column(SAEnum(LeaveType, name="leave_type"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(SAEnum(LeaveStatus, name="leave_status"), nullable=False, default=LeaveStatus.pending)
    remarks = Column(Text, nullable=True)
    admin_comments = Column(Text, nullable=True)

    employee = relationship("Employee", back_populates="leaves")
