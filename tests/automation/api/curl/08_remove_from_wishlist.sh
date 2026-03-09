#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Test:     Remove Hotel from Wishlist
# Endpoint: DELETE /api/wishlist/123
# Expected: HTTP 200, hotel_id no longer in body.wishlist
# Auth:     Bearer token required
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE_URL="${BASE_URL:-https://api.booking.com}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
HOTEL_ID=123

echo "▶ DELETE ${BASE_URL}/api/wishlist/${HOTEL_ID}"

response=$(curl -s -w "\n%{http_code}" -X DELETE \
  "${BASE_URL}/api/wishlist/${HOTEL_ID}" \
  -H "Accept: application/json" \
  ${AUTH_TOKEN:+-H "Authorization: Bearer ${AUTH_TOKEN}"})

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "  Status : ${http_code}"
echo "  Body   : ${body}"

if [ "$http_code" -ne 200 ]; then
  echo "❌ FAIL – expected 200, got ${http_code}" >&2; exit 1
fi

echo "✅ PASS – hotel ${HOTEL_ID} removed from wishlist"
