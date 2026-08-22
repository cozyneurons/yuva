"""
Dayflow HRMS — Demo Seed Script
Run from backend dir: source venv/bin/activate && python seed.py
"""
import asyncio, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from datetime import date, datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.employee import Employee
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import Leave, LeaveStatus, LeaveType
from app.models.notification import Notification

def _now():
    return datetime.now(timezone.utc)

async def seed():
    if "--demo-seed" not in sys.argv:
        print("Error: explicitly provide --demo-seed flag to run.")
        sys.exit(1)
        
    if not settings.DATABASE_URL.startswith("sqlite"):
        print("Error: configured database is not a development database.")
        sys.exit(1)

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        existing = await db.execute(select(User).where(User.email == "admin@dayflow.com"))
        if existing.scalar_one_or_none():
            print("Already seeded. Skipping.")
            return

        print("Seeding...")

        # Admin
        admin = User(employee_code="ADM001", email="admin@dayflow.com",
            password_hash=hash_password("Admin@123"), role=UserRole.admin,
            is_verified=True, created_at=_now())
        db.add(admin); await db.flush()
        db.add(Employee(user_id=admin.id, full_name="Rahul Sharma",
            phone="+91 98765 43210", address="123 MG Road, Bengaluru",
            job_details="HR Manager — Human Resources",
            salary_structure={"basic":80000,"hra":32000,"allowances":15000,"deductions":12000,"net_salary":115000},
            updated_at=_now()))
        await db.flush()

        # Alice
        alice = User(employee_code="EMP001", email="alice@dayflow.com",
            password_hash=hash_password("Employee@123"), role=UserRole.employee,
            is_verified=True, created_at=_now())
        db.add(alice); await db.flush()
        alice_emp = Employee(user_id=alice.id, full_name="Alice Johnson",
            phone="+91 87654 32109", address="45 Koramangala, Bengaluru",
            job_details="Software Engineer — Engineering",
            salary_structure={"basic":60000,"hra":24000,"allowances":10000,"deductions":8000,"net_salary":86000},
            updated_at=_now())
        db.add(alice_emp); await db.flush()

        # Bob
        bob = User(employee_code="EMP002", email="bob@dayflow.com",
            password_hash=hash_password("Employee@123"), role=UserRole.employee,
            is_verified=True, created_at=_now())
        db.add(bob); await db.flush()
        bob_emp = Employee(user_id=bob.id, full_name="Bob Mehta",
            phone="+91 76543 21098", address="78 Indiranagar, Bengaluru",
            job_details="Product Designer — Design",
            salary_structure={"basic":55000,"hra":22000,"allowances":8000,"deductions":7000,"net_salary":78000},
            updated_at=_now())
        db.add(bob_emp); await db.flush()

        # Attendance — last 10 working days
        today = date.today()
        bob_leave_dates = []
        for emp, statuses in [
            (alice_emp, [AttendanceStatus.present]*4 + [AttendanceStatus.absent] + [AttendanceStatus.present]*3 + [AttendanceStatus.half_day, AttendanceStatus.present]),
            (bob_emp,   [AttendanceStatus.present]*2 + [AttendanceStatus.absent] + [AttendanceStatus.present]*2 + [AttendanceStatus.leave]*2 + [AttendanceStatus.present]*2 + [AttendanceStatus.present]),
        ]:
            day = today - timedelta(days=14)
            for status in statuses:
                while day.weekday() >= 5: day += timedelta(days=1)
                
                if emp.id == bob_emp.id and status == AttendanceStatus.leave:
                    bob_leave_dates.append(day)
                    
                ci = co = None
                if status in (AttendanceStatus.present, AttendanceStatus.half_day):
                    ci = datetime(day.year, day.month, day.day, 9, 0, tzinfo=timezone.utc)
                    co = datetime(day.year, day.month, day.day, 18 if status==AttendanceStatus.present else 13, 0, tzinfo=timezone.utc)
                db.add(Attendance(employee_id=emp.id, date=day, status=status, check_in=ci, check_out=co))
                day += timedelta(days=1)
        await db.flush()

        # Leaves
        db.add(Leave(employee_id=alice_emp.id, leave_type=LeaveType.sick,
            start_date=today-timedelta(days=8), end_date=today-timedelta(days=8),
            status=LeaveStatus.approved, remarks="Fever", admin_comments="Get well soon!"))
            
        bob_leave_start = bob_leave_dates[0] if bob_leave_dates else today-timedelta(days=7)
        bob_leave_end = bob_leave_dates[-1] if bob_leave_dates else today-timedelta(days=6)
        db.add(Leave(employee_id=bob_emp.id, leave_type=LeaveType.paid,
            start_date=bob_leave_start, end_date=bob_leave_end,
            status=LeaveStatus.approved, remarks="Family event", admin_comments="Approved"))
            
        db.add(Leave(employee_id=bob_emp.id, leave_type=LeaveType.unpaid,
            start_date=today+timedelta(days=5), end_date=today+timedelta(days=6),
            status=LeaveStatus.pending, remarks="Personal work"))
        await db.flush()

        # Notifications
        db.add(Notification(user_id=admin.id, message="New unpaid leave request from Bob Mehta", is_read=False, created_at=_now()))
        db.add(Notification(user_id=alice.id, message="Your sick leave has been approved.", is_read=True, created_at=_now()-timedelta(days=7)))
        db.add(Notification(user_id=bob.id, message="Your paid leave has been approved.", is_read=True, created_at=_now()-timedelta(days=6)))

        await db.commit()

    print("\n=== DEMO CREDENTIALS ===")
    print("\n👑 Admin")
    print("   Email:    admin@dayflow.com")
    print("   Password: Admin@123")
    print("   EmpCode:  ADM001")
    print("\n👤 Alice Johnson (Employee)")
    print("   Email:    alice@dayflow.com")
    print("   Password: Employee@123")
    print("   EmpCode:  EMP001")
    print("\n👤 Bob Mehta (Employee)")
    print("   Email:    bob@dayflow.com")
    print("   Password: Employee@123")
    print("   EmpCode:  EMP002\n")

asyncio.run(seed())
