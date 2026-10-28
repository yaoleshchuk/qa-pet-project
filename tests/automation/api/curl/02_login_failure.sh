#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.bash"
reset_mock; request POST /api/login '{"email":"fake@example.com","password":"wrong_password"}'; expect_status 401
json_assert "data.error && data.error.code === 'INVALID_CREDENTIALS'" 'invalid login must return the documented error envelope'
echo 'PASS: login rejection'
