#!/usr/bin/env sh
# Backend container entrypoint (Nihaal — Backend Support).
#
# Postgres readiness is guaranteed by the compose healthcheck (backend
# depends_on: db: condition: service_healthy), so by the time this runs the DB
# is accepting connections.
#
# We bootstrap the schema with SQLAlchemy's create_all (via the seed script)
# rather than `alembic upgrade head`, because it uses the already-installed
# asyncpg driver and gives a reliable one-command bring-up for the demo.
#   SEED_ON_START=true  (default) → create tables + insert demo data if empty
#   SEED_ON_START=false           → create tables only, no demo data
set -e

FLAGS="--create-tables"
if [ "${SEED_ON_START:-true}" != "true" ]; then
    FLAGS="$FLAGS --no-seed"
fi

echo "→ Preparing database (SEED_ON_START=${SEED_ON_START:-true})"
python -m scripts.seed $FLAGS || echo "⚠ seed step reported an issue; continuing to start the API"

echo "→ Starting API on :8000"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
