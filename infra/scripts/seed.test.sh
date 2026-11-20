#!/usr/bin/env bash
# Prova de seed.sh (--url, trava de produção, recriação) com psql e docker simulados (CA11).
set -euo pipefail
script="$(cd "$(dirname "$0")" && pwd)/seed.sh"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
mkdir "$tmp/bin"
# psql simulado: registra a chamada; responde às consultas conforme FAKE_ENV.
cat > "$tmp/bin/psql" <<'F'
#!/usr/bin/env bash
echo "psql $*" >> "$LOG"
[ -z "${FAKE_FAIL:-}" ] || { echo "psql: error: ${FAKE_FAIL}" >&2; exit 2; }
case "$*" in *"-f -"*) cat >> "$LOG" ;; esac
case "$*" in
  *"-c select 1"*) ;;
  *current_setting*) echo "${FAKE_ENV:-}" ;;
  *to_regclass*) echo t ;;
  *"-c select count"*) echo 2 ;;
esac
F
cat > "$tmp/bin/docker" <<'F'
#!/usr/bin/env bash
echo "docker $*" >> "$LOG"
case "$*" in *to_regclass*) echo t ;; *"select count"*) echo 2 ;; esac
F
chmod +x "$tmp/bin/psql" "$tmp/bin/docker"

run() { # nome, código esperado, FAKE_ENV, args...
  nome="$1"; esperado="$2"; export FAKE_ENV="$3"; shift 3
  export LOG="$tmp/log"; : > "$LOG"
  code=0; PATH="$tmp/bin:$PATH" bash "$script" "$@" >"$tmp/out" 2>&1 || code=$?
  [ "$code" = "$esperado" ] || { echo "FALHOU $nome: código $code, esperado $esperado"; cat "$tmp/out"; exit 1; }
}

run "host de produção" 1 "" --url "postgres://u:p@db.prod.example.test:5432/ctcore"
[ "$(grep -c -e '^.i seed/' "$LOG" || true)" = 0 ] || { echo "FALHOU: aplicou arquivo com host de produção"; exit 1; }
echo "ok  host com prod recusado"

run "banco de produção" 1 "" --url "postgres://u:p@h.example.test/ctcore_PROD"
[ ! -s "$LOG" ] || { echo "FALHOU: chamou o banco com nome de produção"; exit 1; }
echo "ok  banco com prod recusado"

run "marcador" 1 production --url "postgres://u:p@h.example.test/ctcore"
[ "$(grep -c -e '^.i seed/' "$LOG" || true)" = 0 ] || { echo "FALHOU: aplicou arquivo em banco marcado"; exit 1; }
echo "ok  marcador ctcore.env=production recusado"

pw=produtor
run "senha com prod" 0 "" --url "postgres://u:${pw}@h.example.test/ctcore_hml"
echo "ok  'prod' na senha não conta"

total="$(ls "$(dirname "$script")/../seed"/*.sql | grep -vc -e '-local.sql')"
[ "$(grep -c -e '^.i seed/' "$LOG")" = "$total" ] || { echo "FALHOU: esperava $total arquivos aplicados"; cat "$LOG"; exit 1; }
! grep -q -e '-local.sql' "$LOG" || { echo "FALHOU: aplicou arquivo -local"; exit 1; }
echo "ok  homologação aplica $total arquivos e pula os -local"

run "local" 0 ""
grep -q '^docker compose' "$LOG" && ! grep -q '^psql' "$LOG" || { echo "FALHOU: sem --url deveria usar o docker"; cat "$LOG"; exit 1; }
echo "ok  sem --url usa o PostgreSQL do compose"

run "uso" 2 "" --foo
echo "ok  argumento inválido"

# CA11: URL por -d antes de qualquer posicional, UTF-8, recriação com RLS e trava, erro real do psql.
run "recriação" 0 "" --url "postgres://u:p@h.example.test/ctcore_hml"
grep -q -e '-d postgres://u:p@h.example.test/ctcore_hml' "$LOG" || { echo "FALHOU: URL não foi passada com -d"; cat "$LOG"; exit 1; }
! grep -E '^psql postgres://' "$LOG" || { echo "FALHOU: URL como argumento posicional"; exit 1; }
echo "ok  URL vai com -d, depois das opções"
grep -q 'no force row level security' "$LOG" && grep -q ' force row level security' "$LOG" && grep -q 'truncate table' "$LOG" \
  && grep -q 'pg_advisory_xact_lock(6710671)' "$LOG" || { echo "FALHOU: recriação sem NO FORCE/FORCE, truncate ou trava"; cat "$LOG"; exit 1; }
echo "ok  recria do zero com NO FORCE/FORCE e a trava da API"
[ "$(PGCLIENTENCODING= PATH="$tmp/bin:$PATH" bash -c 'export LOG=/dev/null; source <(sed -n "/^export PGCLIENTENCODING/p" "'"$script"'"); echo $PGCLIENTENCODING')" = UTF8 ] \
  || { echo "FALHOU: PGCLIENTENCODING não é UTF8"; exit 1; }
echo "ok  PGCLIENTENCODING=UTF8"

export FAKE_FAIL='FATAL: password authentication failed'
run "erro real" 1 "" --url "postgres://u:p@h.example.test/ctcore_hml"
grep -q 'password authentication failed' "$tmp/out" || { echo "FALHOU: erro real do psql não apareceu"; cat "$tmp/out"; exit 1; }
unset FAKE_FAIL
echo "ok  erro real do psql aparece"
