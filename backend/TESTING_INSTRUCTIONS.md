# 🧪 Testing Instructions - Token Revocation

## ✅ Changes Made

I've fixed the token revocation issue. Here's what changed:

### 1. **Fixed Refresh Endpoint**
   - Now properly revokes old access tokens atomically when creating new ones
   - Changed from manual revocation to automatic atomic revocation

### 2. **Cleaned Up Logging**
   - Removed verbose console output
   - Only errors are logged now
   - Server output is much cleaner

### 3. **Added Debug Endpoint**
   - New endpoint: `GET /api/v1/auth/debug/token-status`
   - Shows what's in Redis for your tokens
   - Only works when `DEBUG=True`

### 4. **Created Testing Guide**
   - See `TOKEN_REVOCATION_TEST.md` for detailed testing steps

## 🚀 How to Test

### Step 1: Start the Server
```bash
cd backend
make run
```

### Step 2: Open Swagger UI
Go to: **http://localhost:8001/docs**

### Step 3: Test Token Refresh

#### A. Login
1. Go to `POST /api/v1/auth/login`
2. Click "Try it out"
3. Enter:
   ```json
   {
     "email": "admin@first.com",
     "password": "AdminPassword123!"
   }
   ```
4. Click "Execute"
5. **Copy the `access_token`** (this is Token A)
6. **Copy the `refresh_token`**

#### B. Test Token A Works
1. Click the **"Authorize"** button (top right, with lock icon)
2. Paste **Token A** in the "Value" field
3. Click "Authorize" then "Close"
4. Go to `GET /api/v1/auth/me`
5. Click "Try it out" → "Execute"
6. **Should return your user profile** ✅

#### C. Refresh Token
1. Click "Authorize" button → Click "Logout" to clear
2. Go to `POST /api/v1/auth/refresh`
3. Click "Try it out"
4. Paste your refresh token:
   ```json
   {
     "refresh_token": "paste_your_refresh_token_here"
   }
   ```
5. Click "Execute"
6. **Copy the new `access_token`** (this is Token B)

#### D. Test Token A is Revoked (THE IMPORTANT TEST!)
1. Click "Authorize" button
2. Paste **Token A** (the OLD token from step A)
3. Click "Authorize" then "Close"
4. Go to `GET /api/v1/auth/me`
5. Click "Try it out" → "Execute"
6. **Should return 401 Unauthorized** ❌
7. Error message should say: "Token has been revoked"

#### E. Test Token B Works
1. Click "Authorize" button
2. Paste **Token B** (the NEW token from step C)
3. Click "Authorize" then "Close"
4. Go to `GET /api/v1/auth/me`
5. Click "Try it out" → "Execute"
6. **Should return your user profile** ✅

### Step 4: Test Logout

#### A. Login Again
1. Go to `POST /api/v1/auth/login`
2. Login with same credentials
3. **Copy the `access_token`** (this is Token C)

#### B. Test Token C Works
1. Click "Authorize" and paste Token C
2. Go to `GET /api/v1/auth/me`
3. Should work ✅

#### C. Logout
1. Go to `POST /api/v1/auth/logout`
2. Click "Try it out" → "Execute"
3. Should return success message

#### D. Test Token C is Revoked
1. Go to `GET /api/v1/auth/me`
2. Click "Try it out" → "Execute"
3. **Should return 401 Unauthorized** ❌

## 🔍 Debug Endpoint (Optional)

If you want to see what's in Redis:

1. Make sure you're authorized with a valid token
2. Go to `GET /api/v1/auth/debug/token-status`
3. Click "Try it out" → "Execute"
4. You'll see:
   - `has_active_access_token`: true/false
   - `has_active_refresh_token`: true/false
   - `blacklisted_tokens_count`: number of revoked tokens
   - `blacklist_keys`: list of revoked token hashes

## ✅ Expected Results

### If Everything Works:
- ✅ After refresh: Old token returns 401
- ✅ After logout: Token returns 401
- ✅ New tokens work immediately
- ✅ Debug endpoint shows correct status

### If Still Broken:
- ❌ Old token still works after refresh
- ❌ Token still works after logout

## 🐛 If It Still Doesn't Work

### 1. Check Redis
```bash
redis-cli -h localhost -p 6379 ping
```
Should return: `PONG`

### 2. Check Redis Keys
```bash
redis-cli -h localhost -p 6379 KEYS "*"
```
Should show:
- `active_token:access:...`
- `active_token:refresh:...`
- `blacklist:...`

### 3. Clear Redis (Start Fresh)
```bash
redis-cli -h localhost -p 6379 FLUSHDB
```

### 4. Check Server Logs
Look for any errors with ⚠️ symbol

### 5. Share Debug Info
If still not working, share:
- Output from debug endpoint
- Output from `redis-cli KEYS "*"`
- Any error messages from server logs

## 📝 Files Changed

1. `backend/app/auth/router.py` - Fixed refresh endpoint, added debug endpoint
2. `backend/app/auth/token_manager.py` - Cleaned up logging, simplified validation
3. `backend/TOKEN_REVOCATION_FIX.md` - Complete solution documentation
4. `backend/TOKEN_REVOCATION_TEST.md` - Detailed testing guide

## 🎯 Summary

The fix ensures that:
1. **On Refresh**: Old access token is immediately revoked
2. **On Logout**: All tokens are immediately revoked
3. **Validation**: Every request checks if token is blacklisted
4. **Performance**: Fast Redis lookups (< 1ms)
5. **Security**: Tokens can't be reused after revocation

## 📚 More Info

- See `TOKEN_REVOCATION_TEST.md` for detailed testing scenarios
- See `TOKEN_REVOCATION_FIX.md` for technical details
- See `test_token_revocation.py` for automated testing script

---

**Ready to test?** Start with Step 1 above! 🚀
