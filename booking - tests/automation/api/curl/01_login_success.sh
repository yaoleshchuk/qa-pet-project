#!/bin/bash
curl -X POST https://api.booking.com/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user1@mail.com", "password":"password123"}'
