"""
Lightweight Redis-backed rate limiting for brute-force protection.

Uses the same Redis instance as token revocation (no extra dependency). Fails OPEN
when Redis is unavailable so a Redis outage cannot lock every user out of login.
Disabled entirely when settings.RATE_LIMIT_ENABLED is False (e.g. in tests).
"""

from fastapi import HTTPException, Request, status

from app.core.config import settings


def rate_limit(name: str, limit: int, window_seconds: int):
    """Build a FastAPI dependency enforcing `limit` requests per `window_seconds` per client IP."""

    async def _dependency(request: Request) -> None:
        if not settings.RATE_LIMIT_ENABLED:
            return

        # Imported lazily to reuse the token manager's Redis connection.
        from app.auth.token_manager import token_manager

        redis_client = await token_manager._get_redis()
        if redis_client is None:
            # Fail open — do not block all auth when the limiter store is down.
            return

        client_ip = request.client.host if request.client else "unknown"
        key = f"ratelimit:{name}:{client_ip}"
        try:
            count = await redis_client.incr(key)
            if count == 1:
                await redis_client.expire(key, window_seconds)
            if count > limit:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Too many requests. Please try again later.",
                )
        except HTTPException:
            raise
        except Exception:
            # Any limiter error must not break authentication.
            return

    return _dependency
