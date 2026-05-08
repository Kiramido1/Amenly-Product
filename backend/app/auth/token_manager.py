"""
Token Management with Revocation Support
Tracks active tokens and revokes old ones when new tokens are issued
"""

from typing import Optional
from datetime import datetime, timedelta, timezone
from uuid import UUID
import hashlib
import redis.asyncio as redis
from jose import jwt, JWTError
from app.core.config import settings


class TokenManager:
    """Manages JWT tokens with revocation support using Redis"""
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
    
    def _token_hash(self, token: str) -> str:
        """Create a hash of the token for use as Redis key"""
        return hashlib.sha256(token.encode()).hexdigest()[:32]
    
    async def _get_redis(self) -> Optional[redis.Redis]:
        """Get or create Redis connection"""
        if self.redis_client is None:
            try:
                self.redis_client = redis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True
                )
                # Test connection
                await self.redis_client.ping()
            except Exception as e:
                print(f"⚠️  Redis connection error: {e}")
                self.redis_client = None
        return self.redis_client
    
    async def store_active_token(
        self, 
        user_id: UUID, 
        access_token: str, 
        token_type: str = "access"
    ) -> None:
        """
        Store active token in Redis
        
        Args:
            user_id: User UUID
            access_token: JWT token string
            token_type: 'access' or 'refresh'
        """
        redis_client = await self._get_redis()
        if not redis_client:
            print("⚠️  Redis not available, skipping token storage")
            return
        
        try:
            # Decode token to get expiration
            payload = jwt.decode(
                access_token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM]
            )
            exp = payload.get("exp")
            
            if exp:
                # Calculate TTL (time to live)
                exp_datetime = datetime.fromtimestamp(exp, tz=timezone.utc)
                ttl = int((exp_datetime - datetime.now(timezone.utc)).total_seconds())
                
                if ttl > 0:
                    # Store token with user_id as key
                    key = f"active_token:{token_type}:{user_id}"
                    await redis_client.setex(
                        key,
                        ttl,
                        access_token
                    )
                    print(f"✅ Stored {token_type} token for user {user_id} (TTL: {ttl}s)")
        except Exception as e:
            print(f"Error storing token: {e}")
    
    async def revoke_user_tokens(self, user_id: UUID) -> None:
        """
        Revoke all active tokens for a user
        
        Args:
            user_id: User UUID
        """
        redis_client = await self._get_redis()
        if not redis_client:
            return
        
        try:
            # Get current tokens before deleting
            access_key = f"active_token:access:{user_id}"
            refresh_key = f"active_token:refresh:{user_id}"
            
            access_token = await redis_client.get(access_key)
            refresh_token = await redis_client.get(refresh_key)
            
            # Add tokens to blacklist using hash
            if access_token:
                blacklist_key = f"blacklist:{self._token_hash(access_token)}"
                await redis_client.setex(
                    blacklist_key,
                    settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                    "revoked"
                )
                print(f"✅ Blacklisted access token for user {user_id}")
            
            if refresh_token:
                blacklist_key = f"blacklist:{self._token_hash(refresh_token)}"
                await redis_client.setex(
                    blacklist_key,
                    settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
                    "revoked"
                )
                print(f"✅ Blacklisted refresh token for user {user_id}")
            
            # Delete active tokens
            await redis_client.delete(access_key, refresh_key)
            
        except Exception as e:
            print(f"Error revoking tokens: {e}")
    
    async def is_token_revoked(self, token: str, user_id: UUID) -> bool:
        """
        Check if a token has been revoked
        
        Args:
            token: JWT token string
            user_id: User UUID
            
        Returns:
            True if token is revoked, False if still valid
        """
        redis_client = await self._get_redis()
        if not redis_client:
            # If Redis is not available, assume token is valid (no revocation)
            return False
        
        try:
            # First check blacklist using hash - THIS IS THE PRIMARY CHECK
            blacklist_key = f"blacklist:{self._token_hash(token)}"
            is_blacklisted = await redis_client.get(blacklist_key)
            if is_blacklisted:
                print(f"⚠️  Token is blacklisted")
                return True
            
            # If not in blacklist, token is valid
            # We don't need to check active_token because:
            # 1. Blacklist is the source of truth for revoked tokens
            # 2. active_token is just for tracking, not validation
            return False
            
        except JWTError:
            # Invalid token
            return True
        except Exception as e:
            # On error, assume token is valid to avoid blocking users
            print(f"Error checking token revocation: {e}")
            return False
    
    async def revoke_old_access_token(self, user_id: UUID, new_access_token: str = "") -> None:
        """
        Revoke old access token when issuing a new one
        
        Args:
            user_id: User UUID
            new_access_token: New JWT access token (optional, if empty just revoke old)
        """
        redis_client = await self._get_redis()
        if not redis_client:
            return
        
        try:
            # Get old token
            key = f"active_token:access:{user_id}"
            old_token = await redis_client.get(key)
            
            if old_token:
                # Add old token to blacklist using hash
                blacklist_key = f"blacklist:{self._token_hash(old_token)}"
                await redis_client.setex(
                    blacklist_key,
                    settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,  # TTL in seconds
                    "revoked"
                )
                print(f"✅ Revoked old access token for user {user_id}")
            
            # Store new token if provided
            if new_access_token:
                await self.store_active_token(user_id, new_access_token, "access")
            else:
                # Just delete the active token key
                await redis_client.delete(key)
            
        except Exception as e:
            print(f"Error revoking old token: {e}")
    
    async def is_token_explicitly_revoked(self, token: str) -> bool:
        """
        Check if token is in the explicit blacklist
        
        Args:
            token: JWT token string
            
        Returns:
            True if explicitly revoked
        """
        redis_client = await self._get_redis()
        if not redis_client:
            return False
        
        try:
            blacklist_key = f"blacklist:{self._token_hash(token)}"
            result = await redis_client.get(blacklist_key)
            return result == "revoked"
        except Exception as e:
            print(f"Error checking explicit revocation: {e}")
            return False
    
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()


# Global token manager instance
token_manager = TokenManager()
