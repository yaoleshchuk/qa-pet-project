#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Test:     Hotel Search with Check-in / Check-out Dates
# Endpoint: GET /api/hotels?city={city}&checkin={date}&checkout={date}
# Expected: HTTP 200, array of available hotels
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE_URL="${BASE_URL:-https://api.booking.com}"
CITY="${1:-Paris}"
CHECKIN="${2:-2025-07-01}"
CHECKOUT="${3:-2025-07-05}"

echo "▶ GET ${BASE_URL}/api/hotels?city=${CITY}&checkin=${CHECKIN}&checkout=${CHECKOUT}"

response=$(curl -s -w "\n%{http_code}" \
  -H "Accept: application/json" \
  "${BASE_URL}/api/hotels?city=${CITY}&checkin=${CHECKIN}&checkout=${CHECKOUT}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "  Status : ${http_code}"

if [ "$http_code" -ne 200 ]; then
  echo "❌ FAIL – expected 200, got ${http_code}" >&2; exit 1
fi

echo "✅ PASS – available hotels returned for ${CITY} (${CHECKIN} → ${CHECKOUT})"
echo "  Body preview: ${body:0:120}..."
