#!/bin/bash
curl -X POST https://api.booking.com/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"fake@mail.com", "password":"wrong123"}'
