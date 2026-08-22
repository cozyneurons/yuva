"""Tests for the payroll endpoints (Nihaal — Backend Support)."""
import pytest

from tests.factories import auth, create_admin, create_user

PREFIX = "/api/v1/payroll"

# net_salary here is deliberately WRONG so the tests prove the server recomputes it.
SALARY = {"basic": 50000, "hra": 20000, "allowances": 10000, "deductions": 8000,
          "net_salary": 999999}
EXPECTED_NET = 50000 + 20000 + 10000 - 8000  # 72000


@pytest.mark.asyncio
async def test_employee_reads_own_payroll_with_recomputed_net(client, session_factory):
    emp = await create_user(
        session_factory, employee_code="EMP001", email="emp1@dayflow.com",
        full_name="Emp One", salary_structure=dict(SALARY),
    )

    resp = await client.get(f"{PREFIX}/{emp.employee_id}", headers=auth(emp.token))
    assert resp.status_code == 200
    body = resp.json()
    assert isinstance(body, list) and len(body) == 1
    record = body[0]
    assert record["employee_id"] == emp.employee_id
    assert record["employee_code"] == "EMP001"
    # Stored net was 999999 but the endpoint recomputes from components.
    assert record["salary_structure"]["net_salary"] == EXPECTED_NET


@pytest.mark.asyncio
async def test_employee_cannot_read_others_payroll(client, session_factory):
    emp = await create_user(
        session_factory, employee_code="EMP001", email="emp1@dayflow.com", full_name="Emp One"
    )
    other = await create_user(
        session_factory, employee_code="EMP002", email="emp2@dayflow.com", full_name="Emp Two"
    )

    resp = await client.get(f"{PREFIX}/{other.employee_id}", headers=auth(emp.token))
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_reads_any_payroll(client, session_factory):
    admin = await create_admin(session_factory)
    emp = await create_user(
        session_factory, employee_code="EMP001", email="emp1@dayflow.com",
        full_name="Emp One", salary_structure=dict(SALARY),
    )

    resp = await client.get(f"{PREFIX}/{emp.employee_id}", headers=auth(admin.token))
    assert resp.status_code == 200
    assert resp.json()[0]["salary_structure"]["net_salary"] == EXPECTED_NET


@pytest.mark.asyncio
async def test_employee_cannot_patch_payroll(client, session_factory):
    emp = await create_user(
        session_factory, employee_code="EMP001", email="emp1@dayflow.com",
        full_name="Emp One", salary_structure=dict(SALARY),
    )

    resp = await client.patch(
        f"{PREFIX}/{emp.employee_id}", json={"basic": 60000}, headers=auth(emp.token)
    )
    assert resp.status_code == 403  # admin only


@pytest.mark.asyncio
async def test_admin_patch_recomputes_net(client, session_factory):
    admin = await create_admin(session_factory)
    emp = await create_user(
        session_factory, employee_code="EMP001", email="emp1@dayflow.com",
        full_name="Emp One", salary_structure=dict(SALARY),
    )

    resp = await client.patch(
        f"{PREFIX}/{emp.employee_id}", json={"basic": 60000}, headers=auth(admin.token)
    )
    assert resp.status_code == 200
    salary = resp.json()["salary_structure"]
    assert salary["basic"] == 60000
    # net = 60000 + 20000 + 10000 - 8000
    assert salary["net_salary"] == 82000


@pytest.mark.asyncio
async def test_download_payslip_returns_pdf(client, session_factory):
    emp = await create_user(
        session_factory, employee_code="EMP001", email="emp1@dayflow.com",
        full_name="Emp One", salary_structure=dict(SALARY),
    )

    resp = await client.get(f"{PREFIX}/{emp.employee_id}/slip", headers=auth(emp.token))
    assert resp.status_code == 200
    assert "application/pdf" in resp.headers["content-type"]
    assert resp.content[:5] == b"%PDF-"


@pytest.mark.asyncio
async def test_payroll_not_found(client, session_factory):
    admin = await create_admin(session_factory)
    resp = await client.get(f"{PREFIX}/99999", headers=auth(admin.token))
    assert resp.status_code == 404
