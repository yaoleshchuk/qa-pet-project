#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.bash"
CITY="${1:-Paris}"; CHECKIN="${2:-2026-07-01}"; CHECKOUT="${3:-2026-07-05}"; reset_mock; request GET "/api/hotels?city=${CITY}&checkin=${CHECKIN}&checkout=${CHECKOUT}"; expect_status 200
EXPECTED_CITY="$CITY" json_assert "Array.isArray(data) && data.length > 0 && data.every((hotel) => hotel.city.toLowerCase() === process.env.EXPECTED_CITY.toLowerCase()) && !data.some((hotel) => hotel.name === 'Eiffel Boutique Hotel')" 'dated search must be JSON and exclude the known unavailable fixture'
echo "PASS: dated search ($CITY, $CHECKIN to $CHECKOUT)"
