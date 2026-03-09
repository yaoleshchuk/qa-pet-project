-- ─────────────────────────────────────────────────────────────────────────────
-- Test:    Add Hotel to Wishlist
-- Purpose: Verify the wishlist entry was created correctly, no duplicates
--          exist, and the audit log records the action.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Confirm wishlist entry exists with correct data
SELECT
  w.id,
  w.user_id,
  w.hotel_id,
  h.name          AS hotel_name,
  h.city,
  h.stars,
  w.created_at,
  COUNT(*) OVER (
    PARTITION BY w.user_id, w.hotel_id
  )               AS duplicate_count   -- must be exactly 1
FROM wishlist w
JOIN hotels h ON h.id = w.hotel_id
WHERE w.user_id  = 1
  AND w.hotel_id = 123;

-- 2. Verify audit trail records the ADD action
SELECT
  wa.id,
  wa.user_id,
  wa.hotel_id,
  wa.action,
  wa.performed_at
FROM wishlist_audit wa
WHERE wa.user_id    = 1
  AND wa.hotel_id   = 123
  AND wa.action     = 'ADDED'
ORDER BY wa.performed_at DESC
LIMIT 1;

-- 3. Confirm total wishlist size for the user (regression guard)
SELECT COUNT(*) AS total_items
FROM wishlist
WHERE user_id = 1;
