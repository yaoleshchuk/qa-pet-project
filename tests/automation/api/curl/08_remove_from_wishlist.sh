#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.bash"
HOTEL_ID="${1:-321}"; reset_mock; request POST /api/wishlist "{\"hotel_id\":${HOTEL_ID}}"; expect_status 200; request DELETE "/api/wishlist/${HOTEL_ID}"; expect_status 200
EXPECTED_HOTEL_ID="$HOTEL_ID" json_assert "Array.isArray(data.wishlist) && !data.wishlist.includes(Number(process.env.EXPECTED_HOTEL_ID))" 'deleted wishlist entry must not remain'
echo "PASS: wishlist remove ($HOTEL_ID)"
