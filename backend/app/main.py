import time

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logging import get_logger
from app.websocket.router import router as websocket_router

# Initialize logger
logger = get_logger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Amenly AI GRC Platform - Production API",
    version="1.0.1",
    # Expose the OpenAPI schema / interactive docs only when DEBUG or ENABLE_DOCS is on.
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if (settings.DEBUG or settings.ENABLE_DOCS) else None,
    docs_url="/docs" if (settings.DEBUG or settings.ENABLE_DOCS) else None,
    redoc_url="/redoc" if (settings.DEBUG or settings.ENABLE_DOCS) else None,
)


# Centralized Error Handling
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Build a SANITIZED error list. We deliberately drop Pydantic's `input` key,
    # which echoes the raw submitted value (e.g. a plaintext password) — it must
    # never be logged or returned to the client.
    errors = []
    for error in exc.errors():
        loc = [
            part.decode("utf-8") if isinstance(part, bytes) else part
            for part in error.get("loc", [])
        ]
        errors.append(
            {
                "loc": loc,
                "type": error.get("type"),
                "msg": error.get("msg"),
            }
        )

    logger.warning(
        "validation_error",
        path=request.url.path,
        method=request.method,
        errors=errors,
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": "Validation Error",
            "errors": errors,
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "unhandled_exception",
        path=request.url.path,
        method=request.method,
        error=str(exc),
        exc_info=True,
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal Server Error",
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred",
        },
    )


# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.middleware("http")
async def add_security_and_timing_headers(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)

    # Security headers (clickjacking, MIME sniffing, referrer leakage).
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    # Swagger UI / ReDoc load assets from a CDN, so they need a relaxed CSP; every
    # other route keeps the strict default-deny policy.
    if request.url.path in ("/docs", "/redoc"):
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "img-src 'self' data: https://fastapi.tiangolo.com; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "worker-src 'self' blob:"
        )
    else:
        response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    if not settings.DEBUG:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

    # Processing-time header is a minor timing oracle; expose it only in debug.
    if settings.DEBUG:
        response.headers["X-Process-Time"] = str(time.time() - start_time)
    return response


@app.on_event("startup")
async def startup_event():
    """Application startup event"""
    logger.info(
        "application_startup",
        project=settings.PROJECT_NAME,
        debug=settings.DEBUG,
        version="1.0.1",
    )


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown event"""
    logger.info("application_shutdown")


@app.get("/")
async def root():
    """Root endpoint - Welcome message"""
    return {"message": "Welcome to Amenly Backend! 🛡️"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": time.time(), "version": "1.0.1"}


app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(websocket_router, prefix="/ws")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
