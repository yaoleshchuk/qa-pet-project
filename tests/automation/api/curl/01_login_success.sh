#!/usr/bin/env bash
source "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/common.bash"
reset_mock; request POST /api/login '{"email":"testuser@example.com","password":"correct_password"}'; expect_status 200
json_assert "typeof data.token === 'string' && data.token.length > 0 && data.user && data.user.email === 'testuser@example.com'" 'successful login must return a token and fixture user'
echo 'PASS: login success'
