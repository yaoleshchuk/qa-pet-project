#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.bash"
CITY="${1:-Paris}"; reset_mock; request GET "/api/hotels?city=${CITY}"; expect_status 200
EXPECTED_CITY="$CITY" json_assert "Array.isArray(data) && data.length > 0 && data.every((hotel) => hotel.city.toLowerCase() === process.env.EXPECTED_CITY.toLowerCase())" 'city search must return only a non-empty matching JSON array'
echo "PASS: city search ($CITY)"
