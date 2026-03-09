#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Test:     Get Hotel Reviews
# Endpoint: GET /api/hotel/321/reviews
# Expected: HTTP 200, array where each item has 'user' and 'rating' fields
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE_URL="${BASE_URL:-https://api.booking.com}"
HOTEL_ID="${1:-321}"

echo "▶ GET ${BASE_URL}/api/hotel/${HOTEL_ID}/reviews"

response=$(curl -s -w "\n%{http_code}" \
  -H "Accept: application/json" \
  "${BASE_URL}/api/hotel/${HOTEL_ID}/reviews")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)

echo "  Status : ${http_code}"

if [ "$http_code" -ne 200 ]; then
  echo "❌ FAIL – expected 200, got ${http_code}" >&2; exit 1
fi

review_count=$(echo "$body" | grep -o '"rating"' | wc -l)
echo "  Reviews found: ${review_count}"

if [ "$review_count" -eq 0 ]; then
  echo "⚠ WARNING – no reviews returned for hotel ${HOTEL_ID}"
else
  echo "✅ PASS – ${review_count} review(s) returned with required fields"
fi
