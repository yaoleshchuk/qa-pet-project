-- ─────────────────────────────────────────────────────────────────────────────
-- Test:    Login API – Success
-- Purpose: Verify the user record exists, is active, and has a session token
--          created after the successful login API call.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Confirm user exists and is active
SELECT
  u.id,
  u.email,
  u.status,
  u.email_verified_at,
  u.created_at,
  COUNT(s.id)  AS active_sessions,
  MAX(s.created_at) AS last_login_at
FROM users u
LEFT JOIN user_sessions s
  ON s.user_id = u.id
  AND s.expires_at > NOW()
WHERE u.email = 'user1@mail.com'
  AND u.status = 'active'
GROUP BY u.id, u.email, u.status, u.email_verified_at, u.created_at;

-- 2. Confirm the most recent token was issued within the last 5 minutes
SELECT
  t.id,
  t.user_id,
  t.token_hash,
  t.issued_at,
  t.expires_at,
  CASE
    WHEN t.issued_at >= NOW() - INTERVAL '5 minutes' THEN 'FRESH'
    ELSE 'STALE'
  END AS token_freshness
FROM auth_tokens t
JOIN users u ON u.id = t.user_id
WHERE u.email    = 'user1@mail.com'
  AND t.revoked  = false
ORDER BY t.issued_at DESC
LIMIT 1;
