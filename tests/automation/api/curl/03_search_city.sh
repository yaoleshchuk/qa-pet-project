#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Test:     Hotel Search by City
# Endpoint: GET /api/hotels?city={city}
# Expected: HTTP 200, non-empty JSON array
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE_URL="${BASE_URL:-https://api.booking.com}"
CITY="${1:-Paris}"

echo "▶ GET ${BASE_URL}/api/hotels?city=${CITY}"

response=$(curl -s -w "\n%{http_code}" \
  -H "Accept: application/json" \
  "${BASE_URL}/api/hotels?city=${CITY}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "  Status : ${http_code}"

if [ "$http_code" -ne 200 ]; then
  echo "❌ FAIL – expected 200, got ${http_code}" >&2; exit 1
fi

hotel_count=$(echo "$body" | grep -o '"id"' | wc -l)
if [ "$hotel_count" -eq 0 ]; then
  echo "❌ FAIL – response array is empty for city: ${CITY}" >&2; exit 1
fi

echo "✅ PASS – found ${hotel_count} hotel(s) in ${CITY}"
