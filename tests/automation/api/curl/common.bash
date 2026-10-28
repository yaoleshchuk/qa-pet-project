#!/usr/bin/env bash
# Shared POSIX-compatible-in-Bash helpers.  They use only curl, Bash and the
# Node.js runtime already required by this repository (no jq or Python).

set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3001}"
BASE_URL="${BASE_URL%/}"
case "$BASE_URL" in
  http://localhost:*|http://127.0.0.1:*|http://[::1]:*) ;;
  *) echo "FAIL: BASE_URL must be a local mock origin, got $BASE_URL" >&2; exit 2 ;;
esac
CURL_CONNECT_TIMEOUT="${CURL_CONNECT_TIMEOUT:-5}"
CURL_MAX_TIME="${CURL_MAX_TIME:-15}"
if [ "${CURL_DEDICATED_MOCK:-}" != "1" ]; then
  echo 'FAIL: cURL checks must be launched by npm run test:curl:smoke against its dedicated mock.' >&2
  exit 2
fi
BODY_FILE="$(mktemp "${TMPDIR:-/tmp}/qa-curl.XXXXXX")"

cleanup_body() { rm -f "$BODY_FILE"; }
trap cleanup_body EXIT

request() {
  local method="$1" path="$2" data="${3:-}"
  local args=(--silent --show-error --connect-timeout "$CURL_CONNECT_TIMEOUT" --max-time "$CURL_MAX_TIME" --output "$BODY_FILE" --write-out '%{http_code}' -X "$method" -H 'Accept: application/json')
  if [ -n "$data" ]; then args+=(-H 'Content-Type: application/json' --data "$data"); fi
  HTTP_STATUS="$(curl "${args[@]}" "${BASE_URL}${path}")"
}

expect_status() {
  if [ "$HTTP_STATUS" != "$1" ]; then
    echo "FAIL: expected HTTP $1, got $HTTP_STATUS" >&2
    cat "$BODY_FILE" >&2 || true
    exit 1
  fi
}

json_assert() {
  local expression="$1" description="$2"
  node -e "const fs=require('fs'); let data; try { data=JSON.parse(fs.readFileSync(0,'utf8')); } catch (error) { console.error('FAIL: invalid JSON: '+error.message); process.exit(1); } if (!($expression)) { console.error('FAIL: $description'); process.exit(1); }" < "$BODY_FILE"
}

reset_mock() {
  request POST /api/test/reset
  expect_status 204
}
