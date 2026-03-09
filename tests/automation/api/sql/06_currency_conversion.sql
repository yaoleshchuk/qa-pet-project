-- ─────────────────────────────────────────────────────────────────────────────
-- Test:    Currency Conversion
-- Purpose: Verify currency rates are current (updated within the last hour)
--          and that the converted hotel prices are mathematically correct.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Confirm rates exist and are fresh
SELECT
  cr.currency_code,
  cr.currency_symbol,
  cr.rate_to_eur,
  cr.updated_at,
  EXTRACT(EPOCH FROM (NOW() - cr.updated_at)) / 60 AS age_minutes,
  CASE
    WHEN cr.updated_at < NOW() - INTERVAL '1 hour' THEN 'STALE – test may fail'
    ELSE 'FRESH'
  END AS freshness
FROM currency_rates cr
WHERE cr.currency_code IN ('USD', 'EUR', 'GBP')
ORDER BY cr.currency_code;

-- 2. Spot-check a single hotel price conversion for accuracy
SELECT
  h.id,
  h.name,
  h.price_per_night                                       AS base_price_eur,
  cr.currency_code,
  cr.currency_symbol,
  cr.rate_to_eur,
  ROUND(h.price_per_night * cr.rate_to_eur, 2)           AS expected_converted_price
FROM hotels h
CROSS JOIN currency_rates cr
WHERE h.id               = 321
  AND cr.currency_code IN ('USD', 'GBP');
