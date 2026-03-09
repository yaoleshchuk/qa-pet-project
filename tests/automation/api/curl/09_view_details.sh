#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Test:     View Hotel Details
# Endpoint: GET /api/hotel/321
# Expected: HTTP 200, body contains name, rating, address
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE_URL="${BASE_URL:-https://api.booking.com}"
HOTEL_ID="${1:-321}"

echo "▶ GET ${BASE_URL}/api/hotel/${HOTEL_ID}"

response=$(curl -s -w "\n%{http_code}" \
  -H "Accept: application/json" \
  "${BASE_URL}/api/hotel/${HOTEL_ID}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "  Status : ${http_code}"

if [ "$http_code" -ne 200 ]; then
  echo "❌ FAIL – expected 200, got ${http_code}" >&2; exit 1
fi

for field in '"name"' '"rating"' '"address"'; do
  if ! echo "$body" | grep -q "$field"; then
    echo "❌ FAIL – field ${field} missing from response" >&2; exit 1
  fi
done

echo "✅ PASS – hotel ${HOTEL_ID} details returned with all required fields"
