#!/bin/bash
curl -X POST https://api.booking.com/api/wishlist \
     -H "Content-Type: application/json" \
     -d '{"hotel_id":123}'
