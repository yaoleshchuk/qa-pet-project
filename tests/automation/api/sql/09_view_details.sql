-- ─────────────────────────────────────────────────────────────────────────────
-- Test:    View Hotel Details
-- Purpose: Verify that hotel detail endpoint returns complete data matching
--          the database record, including aggregated review stats and amenities.
-- ─────────────────────────────────────────────────────────────────────────────

SELECT
  h.id,
  h.name,
  h.stars,
  h.city,
  h.country,
  h.address,
  h.phone,
  h.email,
  h.price_per_night,
  h.check_in_time,
  h.check_out_time,
  h.is_active,
  -- Aggregated review statistics
  COUNT(DISTINCT r.id)             AS total_reviews,
  ROUND(AVG(r.rating), 1)          AS avg_rating,
  SUM(CASE WHEN r.rating = 5 THEN 1 ELSE 0 END) AS five_star_count,
  SUM(CASE WHEN r.rating <= 2 THEN 1 ELSE 0 END) AS low_rating_count,
  -- Amenities
  COUNT(DISTINCT ha.amenity_id)    AS amenity_count,
  STRING_AGG(DISTINCT a.name, ', ' ORDER BY a.name) AS amenity_list
FROM hotels h
LEFT JOIN reviews r          ON r.hotel_id   = h.id
LEFT JOIN hotel_amenities ha ON ha.hotel_id  = h.id
LEFT JOIN amenities a        ON a.id         = ha.amenity_id
WHERE h.id = 321
GROUP BY h.id, h.name, h.stars, h.city, h.country, h.address,
         h.phone, h.email, h.price_per_night,
         h.check_in_time, h.check_out_time, h.is_active;
