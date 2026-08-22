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
    user_role = postgresql.ENUM("admin", "employee", name="user_role", create_type=True)
    attendance_status = postgresql.ENUM("present", "absent", "half_day", "leave", name="attendance_status", create_type=True)
    leave_type = postgresql.ENUM("paid", "sick", "unpaid", name="leave_type", create_type=True)
    leave_status = postgresql.ENUM("pending", "approved", "rejected", name="leave_status", create_type=True)

    user_role.create(op.get_bind(), checkfirst=True)
    attendance_status.create(op.get_bind(), checkfirst=True)
    leave_type.create(op.get_bind(), checkfirst=True)
    leave_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee_code", sa.String(50), unique=True, nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=True),
        sa.Column("google_id", sa.String(255), unique=True, nullable=True),
        sa.Column("role", postgresql.ENUM("admin", "employee", name="user_role", create_type=False), nullable=False, server_default="employee"),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
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
        sa.Column("salary_structure", postgresql.JSONB(), nullable=True),
        sa.Column("documents", postgresql.JSONB(), nullable=True),
        sa.Column("profile_picture_url", sa.Text(), nullable=True),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
    )

    op.create_table(
        "attendance",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("check_in", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("check_out", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("status", postgresql.ENUM("present", "absent", "half_day", "leave", name="attendance_status", create_type=False), nullable=False, server_default="present"),
        sa.UniqueConstraint("employee_id", "date", name="uq_attendance_emp_date"),
    )
    op.create_index("idx_attendance_emp_date", "attendance", ["employee_id", "date"])

    op.create_table(
        "leaves",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("employee_id", sa.Integer(), sa.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False),
        sa.Column("leave_type", postgresql.ENUM("paid", "sick", "unpaid", name="leave_type", create_type=False), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("status", postgresql.ENUM("pending", "approved", "rejected", name="leave_status", create_type=False), nullable=False, server_default="pending"),
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
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.text("now()"), nullable=False),
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
