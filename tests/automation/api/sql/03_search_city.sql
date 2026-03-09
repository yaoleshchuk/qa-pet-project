-- ─────────────────────────────────────────────────────────────────────────────
-- Test:    Hotel Search by City
-- Purpose: Verify that the API response matches the database records for the
--          requested city, including average rating and active status.
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  h.id,
  h.name,
  h.city,
  h.country,
  h.stars,
  h.price_per_night,
  h.is_active,
  ROUND(AVG(r.rating), 1)        AS avg_rating,
  COUNT(r.id)                    AS total_reviews,
  COUNT(DISTINCT a.amenity_id)   AS amenity_count,
  RANK() OVER (
    ORDER BY AVG(r.rating) DESC, h.stars DESC
  )                              AS quality_rank
FROM hotels h
LEFT JOIN reviews r       ON r.hotel_id  = h.id
LEFT JOIN hotel_amenities a ON a.hotel_id = h.id
WHERE h.city      ILIKE 'Paris'
  AND h.is_active = true
GROUP BY h.id, h.name, h.city, h.country, h.stars,
         h.price_per_night, h.is_active
ORDER BY quality_rank;
