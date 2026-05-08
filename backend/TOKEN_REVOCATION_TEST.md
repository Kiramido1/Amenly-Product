# Token Revocation Testing Guide

## Changes Made

### 1. Fixed Refresh Endpoint
- Changed `refresh` endpoint to use `revoke_old=True` when creating new tokens
- This ensures old access token is atomically revoked when new one is created
- Removed redundant manual revocation call

### 2. Added Debug Endpoint
- New endpoint: `GET /api/v1/auth/debug/token-status`
- Shows current token status in Redis
- Only available in DEBUG mode
- Helps verify tokens are being stored and blacklisted correctly

## How to Test on Swagger UI

### Prerequisites
1. Make sure Redis is running: `redis-cli ping` (should return PONG)
2. Start the backend: `make run`
3. Open Swagger UI: http://localhost:8001/docs

### Test Scenario 1: Token Refresh

1. **Login**
   - Go to `POST /api/v1/auth/login`
   - Use credentials:
     ```json
     {
       "email": "admin@first.com",
       "password": "AdminPassword123!"
     }
     ```
   - Copy the `access_token` (let's call it **Token A**)
   - Copy the `refresh_token`

2. **Test Token A Works**
   - Click "Authorize" button at top right
   - Paste **Token A** in the Bearer token field
   - Click "Authorize"
   - Go to `GET /api/v1/auth/me`
   - Click "Try it out" → "Execute"
   - Should return your user profile ✅

3. **Check Token Status (Optional)**
   - Go to `GET /api/v1/auth/debug/token-status`
   - Click "Try it out" → "Execute"
   - You should see:
     - `has_active_access_token: true`
     - `has_active_refresh_token: true`
     - `blacklisted_tokens_count: 0` (or more if you tested before)

4. **Refresh Token**
   - Click "Authorize" button and click "Logout" to clear authorization
   - Go to `POST /api/v1/auth/refresh`
   - Click "Try it out"
   - Paste the `refresh_token` from step 1:
     ```json
     {
       "refresh_token": "your_refresh_token_here"
     }
     ```
   - Click "Execute"
   - Copy the new `access_token` (let's call it **Token B**)

5. **Test Token A is Revoked**
   - Click "Authorize" button
   - Paste **Token A** (the OLD token)
   - Click "Authorize"
   - Go to `GET /api/v1/auth/me`
   - Click "Try it out" → "Execute"
   - **Should return 401 Unauthorized** ❌ "Token has been revoked"

6. **Test Token B Works**
   - Click "Authorize" button
   - Paste **Token B** (the NEW token)
   - Click "Authorize"
   - Go to `GET /api/v1/auth/me`
   - Click "Try it out" → "Execute"
   - Should return your user profile ✅

### Test Scenario 2: Logout

1. **Login Again**
   - Go to `POST /api/v1/auth/login`
   - Use same credentials
   - Copy the `access_token` (let's call it **Token C**)

2. **Test Token C Works**
   - Click "Authorize" and paste **Token C**
   - Go to `GET /api/v1/auth/me`
   - Should work ✅

3. **Logout**
   - Go to `POST /api/v1/auth/logout`
   - Click "Try it out" → "Execute"
   - Should return success message

4. **Test Token C is Revoked**
   - Go to `GET /api/v1/auth/me`
   - Click "Try it out" → "Execute"
   - **Should return 401 Unauthorized** ❌ "Token has been revoked"

## Debugging

### Check Redis Directly

```bash
# Connect to Redis
redis-cli -h localhost -p 6379

# See all keys
KEYS *

# Check active tokens for a user (replace UUID with your user ID)
GET active_token:access:8cfaa735-937d-47b5-9f02-42bc135e6c8e

# Check blacklisted tokens
KEYS blacklist:*

# Check a specific blacklist entry
GET blacklist:5cdb10a817b8a6086e57416f93fc759a

# Clear all data (if you want to start fresh)
FLUSHDB
```

### Check Server Logs

The server logs will show detailed information about token operations:
- `✅ Stored access token for user...` - Token was stored
- `✅ Blacklisted old token...` - Old token was revoked
- `🔍 Checking token revocation...` - Token validation in progress
- `⚠️ Token is blacklisted - REVOKED` - Token was found in blacklist
- `✅ Token is valid - NOT in blacklist` - Token is still valid

## Expected Behavior

### ✅ Correct Behavior
- After refresh: Old access token returns 401
- After logout: All tokens return 401
- New tokens work immediately after creation
- Debug endpoint shows correct token status

### ❌ Bug Symptoms (if still present)
- Old access token still works after refresh
- Token still works after logout
- Debug endpoint shows token not in blacklist

## Technical Details

### How Token Revocation Works

1. **Token Storage**
   - Active tokens stored in Redis: `active_token:access:{user_id}`
   - TTL matches token expiration time

2. **Token Revocation**
   - Old token added to blacklist: `blacklist:{token_hash}`
   - Token hash is SHA256 of token (first 32 chars)
   - TTL matches original token expiration

3. **Token Validation**
   - Every request checks if token is in blacklist
   - If in blacklist → 401 Unauthorized
   - If not in blacklist → Allow request

### Redis Keys

- `active_token:access:{user_id}` - Current active access token
- `active_token:refresh:{user_id}` - Current active refresh token
- `blacklist:{token_hash}` - Revoked token (value: "revoked")

## Troubleshooting

### Issue: Old tokens still work

**Possible causes:**
1. Redis not running → Check: `redis-cli ping`
2. Wrong Redis URL in `.env` → Should be `redis://localhost:6379/0` for local dev
3. Token not being blacklisted → Check server logs for "Blacklisted old token"
4. Token validation not checking blacklist → Check logs for "Checking token revocation"

### Issue: New tokens don't work

**Possible causes:**
1. Token not being stored → Check logs for "Stored access token"
2. Token being immediately blacklisted → Check debug endpoint
3. Redis connection issues → Check logs for "Redis connection error"

### Issue: Intermittent behavior

**Possible causes:**
1. Multiple server workers → Each worker has separate Redis connection
2. Race conditions → Check if operations are atomic
3. Redis persistence → Check if Redis is configured correctly

## Next Steps

After testing, if issues persist:
1. Share the server logs (especially lines with 🔍, ✅, ⚠️, ❌)
2. Share output from debug endpoint
3. Share Redis KEYS output
4. Describe exact steps that reproduce the issue
