#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.bash"
HOTEL_ID="${1:-321}"; reset_mock; request GET "/api/hotel/${HOTEL_ID}"; expect_status 200
json_assert "data && Number.isSafeInteger(data.id) && typeof data.name === 'string' && typeof data.rating === 'number' && typeof data.address === 'string'" 'hotel details must contain the documented fields'
echo "PASS: hotel details ($HOTEL_ID)"
