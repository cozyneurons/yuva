"""Database seeding script (Nihaal — Backend Support).

Populates the database with realistic demo data using Faker so the whole team
has something to develop and demo against:

    * 1 admin  + N employees (default 12) across several departments
    * ~3 months of historical attendance (present / absent / half-day / leave)
    * leave requests in every state (pending / approved / rejected)
    * a handful of notifications per user

Run it from the ``backend/`` directory::

    python -m scripts.seed                 # seed an empty database
    python -m scripts.seed --employees 20  # choose how many employees
    python -m scripts.seed --reset         # wipe existing data first, then seed
    python -m scripts.seed --create-tables # create tables first (handy for SQLite demos)

By default the script refuses to run against a non-empty database so it can't
silently duplicate data; pass ``--reset`` to wipe and re-seed.

Determinism: Faker and ``random`` are seeded with a fixed value, so repeated
runs produce the same data set.
"""
from __future__ import annotations

import argparse
import asyncio
import random
from datetime import date, datetime, time, timedelta, timezone

from faker import Faker
from sqlalchemy import delete, func, select

from app.core.security import hash_password
from app.db.base import Base
from app.db.session import AsyncSessionLocal, engine

# Import every model so Base.metadata is fully populated (needed for create_all
# and so relationships resolve).
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.models.leave import Leave, LeaveStatus, LeaveType
from app.models.notification import Notification
from app.models.user import User, UserRole

SEED = 42
DEV_PASSWORD = "Password123"      # shared password for every seeded employee
ADMIN_PASSWORD = "Admin123!"      # admin login
HISTORY_DAYS = 90                 # how far back to generate attendance

# Departments → sample job titles. job_details is stored as "<title> — <dept>"
# to match the analytics department parser (splits on the em dash).
DEPARTMENTS: dict[str, list[str]] = {
    "Engineering": ["Backend Engineer", "Frontend Engineer", "DevOps Engineer", "QA Engineer"],
    "Design": ["Product Designer", "UX Researcher"],
    "Product": ["Product Manager", "Associate PM"],
    "Sales": ["Account Executive", "Sales Development Rep"],
    "Marketing": ["Content Strategist", "Growth Marketer"],
    "Human Resources": ["HR Generalist", "Recruiter"],
    "Finance": ["Financial Analyst", "Accountant"],
}

fake = Faker("en_IN")


# ── pure helpers (no DB / Faker — unit-testable in isolation) ────────────────
def build_salary(rng: random.Random) -> dict:
    """Generate a realistic monthly salary structure (INR).

    ``net_salary`` is always the identity basic + hra + allowances - deductions,
    matching the frontend contract and the payroll endpoints.
    """
    basic = rng.randrange(30_000, 90_001, 5_000)
    hra = round(basic * 0.40, 2)
    allowances = rng.randrange(5_000, 20_001, 1_000)
    # EPF 12% of basic + fixed professional tax — a believable deduction.
    deductions = round(basic * 0.12 + 200, 2)
    gross = basic + hra + allowances
    return {
        "basic": float(basic),
        "hra": hra,
        "allowances": float(allowances),
        "deductions": deductions,
        "net_salary": round(gross - deductions, 2),
    }


def iter_weekdays(start: date, end: date):
    """Yield each weekday (Mon–Fri) date in [start, end]."""
    d = start
    while d <= end:
        if d.weekday() < 5:  # 0=Mon … 4=Fri
            yield d
        d += timedelta(days=1)


def choose_attendance_status(rng: random.Random) -> AttendanceStatus:
    """Weighted working-day status (leave is applied separately from Leave rows)."""
    roll = rng.random()
    if roll < 0.86:
        return AttendanceStatus.present
    if roll < 0.93:
        return AttendanceStatus.half_day
    return AttendanceStatus.absent


def work_window(day: date, rng: random.Random, half: bool = False) -> tuple[datetime, datetime]:
    """Return tz-aware (check_in, check_out) for a working day."""
    check_in = datetime.combine(
        day, time(9, rng.randint(0, 45)), tzinfo=timezone.utc
    )
    end_hour = 13 if half else rng.randint(17, 18)
    check_out = datetime.combine(
        day, time(end_hour, rng.randint(0, 59)), tzinfo=timezone.utc
    )
    return check_in, check_out


