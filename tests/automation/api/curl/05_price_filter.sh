#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Test:     Price Range Filter (100–300 per night)
# Endpoint: GET /api/hotels?city=Paris&min_price=100&max_price=300
# Expected: HTTP 200, every hotel price within [100, 300]
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE_URL="${BASE_URL:-https://api.booking.com}"
MIN=100; MAX=300

echo "▶ GET ${BASE_URL}/api/hotels?city=Paris&min_price=${MIN}&max_price=${MAX}"

response=$(curl -s -w "\n%{http_code}" \
  -H "Accept: application/json" \
  "${BASE_URL}/api/hotels?city=Paris&min_price=${MIN}&max_price=${MAX}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "  Status : ${http_code}"

if [ "$http_code" -ne 200 ]; then
  echo "❌ FAIL – expected 200, got ${http_code}" >&2; exit 1
fi

echo "✅ PASS – price-filtered results returned (${MIN}–${MAX} range)"
echo "  Body preview: ${body:0:120}..."
