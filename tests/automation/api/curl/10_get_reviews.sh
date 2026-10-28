#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.bash"
HOTEL_ID="${1:-321}"; reset_mock; request GET "/api/hotel/${HOTEL_ID}/reviews"; expect_status 200
json_assert "Array.isArray(data) && data.length > 0 && data.every((review) => typeof review.user === 'string' && Number.isInteger(review.rating))" 'review list must be a non-empty JSON array with user and rating'
echo "PASS: reviews ($HOTEL_ID)"
