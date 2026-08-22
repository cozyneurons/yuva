"""initial schema - users, employees, attendance, leaves, notifications

Revision ID: 001
Revises:
Create Date: 2026-08-22
"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enums
    user_role = sa.Enum("admin", "employee", name="user_role")
    attendance_status = sa.Enum("present", "absent", "half_day", "leave", name="attendance_status")
    leave_type = sa.Enum("paid", "sick", "unpaid", name="leave_type")
    leave_status = sa.Enum("pending", "approved", "rejected", name="leave_status")


    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee_code", sa.String(50), unique=True, nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=True),
        sa.Column("google_id", sa.String(255), unique=True, nullable=True),
        sa.Column("role", sa.Enum("admin", "employee", name="user_role"), nullable=False, server_default="employee"),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("password_hash IS NOT NULL OR google_id IS NOT NULL", name="ck_users_has_login_method"),
    )

    op.create_table(
        "employees",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("job_details", sa.Text(), nullable=True),
        sa.Column("salary_structure", sa.JSON(), nullable=True),
        sa.Column("documents", sa.JSON(), nullable=True),
        sa.Column("profile_picture_url", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "attendance",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("check_in", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("check_out", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("status", sa.Enum("present", "absent", "half_day", "leave", name="attendance_status"), nullable=False, server_default="present"),
        sa.UniqueConstraint("employee_id", "date", name="uq_attendance_emp_date"),
    )
    op.create_index("idx_attendance_emp_date", "attendance", ["employee_id", "date"])

    op.create_table(
        "leaves",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("leave_type", sa.Enum("paid", "sick", "unpaid", name="leave_type"), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("status", sa.Enum("pending", "approved", "rejected", name="leave_status"), nullable=False, server_default="pending"),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("admin_comments", sa.Text(), nullable=True),
        sa.CheckConstraint("end_date >= start_date", name="ck_leave_dates"),
    )
    op.create_index("idx_leaves_emp_date", "leaves", ["employee_id", "start_date"])

    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_index("idx_leaves_emp_date", table_name="leaves")
    op.drop_table("leaves")
    op.drop_index("idx_attendance_emp_date", table_name="attendance")
    op.drop_table("attendance")
    op.drop_table("employees")
    op.drop_table("users")

    op.execute("DROP TYPE IF EXISTS leave_status")
    op.execute("DROP TYPE IF EXISTS leave_type")
    op.execute("DROP TYPE IF EXISTS attendance_status")
    op.execute("DROP TYPE IF EXISTS user_role")
