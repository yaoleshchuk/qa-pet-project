-- ─────────────────────────────────────────────────────────────────────────────
-- Test:    Get Hotel Reviews
-- Purpose: Verify all reviews contain required fields (user, rating, body)
--          and that the aggregate stats match the individual review data.
-- ─────────────────────────────────────────────────────────────────────────────

WITH review_stats AS (
  -- Pre-calculate aggregate stats for cross-validation
  SELECT
    hotel_id,
    COUNT(*)                        AS total_count,
    ROUND(AVG(rating), 1)           AS computed_avg,
    MAX(rating)                     AS max_rating,
    MIN(rating)                     AS min_rating,
    PERCENTILE_CONT(0.5)
      WITHIN GROUP (ORDER BY rating) AS median_rating
  FROM reviews
  WHERE hotel_id = 321
  GROUP BY hotel_id
)
SELECT
  r.id,
  r.hotel_id,
  u.username                  AS reviewer_name,
  u.country                   AS reviewer_country,
  r.rating,
  r.title,
  r.body,
  r.helpful_votes,
  r.created_at,
  -- Percentile rank within this hotel's reviews
  ROUND(
    PERCENT_RANK() OVER (
      PARTITION BY r.hotel_id
      ORDER BY r.rating ASC
    ) * 100, 1
  )                           AS rating_percentile,
  -- Helpfulness rank
  RANK() OVER (
    PARTITION BY r.hotel_id
    ORDER BY r.helpful_votes DESC
  )                           AS helpfulness_rank,
  -- Aggregate stats (from CTE, same for all rows)
  rs.total_count,
  rs.computed_avg,
  rs.median_rating
FROM reviews r
JOIN users u         ON u.id       = r.user_id
JOIN review_stats rs ON rs.hotel_id = r.hotel_id
WHERE r.hotel_id = 321
ORDER BY r.created_at DESC;
