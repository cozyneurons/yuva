"""Shared pytest fixtures for the Nihaal backend test suite.

Uses an in-memory SQLite database with a StaticPool so a single connection (and
therefore a single in-memory database) is shared across every session opened
during a test — this is the reliable pattern for async SQLite tests.

The `get_db` dependency override is installed per-test and restored afterwards,
so these fixtures never interfere with other test modules that manage their own
database (e.g. test_auth.py).
"""
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# Import every model so create_all builds the full schema.
import app.models  # noqa: F401
from app.core.deps import get_db
from app.db.base import Base
from app.main import app


def pytest_configure(config):
    config.addinivalue_line("markers", "asyncio: mark test as async")


# ── SQLite portability shim ───────────────────────────────────────────────────
# The models declare Postgres-specific timestamp defaults, e.g.
#   server_default=text("now()")  and  onupdate=text("now()")
# SQLite (the intended test DB — see pyproject `testpaths` and test_auth.py's
# "no Postgres needed in CI") has no now() function, so those INSERT defaults and
# ON UPDATE clauses raise "unknown function: now()". We register a now() UDF on
# every SQLite connection so the same models run unmodified against SQLite.
# Non-SQLite drivers (e.g. asyncpg) don't expose create_function, so this no-ops.
def _sqlite_now() -> str:
    # Naive UTC string matching SQLAlchemy's SQLite DATETIME format so the value
    # round-trips on read (an "+00:00" offset would break its parse regex).
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S.%f")


@event.listens_for(Engine, "connect")
def _register_sqlite_now(dbapi_connection, connection_record):
    create_function = getattr(dbapi_connection, "create_function", None)
    if create_function is None:
        return  # not a SQLite driver — nothing to do
    try:
        create_function("now", 0, _sqlite_now)
    except Exception:
        # Best-effort: never let the shim break connection setup.
        pass


@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def session_factory(db_engine):
    return async_sessionmaker(bind=db_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture
async def client(session_factory):
    """An HTTP client bound to the app, with get_db pointed at the test database."""

    async def _override_get_db():
        async with session_factory() as session:
            yield session

    previous = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = _override_get_db
    try:
        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as c:
            yield c
    finally:
        if previous is not None:
            app.dependency_overrides[get_db] = previous
        else:
            app.dependency_overrides.pop(get_db, None)
