"""Tests for the profile endpoints (Nihaal — Backend Support)."""
import pytest

from app.models.user import UserRole
from tests.factories import auth, create_admin, create_user

PREFIX = "/api/v1/employees"


@pytest.mark.asyncio
async def test_get_my_profile_merges_account_fields(client, session_factory):
    emp = await create_user(
        session_factory,
        employee_code="EMP001",
        email="emp1@dayflow.com",
        full_name="Emp One",
        job_details="Backend Engineer — Engineering",
        salary_structure={"basic": 50000, "hra": 20000, "allowances": 10000,
                          "deductions": 8000, "net_salary": 72000},
    )

    resp = await client.get(f"{PREFIX}/me", headers=auth(emp.token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["id"] == emp.employee_id
    assert body["employee_code"] == "EMP001"
    assert body["email"] == "emp1@dayflow.com"
    assert body["role"] == "employee"
    assert body["is_verified"] is True
    assert body["full_name"] == "Emp One"
    assert body["job_details"] == "Backend Engineer — Engineering"
    assert body["salary_structure"]["net_salary"] == 72000


@pytest.mark.asyncio
async def test_get_my_profile_requires_auth(client):
    resp = await client.get(f"{PREFIX}/me")
    assert resp.status_code == 401  # HTTPBearer rejects missing credentials


@pytest.mark.asyncio
async def test_update_my_profile(client, session_factory):
    emp = await create_user(
        session_factory, employee_code="EMP001", email="emp1@dayflow.com", full_name="Emp One"
    )

    resp = await client.patch(
        f"{PREFIX}/me",
        json={"full_name": "Emp Renamed", "address": "12 MG Road", "phone": "9876543210"},
        headers=auth(emp.token),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["full_name"] == "Emp Renamed"
    assert body["address"] == "12 MG Road"
    assert body["phone"] == "9876543210"


@pytest.mark.asyncio
async def test_employee_cannot_admin_patch_others(client, session_factory):
    emp = await create_user(
        session_factory, employee_code="EMP001", email="emp1@dayflow.com", full_name="Emp One"
    )
    other = await create_user(
        session_factory, employee_code="EMP002", email="emp2@dayflow.com", full_name="Emp Two"
    )

    resp = await client.patch(
        f"{PREFIX}/{other.employee_id}",
        json={"full_name": "Hacked"},
        headers=auth(emp.token),
    )
    assert resp.status_code == 403  # require_admin


@pytest.mark.asyncio
async def test_admin_patch_employee_updates_all_fields(client, session_factory):
    admin = await create_admin(session_factory)
    emp = await create_user(
        session_factory, employee_code="EMP001", email="emp1@dayflow.com", full_name="Emp One"
    )

    new_salary = {"basic": 60000, "hra": 24000, "allowances": 6000,
                  "deductions": 9000, "net_salary": 81000}
    resp = await client.patch(
        f"{PREFIX}/{emp.employee_id}",
        json={
            "full_name": "Emp Promoted",
            "job_details": "Senior Backend Engineer — Engineering",
            "salary_structure": new_salary,
        },
        headers=auth(admin.token),
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["full_name"] == "Emp Promoted"
    assert body["job_details"] == "Senior Backend Engineer — Engineering"
    assert body["salary_structure"]["basic"] == 60000
