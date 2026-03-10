-- ─────────────────────────────────────────────────────────────────────────────
-- Test:    Hotel Search with Check-in / Check-out Dates
-- Purpose: Verify only hotels with at least one available room for the
--          requested date range are returned. A hotel is available when no
--          confirmed booking overlaps the requested period.
-- ─────────────────────────────────────────────────────────────────────────────

WITH overlapping_bookings AS (
  -- Identify hotels that have a confirmed booking overlapping the search dates
  SELECT DISTINCT hotel_id
  FROM bookings
  WHERE status        = 'confirmed'
    AND checkin_date  < '2026-07-05'   -- checkout requested
    AND checkout_date > '2026-07-01'   -- checkin requested
),
available_hotels AS (
  SELECT
    h.id,
    h.name,
    h.city,
    h.stars,
    h.price_per_night,
    h.available_rooms,
    ROUND(AVG(r.rating), 1) AS avg_rating
  FROM hotels h
  LEFT JOIN reviews r ON r.hotel_id = h.id
  WHERE h.city      = 'Paris'
    AND h.is_active = true
    AND h.id NOT IN (SELECT hotel_id FROM overlapping_bookings)
  GROUP BY h.id, h.name, h.city, h.stars,
           h.price_per_night, h.available_rooms
)
SELECT
  *,
  ROW_NUMBER() OVER (ORDER BY price_per_night ASC) AS price_rank
FROM available_hotels
ORDER BY price_rank;
