# Dayflow - Human Resource Management System

> *Every workday, perfectly aligned.*

---

## About Dayflow

**Dayflow** is a streamlined Human Resource Management System (HRMS) designed to digitize and simplify core HR operations. The platform provides a centralized portal for managing employee profiles, tracking attendance, handling leave requests, and reviewing payroll information with role-based access control.

---

## Tech Stack

### Frontend (User Interface)
The frontend is a modern web application built for speed and responsiveness.
- **Framework:** [Next.js 14+](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management & Data Fetching:** React Query (TanStack Query)
- **Forms & Validation:** React Hook Form + Zod

### Backend (API & Business Logic)
The backend provides a robust, fast, and secure API to power the application.
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+)
- **Database ORM:** SQLAlchemy 2.0 (Async) + Alembic for migrations
- **Database:** PostgreSQL 15+
- **Authentication:** JWT (JSON Web Tokens) with role-based access control (RBAC)
- **Real-time Capabilities:** FastAPI WebSockets for instant notifications
- **Validation:** Pydantic v2

---

## Project Structure

The repository is organized into two main workspaces:
- `backend/`: FastAPI application containing all API routes, database models, Alembic migrations, and business logic.
- `frontend/`: Next.js application containing all UI components, pages (organized via App Router route groups), and React Query hooks.

---

## Getting Started

### 1. Setting up the Backend
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Set up a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   Copy `.env.example` to `.env` and fill in your PostgreSQL database credentials and JWT secret keys.
4. Run database migrations:
   ```bash
   alembic upgrade head
   ```
5. Start the backend server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The API will be available at `http://localhost:8000`.

### 2. Setting up the Frontend
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The web app will be available at `http://localhost:3001`.

---

## Key Features

- **Authentication & Security**: Secure sign up and sign in with role-based access control.
- **Employee Profile Management**: Centralized records for personal details, job information, salary structure, and documents.
- **Attendance Tracking**: Daily and weekly views with employee check-in/check-out functionality and status monitoring (Present, Absent, Half-day, Leave).
- **Leave & Time-Off Management**: Simple leave application process with real-time approval/rejection workflows for HR and Admins.
- **Payroll & Salary Visibility**: Read-only payroll access for employees, with full salary structure management and controls for HR/Admin.
- **Real-time Notifications**: WebSockets push instant updates to users when leave statuses change.

---

## User Roles

| Role | Description |
| :--- | :--- |
| **Admin / HR Officer** | Manages employees, approves attendance and leave requests, and configures payroll structures. |
| **Employee** | Views personal profiles, tracks attendance, applies for time-off, and views salary details. |

---

## Future Enhancements

- Email and notification alerts integration (e.g. Mailpit)
- Background jobs for automated end-of-day absentee marking (APScheduler)
- Advanced analytics and reporting dashboards with PDF generation (e.g., salary slips)

