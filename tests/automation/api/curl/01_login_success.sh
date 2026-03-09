#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Test:     Login API – Success
# Endpoint: POST /api/login
# Expected: HTTP 200, body contains { "token": "..." }
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE_URL="${BASE_URL:-https://api.booking.com}"
EMAIL="${TEST_EMAIL:-user1@mail.com}"
PASSWORD="${TEST_PASSWORD:-password123}"

echo "▶ POST ${BASE_URL}/api/login"

response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/login" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\"}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "  Status : ${http_code}"
echo "  Body   : ${body}"

if [ "$http_code" -ne 200 ]; then
  echo "❌ FAIL – expected 200, got ${http_code}" >&2; exit 1
fi

token=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
if [ -z "$token" ]; then
  echo "❌ FAIL – response does not contain 'token'" >&2; exit 1
fi

echo "✅ PASS – token received: ${token:0:20}..."