# ── data builders (need Faker) ───────────────────────────────────────────────
def _people(n: int) -> list[dict]:
    """Build n employee descriptors spread across departments."""
    flat = [(dept, title) for dept, titles in DEPARTMENTS.items() for title in titles]
    people = []
    for i in range(1, n + 1):
        dept, title = flat[(i - 1) % len(flat)]
        first, last = fake.first_name(), fake.last_name()
        people.append(
            {
                "employee_code": f"EMP{i:03d}",
                "email": f"{first.lower()}.{last.lower()}{i}@dayflow.com",
                "full_name": f"{first} {last}",
                "job_details": f"{title} — {dept}",
                "address": fake.address().replace("\n", ", "),
                "phone": fake.msisdn()[:10],
            }
        )
    return people


def _make_leaves(employee_id: int, rng: random.Random, today: date) -> list[Leave]:
    """A small, varied set of leave requests for one employee."""
    leaves: list[Leave] = []

    # 0–2 approved leaves in the recent past (these drive 'leave' attendance).
    for _ in range(rng.randint(0, 2)):
        start = today - timedelta(days=rng.randint(5, HISTORY_DAYS - 5))
        length = rng.randint(0, 3)
        leaves.append(
            Leave(
                employee_id=employee_id,
                leave_type=rng.choice([LeaveType.paid, LeaveType.sick]),
                start_date=start,
                end_date=start + timedelta(days=length),
                status=LeaveStatus.approved,
                remarks=fake.sentence(nb_words=6),
                admin_comments="Approved.",
            )
        )

    # 0–1 pending request in the future (populates the admin approval queue).
    if rng.random() < 0.6:
        start = today + timedelta(days=rng.randint(3, 20))
        leaves.append(
            Leave(
                employee_id=employee_id,
                leave_type=rng.choice(list(LeaveType)),
                start_date=start,
                end_date=start + timedelta(days=rng.randint(0, 4)),
                status=LeaveStatus.pending,
                remarks=fake.sentence(nb_words=6),
            )
        )

    # 0–1 rejected request in the past.
    if rng.random() < 0.3:
        start = today - timedelta(days=rng.randint(10, HISTORY_DAYS))
        leaves.append(
            Leave(
                employee_id=employee_id,
                leave_type=LeaveType.unpaid,
                start_date=start,
                end_date=start + timedelta(days=rng.randint(0, 2)),
                status=LeaveStatus.rejected,
                remarks=fake.sentence(nb_words=6),
                admin_comments="Insufficient balance.",
            )
        )

    return leaves


def _approved_leave_dates(leaves: list[Leave]) -> set[date]:
    """All calendar dates covered by an employee's approved leaves."""
    covered: set[date] = set()
    for lv in leaves:
        if lv.status is LeaveStatus.approved:
            d = lv.start_date
            while d <= lv.end_date:
                covered.add(d)
                d += timedelta(days=1)
    return covered


def _make_attendance(
    employee_id: int, on_leave: set[date], rng: random.Random, today: date
) -> list[Attendance]:
    """Historical attendance for one employee, coherent with their leaves."""
    start = today - timedelta(days=HISTORY_DAYS)
    rows: list[Attendance] = []
    # Always include today (even on a weekend) so live demo metrics are populated.
    days = sorted(set(iter_weekdays(start, today)) | {today})
    for day in days:
        if day in on_leave:
            rows.append(
                Attendance(employee_id=employee_id, date=day, status=AttendanceStatus.leave)
            )
            continue
        status = AttendanceStatus.present if day == today else choose_attendance_status(rng)
        if status in (AttendanceStatus.present, AttendanceStatus.half_day):
            ci, co = work_window(day, rng, half=status is AttendanceStatus.half_day)
            rows.append(
                Attendance(
                    employee_id=employee_id, date=day, status=status, check_in=ci, check_out=co
                )
            )
        else:  # absent
            rows.append(Attendance(employee_id=employee_id, date=day, status=status))
    return rows


def _make_notifications(user_id: int, rng: random.Random, now: datetime) -> list[Notification]:
    messages = [
        "Welcome to Dayflow HRMS!",
        "Your profile has been created.",
        "Your leave request was approved.",
        "Your salary slip for last month is now available.",
        "Reminder: complete your attendance for today.",
    ]
    picks = rng.sample(messages, k=rng.randint(2, 4))
    return [
        Notification(
            user_id=user_id,
            message=msg,
            is_read=rng.random() < 0.5,
            created_at=now - timedelta(days=rng.randint(0, 14), hours=rng.randint(0, 23)),
        )
        for msg in picks
    ]


