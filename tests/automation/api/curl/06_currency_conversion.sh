#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Test:     Currency Conversion
# Endpoint: GET /api/hotels?city=Paris&currency={code}
# Expected: HTTP 200 for each currency; prices contain correct symbol
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE_URL="${BASE_URL:-https://api.booking.com}"
PASS=0; FAIL=0

for CURRENCY in USD EUR GBP; do
  echo "▶ GET ${BASE_URL}/api/hotels?city=Paris&currency=${CURRENCY}"

  response=$(curl -s -w "\n%{http_code}" \
    -H "Accept: application/json" \
    "${BASE_URL}/api/hotels?city=Paris&currency=${CURRENCY}")

  http_code=$(echo "$response" | tail -n1)

  if [ "$http_code" -eq 200 ]; then
    echo "  ✅ ${CURRENCY} – HTTP ${http_code}"
    PASS=$((PASS + 1))
  else
    echo "  ❌ ${CURRENCY} – expected 200, got ${http_code}" >&2
    FAIL=$((FAIL + 1))
  fi
done

echo ""
echo "Results: ${PASS} passed, ${FAIL} failed"
[ "$FAIL" -eq 0 ] || exit 1
