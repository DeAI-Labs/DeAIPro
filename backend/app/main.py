"""
DeAIPro Backend - FastAPI Entry Point
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import structlog
import firebase_admin
from firebase_admin import credentials
import os

from config.settings import settings
from middleware.logging import setup_logging
from dependencies.db import db
from dependencies.scheduler import scheduler
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

setup_logging()
logger = structlog.get_logger(__name__)

if settings.sentry_dsn_backend:
    sentry_logging = LoggingIntegration(
        level=os.environ.get("SENTRY_LOG_LEVEL", "INFO"), event_level=None
    )
    sentry_sdk.init(
        dsn=settings.sentry_dsn_backend,
        integrations=[FastApiIntegration(), sentry_logging],
        traces_sample_rate=0.1,
        environment=settings.environment,
    )


def init_firebase():
    try:
        if settings.google_application_credentials and os.path.exists(
            settings.google_application_credentials
        ):
            cred = credentials.Certificate(settings.google_application_credentials)
            if not firebase_admin._apps:
                firebase_admin.initialize_app(cred)
            logger.info("✓ Firebase Admin initialized")
        else:
            logger.warning("⚠️ Firebase credentials not found, proceeding without auth")
    except Exception as e:
        logger.error(f"Firebase initialization failed: {e}")
        if settings.environment == "production":
            raise


app = FastAPI(
    title="DeAIPro API",
    description="Real-time Bittensor analytics and intelligence platform",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

# Rate Limiting
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[settings.rate_limit_default] if settings.rate_limit_enabled else [],
)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    logger.warning("Rate limit exceeded", remote_addr=get_remote_address(request))
    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Too many requests. Please try again later.",
    )


# CORS — allow Vercel frontend + local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://deai-zeta.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes — all mounted under /api prefix ────────────────────────────────────
from api.routes import public, auth, admin, health

app.include_router(health.router,  prefix="/api")
app.include_router(public.router,  prefix="/api")
app.include_router(auth.router,    prefix="/api")
app.include_router(admin.router,   prefix="/api")


# Startup / Shutdown
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 DeAIPro starting up...")
    init_firebase()
    try:
        await db.connect()
    except Exception as e:
        logger.error(f"Failed to connect to database: {e}")
        raise
    try:
        await scheduler.start()
    except Exception as e:
        logger.error(f"Failed to start background scheduler: {e}")
        raise
    logger.info("✓ All services initialized")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 DeAIPro shutting down...")
    await scheduler.stop()
    await db.disconnect()


# Root redirect to docs
@app.get("/")
async def root():
    return {"message": "DeAIPro API", "docs": "/api/docs", "health": "/api/health"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.environment == "development",
        log_level="info",
    )