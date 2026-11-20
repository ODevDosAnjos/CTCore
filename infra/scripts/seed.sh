#!/usr/bin/env bash
# Aplica os dados fictícios (infra/seed/*.sql, em ordem do nome).
# Sem argumentos: PostgreSQL do docker-compose local. Pré-requisito: ambiente de pé e back-end rodado ao menos uma vez (migrações). Idempotente.
# Com --url <conexão>: banco remoto (homologação) pelo psql da máquina; recusa produção e não aplica os arquivos *-local.sql.
set -euo pipefail
cd "$(dirname "$0")/.."

url=""
case "${1:-}" in
  --url) url="${2:-}"; [ -n "$url" ] || { echo "Uso: seed.sh [--url <conexão>]" >&2; exit 2; } ;;
  "") ;;
  *) echo "Uso: seed.sh [--url <conexão>]" >&2; exit 2 ;;
esac

if [ -n "$url" ]; then
  # Trava de produção: host ou banco com "prod" (sem a senha, que pode ter qualquer texto).
  alvo="${url#*://}"; alvo="${alvo##*@}"
  case "$(printf '%s' "$alvo" | tr 'A-Z' 'a-z')" in
    *prod*) echo "Recusado: a URL parece de produção (host ou banco com 'prod'). Nada foi aplicado." >&2; exit 1 ;;
  esac
  psql_() { psql "$url" -v ON_ERROR_STOP=1 -tA "$@"; }
  psql_ -c 'select 1' >/dev/null 2>&1 || { echo "Não foi possível conectar ao banco da URL." >&2; exit 1; }
  [ "$(psql_ -c "select coalesce(current_setting('ctcore.env', true), '')")" != production ] \
    || { echo "Recusado: o banco está marcado como produção (ctcore.env=production). Nada foi aplicado." >&2; exit 1; }
else
  dc() { docker compose -f docker-compose.yml "$@"; }
  psql_() { dc exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tA "$@"' sh "$@"; }
  psql_ -c 'select 1' >/dev/null 2>&1 || { echo "PostgreSQL local não está de pé. Suba o ambiente: docker compose -f infra/docker-compose.yml up -d --wait" >&2; exit 1; }
fi
[ "$(psql_ -c "select to_regclass('public.organization_feature') is not null")" = t ] \
  || { echo "Esquema sem migração. Rode o back-end antes: ./backend/mvnw -f backend/pom.xml spring-boot:run -Dspring-boot.run.profiles=local" >&2; exit 1; }

for f in seed/*.sql; do
  if [ -n "$url" ]; then
    case "$f" in *-local.sql) echo "Pulando $f (só local)"; continue ;; esac
    echo "Aplicando $f"
    psql "$url" -v ON_ERROR_STOP=1 --single-transaction -q -f "$f"
  else
    echo "Aplicando $f"
    dc exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 --single-transaction -q' < "$f"
  fi
done
echo "Organizações fictícias: $(psql_ -c "select count(distinct organization_id) from organization_feature")"
