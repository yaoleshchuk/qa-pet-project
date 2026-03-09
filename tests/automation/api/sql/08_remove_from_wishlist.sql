-- ─────────────────────────────────────────────────────────────────────────────
-- Test:    Remove Hotel from Wishlist
-- Purpose: Verify the wishlist entry no longer exists and that the audit log
--          records the removal action.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Confirm entry was removed (must return 0)
SELECT
  COUNT(*) AS remaining_entries
FROM wishlist
WHERE user_id  = 1
  AND hotel_id = 123;

-- 2. Verify the REMOVED action is in the audit log
SELECT
  wa.id,
  wa.user_id,
  wa.hotel_id,
  wa.action,
  wa.performed_at,
  LAG(wa.action) OVER (
    PARTITION BY wa.user_id, wa.hotel_id
    ORDER BY wa.performed_at
  ) AS previous_action          -- should be 'ADDED'
FROM wishlist_audit wa
WHERE wa.user_id   = 1
  AND wa.hotel_id  = 123
ORDER BY wa.performed_at DESC
LIMIT 5;
