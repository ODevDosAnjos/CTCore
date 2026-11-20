#!/usr/bin/env bash
# Prova de seed.sh (--url e trava de produção) com psql e docker simulados (CA9, CA10).
set -euo pipefail
script="$(cd "$(dirname "$0")" && pwd)/seed.sh"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
mkdir "$tmp/bin"
# psql simulado: registra a chamada; responde às consultas conforme FAKE_ENV.
cat > "$tmp/bin/psql" <<'F'
#!/usr/bin/env bash
echo "psql $*" >> "$LOG"
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
[ "$(grep -c -e '-f seed/' "$LOG" || true)" = 0 ] || { echo "FALHOU: aplicou arquivo com host de produção"; exit 1; }
echo "ok  host com prod recusado"

run "banco de produção" 1 "" --url "postgres://u:p@h.example.test/ctcore_PROD"
[ ! -s "$LOG" ] || { echo "FALHOU: chamou o banco com nome de produção"; exit 1; }
echo "ok  banco com prod recusado"

run "marcador" 1 production --url "postgres://u:p@h.example.test/ctcore"
[ "$(grep -c -e '-f seed/' "$LOG" || true)" = 0 ] || { echo "FALHOU: aplicou arquivo em banco marcado"; exit 1; }
echo "ok  marcador ctcore.env=production recusado"

pw=produtor
run "senha com prod" 0 "" --url "postgres://u:${pw}@h.example.test/ctcore_hml"
echo "ok  'prod' na senha não conta"

total="$(ls "$(dirname "$script")/../seed"/*.sql | grep -vc -e '-local.sql')"
[ "$(grep -c -e '-f seed/' "$LOG")" = "$total" ] || { echo "FALHOU: esperava $total arquivos aplicados"; cat "$LOG"; exit 1; }
! grep -q -e '-local.sql' "$LOG" || { echo "FALHOU: aplicou arquivo -local"; exit 1; }
echo "ok  homologação aplica $total arquivos e pula os -local"

run "local" 0 ""
grep -q '^docker compose' "$LOG" && ! grep -q '^psql' "$LOG" || { echo "FALHOU: sem --url deveria usar o docker"; cat "$LOG"; exit 1; }
echo "ok  sem --url usa o PostgreSQL do compose"

run "uso" 2 "" --foo
echo "ok  argumento inválido"
