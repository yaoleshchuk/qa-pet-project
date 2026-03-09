-- ─────────────────────────────────────────────────────────────────────────────
-- Test:    Price Range Filter (100–300 per night)
-- Purpose: Verify all returned hotels fall within the specified price range
--          and confirm the distribution across price brackets.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Validate no hotel outside the range sneaked in
SELECT
  h.id,
  h.name,
  h.price_per_night,
  CASE
    WHEN h.price_per_night < 100  THEN 'BELOW_MIN – should not appear'
    WHEN h.price_per_night > 300  THEN 'ABOVE_MAX – should not appear'
    ELSE 'IN_RANGE'
  END AS range_check
FROM hotels h
WHERE h.city      = 'Paris'
  AND h.is_active = true
ORDER BY h.price_per_night;

-- 2. Distribution per price bracket (for test analysis)
SELECT
  CASE
    WHEN price_per_night BETWEEN 100 AND 150 THEN '100 – 150'
    WHEN price_per_night BETWEEN 151 AND 200 THEN '151 – 200'
    WHEN price_per_night BETWEEN 201 AND 250 THEN '201 – 250'
    WHEN price_per_night BETWEEN 251 AND 300 THEN '251 – 300'
  END                          AS price_bracket,
  COUNT(*)                     AS hotel_count,
  MIN(price_per_night)         AS min_price,
  MAX(price_per_night)         AS max_price,
  ROUND(AVG(price_per_night))  AS avg_price
FROM hotels
WHERE city             = 'Paris'
  AND is_active        = true
  AND price_per_night BETWEEN 100 AND 300
GROUP BY price_bracket
ORDER BY price_bracket;
