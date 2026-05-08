# 🔐 Token Revocation Fix

## المشكلة

عند عمل **refresh token** أو **logout**، الـ access token القديم كان لسه شغال ومش بيتعمله revoke.

### السيناريو:
1. User يعمل login → يحصل على `access_token_1`
2. User يعمل refresh → يحصل على `access_token_2`
3. ❌ **المشكلة**: `access_token_1` لسه شغال ويقدر يستخدمه!

## الحل

### 1. تعديل Refresh Endpoint

**قبل:**
```python
# كان بيعمل revoke بس مش بشكل صحيح
tokens = await auth_service.create_tokens(user.id, revoke_old=True)
```

**بعد:**
```python
# دلوقتي بيعمل revoke صريح للـ old token قبل ما يعمل واحد جديد
await token_manager.revoke_old_access_token(user.id, "")
tokens = await auth_service.create_tokens(user.id, revoke_old=False)
```

### 2. تحديث revoke_old_access_token

**قبل:**
```python
async def revoke_old_access_token(self, user_id: UUID, new_access_token: str):
    # كان لازم يكون في new_token
    ...
    await self.store_active_token(user_id, new_access_token, "access")
```

**بعد:**
```python
async def revoke_old_access_token(self, user_id: UUID, new_access_token: str = ""):
    # دلوقتي ممكن يشتغل بدون new_token
    ...
    if new_access_token:
        await self.store_active_token(user_id, new_access_token, "access")
    else:
        await redis_client.delete(key)  # مجرد حذف
```

## كيف يعمل الآن

### Refresh Token Flow:

```
1. User يبعت refresh_token
   ↓
2. نتحقق إن الـ refresh_token صالح
   ↓
3. نجيب الـ old access_token من Redis
   ↓
4. نحط الـ old access_token في الـ blacklist ✅
   ↓
5. نعمل new access_token
   ↓
6. نخزن الـ new access_token في Redis
   ↓
7. نرجع الـ new tokens للـ user
```

### Logout Flow:

```
1. User يبعت logout request
   ↓
2. نجيب كل الـ active tokens (access + refresh)
   ↓
3. نحط كل الـ tokens في الـ blacklist ✅
   ↓
4. نحذف الـ active tokens من Redis
   ↓
5. نرجع success message
```

## التحقق من الـ Revocation

عند كل request، الـ `get_current_user` dependency بيتحقق:

```python
# 1. Check blacklist (explicit revocation)
is_blacklisted = await redis_client.get(f"blacklist:{token_hash}")
if is_blacklisted:
    return True  # Token is revoked ❌

# 2. Check active token
active_token = await redis_client.get(f"active_token:access:{user_id}")
if active_token != current_token:
    return True  # Token is revoked ❌

# 3. Token is valid ✅
return False
```

## Redis Keys Structure

### Active Tokens:
```
active_token:access:{user_id}  → current_access_token
active_token:refresh:{user_id} → current_refresh_token
```

### Blacklist:
```
blacklist:{token_hash} → "revoked"
```

**Token Hash**: SHA256 hash (أول 32 حرف) من الـ token

## مثال عملي

### 1. Login
```bash
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "access_token": "eyJhbGc...",  # token_1
  "refresh_token": "eyJhbGc..."
}

Redis:
active_token:access:user_id → token_1
```

### 2. Refresh
```bash
POST /api/v1/auth/refresh
{
  "refresh_token": "eyJhbGc..."
}

Response:
{
  "access_token": "eyJhbGc...",  # token_2 (new)
  "refresh_token": "eyJhbGc..."
}

Redis:
blacklist:hash(token_1) → "revoked"  ✅ OLD TOKEN REVOKED
active_token:access:user_id → token_2
```

### 3. Try to use old token
```bash
GET /api/v1/auth/me
Authorization: Bearer token_1  # OLD TOKEN

Response: 401 Unauthorized
{
  "detail": "Token has been revoked"
}
```

### 4. Use new token
```bash
GET /api/v1/auth/me
Authorization: Bearer token_2  # NEW TOKEN

Response: 200 OK
{
  "user": {...}
}
```

## الفوائد

### 1. Security ✅
- Old tokens لا يمكن استخدامها بعد refresh
- Logout يعمل revoke لكل الـ tokens
- Token hijacking أصعب

### 2. User Experience ✅
- Seamless token refresh
- Single active session per user
- Clear logout behavior

### 3. Performance ✅
- Redis caching سريع
- Token validation في milliseconds
- Automatic expiration (TTL)

## Testing

### Test Refresh Revocation:
```bash
# 1. Login
TOKEN1=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@first.com","password":"Admin@123"}' \
  | jq -r '.access_token')

# 2. Verify token works
curl -H "Authorization: Bearer $TOKEN1" http://localhost:8001/api/v1/auth/me
# Should return user data ✅

# 3. Refresh token
REFRESH=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@first.com","password":"Admin@123"}' \
  | jq -r '.refresh_token')

TOKEN2=$(curl -s -X POST http://localhost:8001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\":\"$REFRESH\"}" \
  | jq -r '.access_token')

# 4. Try old token (should fail)
curl -H "Authorization: Bearer $TOKEN1" http://localhost:8001/api/v1/auth/me
# Should return 401 ❌

# 5. Try new token (should work)
curl -H "Authorization: Bearer $TOKEN2" http://localhost:8001/api/v1/auth/me
# Should return user data ✅
```

### Test Logout Revocation:
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@first.com","password":"Admin@123"}' \
  | jq -r '.access_token')

# 2. Logout
curl -X POST http://localhost:8001/api/v1/auth/logout \
  -H "Authorization: Bearer $TOKEN"

# 3. Try to use token (should fail)
curl -H "Authorization: Bearer $TOKEN" http://localhost:8001/api/v1/auth/me
# Should return 401 ❌
```

## الملفات المعدلة

1. **app/auth/router.py**
   - تعديل `refresh_token` endpoint
   - إضافة explicit revocation قبل create_tokens

2. **app/auth/token_manager.py**
   - تحديث `revoke_old_access_token` لدعم revocation بدون new token
   - إضافة optional parameter للـ new_access_token

## Status

✅ **Fixed** - Old access tokens are now properly revoked on refresh and logout

**Date**: May 8, 2026
**Commit**: `fix: properly revoke old access tokens on refresh and logout`
