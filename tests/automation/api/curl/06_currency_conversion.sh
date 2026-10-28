#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.bash"
reset_mock
for currency in USD EUR GBP; do request GET "/api/hotels?city=Paris&currency=${currency}"; expect_status 200; EXPECTED_CURRENCY="$currency" json_assert "Array.isArray(data) && data.length > 0 && data.every((hotel) => hotel.currency === process.env.EXPECTED_CURRENCY && typeof hotel.price === 'number' && typeof hotel.currency_symbol === 'string')" "currency ${currency} must be represented in each JSON hotel"; done
echo 'PASS: USD/EUR/GBP conversion responses'
