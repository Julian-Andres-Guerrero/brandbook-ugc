#!/usr/bin/env bash
# Corre migraciones + datos iniciales + pruebas de RLS en un Postgres local sin
# Docker (usa un stub de auth/storage). Uso:
#   PGHOST=localhost PGPORT=5432 PGUSER=postgres ./scripts/test-db.sh
# Con la CLI de Supabase y Docker puedes usar en su lugar:
#   npx supabase db reset && npx supabase test db
set -euo pipefail
cd "$(dirname "$0")/.."
DB="brandbook_test_$$"
psql -v ON_ERROR_STOP=1 -q -d postgres -c "create database $DB" >/dev/null
trap 'psql -q -d postgres -c "drop database if exists $DB" >/dev/null' EXIT
run() { psql -v ON_ERROR_STOP=1 -q -d "$DB" -f "$1" >/dev/null; echo "ok  $1"; }
run supabase/tests/_stub_supabase.sql
for f in supabase/migrations/*.sql; do run "$f"; done
run supabase/seed/00_local_user.sql
run supabase/seed/10_julian_data.sql
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f supabase/tests/rls.test.sql
