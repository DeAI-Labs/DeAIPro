"""
DeAIPro Backend - FastAPI Entry Point
"""

from contextlib import asynccontextmanager
import json
import time
import threading

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

def _agent_log(hypothesisId: str, location: str, message: str, data: dict | None = None, runId: str = "pre-fix"):
    # #region agent log
    try:
        payload = {
            "id": f"log_{int(time.time() * 1000)}_{os.getpid()}",
            "timestamp": int(time.time() * 1000),
            "runId": runId,
            "hypothesisId": hypothesisId,
            "location": location,
            "message": message,
            "data": data or {},
        }
        with open("/home/ciarrai/Documents/DeAI/.cursor/debug.log", "a", encoding="utf-8") as f:
            f.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except Exception:
        pass
    # #endregion agent log

_agent_log(
    "H1",
    "backend/app/main.py:module",
    "Imported backend/app/main.py",
    data={"pid": os.getpid(), "thread": threading.current_thread().name},
)

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    _agent_log(
        "H3",
        "backend/app/main.py:lifespan",
        "lifespan start entered",
        data={
            "pid": os.getpid(),
            "thread": threading.current_thread().name,
            "loop_running": asyncio.get_running_loop() is not None,
        },
    )
    logger.info("🚀 DeAIPro starting up...")
    init_firebase()
    try:
        await db.connect()
    except Exception as e:
        _agent_log("H4", "backend/app/main.py:lifespan", "db.connect failed", data={"error": str(e)})
        logger.error(f"Failed to connect to database: {e}")
        raise
    try:
        await scheduler.start()
    except Exception as e:
        _agent_log("H2", "backend/app/main.py:lifespan", "scheduler.start failed", data={"error": str(e)})
        logger.error(f"Failed to start background scheduler: {e}")
        raise
    logger.info("✓ All services initialized")

    yield

    logger.info("🛑 DeAIPro shutting down...")
    await scheduler.stop()
    await db.disconnect()


app = FastAPI(
    title="DeAIPro API",
    description="Real-time Bittensor analytics and intelligence platform",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
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

# ── Routes — all mounted under /api prefix ────────────────────────────────────
from api.routes import public, auth, admin, health

app.include_router(health.router,  prefix="/api")
app.include_router(public.router,  prefix="/api")
app.include_router(auth.router,    prefix="/api")
app.include_router(admin.router,   prefix="/api")


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