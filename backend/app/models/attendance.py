from sqlalchemy import Column, Integer, ForeignKey, Date, Enum as SAEnum, UniqueConstraint
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.orm import relationship
import enum

from app.db.base import Base


class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    half_day = "half_day"
    leave = "leave"


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint("employee_id", "date", name="uq_attendance_emp_date"),
    )

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    check_in = Column(TIMESTAMP(timezone=True), nullable=True)
    check_out = Column(TIMESTAMP(timezone=True), nullable=True)
    status = Column(
        SAEnum(AttendanceStatus, name="attendance_status"),
        nullable=False,
        default=AttendanceStatus.present,
    )

    employee = relationship("Employee", back_populates="attendances")
