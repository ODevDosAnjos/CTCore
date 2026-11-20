#!/usr/bin/env bash
# Aplica os dados fictícios (infra/seed/*.sql, em ordem do nome).
# Sem argumentos: PostgreSQL do docker-compose local. Pré-requisito: ambiente de pé e back-end rodado ao menos uma vez (migrações). Idempotente.
# Com --url <conexão>: banco remoto (homologação) pelo psql da máquina; recusa produção, não aplica os arquivos *-local.sql e recria do zero:
# apaga os dados de todas as tabelas (o esquema fica) e aplica o seed numa transação, sem o FORCE ROW LEVEL SECURITY só durante a aplicação
# (mesmo tratamento do HomologationSeed da API, com a mesma chave de trava consultiva).
set -euo pipefail
cd "$(dirname "$0")/.."

url=""
case "${1:-}" in
  --url) url="${2:-}"; [ -n "$url" ] || { echo "Uso: seed.sh [--url <conexão>]" >&2; exit 2; } ;;
  "") ;;
  *) echo "Uso: seed.sh [--url <conexão>]" >&2; exit 2 ;;
esac

export PGCLIENTENCODING=UTF8

if [ -n "$url" ]; then
  # Trava de produção: host ou banco com "prod" (sem a senha, que pode ter qualquer texto).
  alvo="${url#*://}"; alvo="${alvo##*@}"
  case "$(printf '%s' "$alvo" | tr 'A-Z' 'a-z')" in
    *prod*) echo "Recusado: a URL parece de produção (host ou banco com 'prod'). Nada foi aplicado." >&2; exit 1 ;;
  esac
  # Opções antes da URL, que vai com -d (a URL nunca é argumento posicional). O erro do psql aparece como veio.
  psql_() { psql -v ON_ERROR_STOP=1 -tA -d "$url" "$@"; }
  psql_ -c 'select 1' >/dev/null || { echo "Não foi possível conectar ao banco da URL (erro do psql acima)." >&2; exit 1; }
  [ "$(psql_ -c "select coalesce(current_setting('ctcore.env', true), '')")" != production ] \
    || { echo "Recusado: o banco está marcado como produção (ctcore.env=production). Nada foi aplicado." >&2; exit 1; }
else
  dc() { docker compose -f docker-compose.yml "$@"; }
  psql_() { dc exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -tA "$@"' sh "$@"; }
  psql_ -c 'select 1' >/dev/null 2>&1 || { echo "PostgreSQL local não está de pé. Suba o ambiente: docker compose -f infra/docker-compose.yml up -d --wait" >&2; exit 1; }
fi
[ "$(psql_ -c "select to_regclass('public.organization_feature') is not null")" = t ] \
  || { echo "Esquema sem migração. Rode o back-end antes: ./backend/mvnw -f backend/pom.xml spring-boot:run -Dspring-boot.run.profiles=local" >&2; exit 1; }

if [ -n "$url" ]; then
  # Recria do zero numa transação só: trava, tira o FORCE das tabelas que o têm, apaga os dados, aplica e devolve o FORCE.
  {
    echo "begin;"
    echo "select pg_advisory_xact_lock(6710671);"
    cat <<'SQL'
create temp table _forced on commit drop as
  select relname::text as t from pg_class where relnamespace = 'public'::regnamespace and relkind = 'r' and relforcerowsecurity;
do $$ declare r record; begin
  for r in select t from _forced loop execute format('alter table public.%I no force row level security', r.t); end loop;
  for r in select tablename from pg_tables where schemaname = 'public' and tablename not in ('flyway_schema_history', 'ctcore_seed_state') loop
    execute format('truncate table public.%I restart identity cascade', r.tablename);
  end loop;
end $$;
SQL
    for f in seed/*.sql; do
      case "$f" in *-local.sql) echo "Pulando $f (só local)" >&2; continue ;; esac
      echo "Aplicando $f" >&2
      printf '\\i %s\n' "$f"
    done
    cat <<'SQL'
do $$ declare r record; begin
  for r in select t from _forced loop execute format('alter table public.%I force row level security', r.t); end loop;
end $$;
commit;
SQL
  } | psql_ -q -f - >/dev/null
else
  for f in seed/*.sql; do
    echo "Aplicando $f"
    dc exec -T postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 --single-transaction -q' < "$f"
  done
fi
echo "Organizações: $(psql_ -c "select count(distinct organization_id) from organization_feature")"
