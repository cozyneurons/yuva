from sqlalchemy import Column, Integer, String, Text, ForeignKey, TIMESTAMP, text, func
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship

from app.db.base import Base


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    full_name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    job_details = Column(Text, nullable=True)
    salary_structure = Column(JSON, nullable=True)
    documents = Column(JSON, nullable=True)
    profile_picture_url = Column(Text, nullable=True)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="employee")
    attendances = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    leaves = relationship("Leave", back_populates="employee", cascade="all, delete-orphan")
