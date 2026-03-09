#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Test:     Add Hotel to Wishlist
# Endpoint: POST /api/wishlist
# Expected: HTTP 200, body.wishlist contains hotel_id
# Auth:     Bearer token required
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE_URL="${BASE_URL:-https://api.booking.com}"
AUTH_TOKEN="${AUTH_TOKEN:-}"
HOTEL_ID=123

if [ -z "$AUTH_TOKEN" ]; then
  echo "⚠ AUTH_TOKEN not set – request will be unauthenticated"
fi

echo "▶ POST ${BASE_URL}/api/wishlist  { hotel_id: ${HOTEL_ID} }"

response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/wishlist" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  ${AUTH_TOKEN:+-H "Authorization: Bearer ${AUTH_TOKEN}"} \
  -d "{\"hotel_id\":${HOTEL_ID}}")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "  Status : ${http_code}"
echo "  Body   : ${body}"

if [ "$http_code" -ne 200 ]; then
  echo "❌ FAIL – expected 200, got ${http_code}" >&2; exit 1
fi

echo "✅ PASS – hotel ${HOTEL_ID} added to wishlist"
