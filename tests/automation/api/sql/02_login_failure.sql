-- ─────────────────────────────────────────────────────────────────────────────
-- Test:    Login API – Failure
-- Purpose: Verify that failed login attempts are recorded and that no session
--          token is created for invalid credentials.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Confirm failed attempt is logged with brute-force detection metadata
SELECT
  la.id,
  la.email_attempted,
  la.ip_address,
  la.attempted_at,
  la.failure_reason,
  COUNT(*) OVER (
    PARTITION BY la.email_attempted, la.ip_address
    ORDER BY la.attempted_at
    RANGE BETWEEN INTERVAL '15 minutes' PRECEDING AND CURRENT ROW
  ) AS attempts_last_15_min,
  CASE
    WHEN COUNT(*) OVER (PARTITION BY la.email_attempted)
         >= 5 THEN 'RATE_LIMITED'
    ELSE 'ALLOWED'
  END AS account_status
FROM login_attempts la
WHERE la.email_attempted = 'fake@mail.com'
ORDER BY la.attempted_at DESC
LIMIT 10;

-- 2. Confirm no auth token was created for this email
SELECT COUNT(*) AS orphan_tokens
FROM auth_tokens t
JOIN users u ON u.id = t.user_id
WHERE u.email  = 'fake@mail.com'
  AND t.issued_at >= NOW() - INTERVAL '5 minutes';