# ── orchestration ─────────────────────────────────────────────────────────────
async def _wipe(session) -> None:
    """Delete all seeded data in FK-safe order."""
    for model in (Notification, Attendance, Leave, Employee, User):
        await session.execute(delete(model))
    await session.commit()


async def seed(n_employees: int, reset: bool, create_tables: bool, seed_data: bool = True) -> None:
    Faker.seed(SEED)
    rng = random.Random(SEED)
    today = date.today()
    now = datetime.now(timezone.utc)

    if create_tables:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("• tables ensured (create_all)")

    if not seed_data:
        print("• skipping demo data (--no-seed)")
        return

    async with AsyncSessionLocal() as session:
        existing = (await session.execute(select(func.count(User.id)))).scalar_one()
        if existing:
            if not reset:
                print(
                    f"Database already has {existing} user(s). "
                    "Re-run with --reset to wipe and re-seed. Aborting."
                )
                return
            await _wipe(session)
            print("• existing data wiped (--reset)")

        # Admin ----------------------------------------------------------------
        admin_user = User(
            employee_code="ADM001",
            email="admin@dayflow.com",
            password_hash=hash_password(ADMIN_PASSWORD),
            role=UserRole.admin,
            is_verified=True,
            created_at=now,
        )
        session.add(admin_user)
        await session.flush()
        session.add(
            Employee(
                user_id=admin_user.id,
                full_name="HR Admin",
                job_details="HR Administrator — Human Resources",
                address=fake.address().replace("\n", ", "),
                phone=fake.msisdn()[:10],
                salary_structure=build_salary(rng),
                updated_at=now,
            )
        )

        # Employees ------------------------------------------------------------
        people = _people(n_employees)
        for person in people:
            user = User(
                employee_code=person["employee_code"],
                email=person["email"],
                password_hash=hash_password(DEV_PASSWORD),
                role=UserRole.employee,
                is_verified=True,
                created_at=now,
            )
            session.add(user)
            await session.flush()  # need user.id

            emp = Employee(
                user_id=user.id,
                full_name=person["full_name"],
                job_details=person["job_details"],
                address=person["address"],
                phone=person["phone"],
                salary_structure=build_salary(rng),
                updated_at=now,
            )
            session.add(emp)
            await session.flush()  # need emp.id

            leaves = _make_leaves(emp.id, rng, today)
            session.add_all(leaves)
            session.add_all(_make_attendance(emp.id, _approved_leave_dates(leaves), rng, today))
            session.add_all(_make_notifications(user.id, rng, now))

        await session.commit()

        totals = {
            "users": (await session.execute(select(func.count(User.id)))).scalar_one(),
            "employees": (await session.execute(select(func.count(Employee.id)))).scalar_one(),
            "attendance": (await session.execute(select(func.count(Attendance.id)))).scalar_one(),
            "leaves": (await session.execute(select(func.count(Leave.id)))).scalar_one(),
            "notifications": (await session.execute(select(func.count(Notification.id)))).scalar_one(),
        }

    print("\n✅ Seed complete:")
    for k, v in totals.items():
        print(f"   {k:14} {v}")
    print("\nDemo credentials:")
    print(f"   admin     admin@dayflow.com / {ADMIN_PASSWORD}")
    print(f"   employee  {people[0]['email']} / {DEV_PASSWORD}  (and EMP002…)")


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Seed the Dayflow database with demo data.")
    p.add_argument("--employees", type=int, default=12, help="number of employees to create")
    p.add_argument("--reset", action="store_true", help="wipe existing data before seeding")
    p.add_argument("--create-tables", action="store_true", help="run create_all before seeding")
    p.add_argument(
        "--no-seed",
        dest="no_seed",
        action="store_true",
        help="only ensure tables (with --create-tables); insert no demo data",
    )
    return p.parse_args()


def main() -> None:
    args = _parse_args()
    if args.employees < 1:
        raise SystemExit("--employees must be >= 1")
    asyncio.run(seed(args.employees, args.reset, args.create_tables, seed_data=not args.no_seed))


if __name__ == "__main__":
    main()
