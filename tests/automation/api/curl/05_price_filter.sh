#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.bash"
MIN="${1:-100}"; MAX="${2:-300}"; reset_mock; request GET "/api/hotels?city=Paris&min_price=${MIN}&max_price=${MAX}"; expect_status 200
MIN_PRICE="$MIN" MAX_PRICE="$MAX" json_assert "Array.isArray(data) && data.length > 0 && data.every((hotel) => typeof hotel.price === 'number' && hotel.price >= Number(process.env.MIN_PRICE) && hotel.price <= Number(process.env.MAX_PRICE))" 'every returned price must be inside the requested range'
echo "PASS: price filter ($MIN-$MAX)"
