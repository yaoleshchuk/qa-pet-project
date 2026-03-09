#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Test:     Login API – Failure (invalid credentials)
# Endpoint: POST /api/login
# Expected: HTTP 401, body contains { "error": "..." }
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE_URL="${BASE_URL:-https://api.booking.com}"

echo "▶ POST ${BASE_URL}/api/login  (invalid credentials)"

response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"fake@mail.com","password":"wrong123"}')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "  Status : ${http_code}"
echo "  Body   : ${body}"

if [ "$http_code" -ne 401 ]; then
  echo "❌ FAIL – expected 401, got ${http_code}" >&2; exit 1
fi

echo "✅ PASS – login correctly rejected with 401"
