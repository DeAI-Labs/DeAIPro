from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import firebase_admin
from firebase_admin import credentials, auth
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import structlog
import os
import asyncio
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Import static fallback data
from data import subnets as static_subnets, news as static_news, research as static_research, lessons as static_lessons

# Import cache and dynamic data functions
from cache import init_cache, close_cache, get_cache, set_cache
from dynamic import (
    fetch_tao_price,
    fetch_subnet_tokens_from_coingecko,
    fetch_subnets_from_taostats,
    fetch_all_subnet_data,
    fetch_all_news,
    fetch_github_commits,
)
load_dotenv()

# Logging Configuration
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.format_exc_info,
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)
logger = structlog.get_logger(__name__)

# Firebase Admin
try:
    if not firebase_admin._apps:
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialized")
        else:
            logger.warning(f"Firebase credentials not found at {cred_path}")
except Exception as e:
    logger.error(f"Firebase initialization failed: {e}")

# FastAPI App & Middleware
app = FastAPI(
    title="DeAIPro API",
    description="Real-time Bittensor analytics and intelligence platform",
    version="1.0.0"
)

# Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    logger.warning("Rate limit exceeded", remote_addr=get_remote_address(request))
    raise HTTPException(status_code=429, detail="Too many requests. Please try again later.")


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://de-ai-pro.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication
security = HTTPBearer()

# Lifecycle Events
async def startup_event():
    logger.info("🚀 DeAIPro starting up...")
    try:
        await init_cache()
        logger.info("✓ MongoDB cache initialized")
    except Exception as e:
        logger.error(f"⚠️ Cache initialization failed: {e}")
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 DeAIPro shutting down...")
    await close_cache()

# Auth Helpers and Dependencies
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        user = auth.verify_id_token(credentials.credentials)
        logger.debug("User verified", user_id=user.get("uid"))
        return user
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid token: {e}")

async def require_admin(user: dict = Depends(get_current_user)):
    email = user.get("email", "").lower()
    if not email.endswith("@deaistrategies.io"):
        logger.warning(f"Admin access denied for {email}")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    logger.info(f"Admin action by {email}")
    return user

async def get_optional_user(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        user = auth.verify_id_token(token)
        logger.debug("Optional user verified", user_id=user.get("uid"))
        return user
    except Exception:
        return None

# Pydantic Models
class AccessRequest(BaseModel):
    email: EmailStr
class AccessApproval(BaseModel):
    email: EmailStr

# ENDPOINTS: Public
@app.get("/api/health")
@limiter.limit("100/minute")
async def health_check(request: Request):
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "DeAIPro",
        "version": "1.0.0"
    }

# Statistics
@app.get("/api/stats")
@limiter.limit("100/minute")
async def get_stats(request: Request):
    try:
        # Fetch price data
        tao_data = await fetch_tao_price()
        if not tao_data:
            # Fallback
            tao_data = {
                "tao_price": 180.80,
                "market_cap": 1280000000,
                "volume_24h": 8400000,
                "tao_price_change_24h": 0.0,
                "tao_price_btc": 0.00065,
                "source": "fallback"
            }

        # Calculate aggregates
        sum_alpha_mc = sum(v.get("market_cap_millions", 0) for v in cg_data.values())
        total_ecosystem_mc = (tao_data["market_cap"] / 1e6) + sum_alpha_mc
        active_subnets = len(cg_data) if cg_data else len([s for s in static_subnets if s.get("em", 0) > 0])
        logger.info("Stats retrieved", subnets=active_subnets, source=tao_data.get("source", "unknown"))
        return {
            "tao_price": tao_data["tao_price"],
            "tao_price_btc": tao_data.get("tao_price_btc", 0),
            "market_cap": tao_data["market_cap"],
            "volume_24h": tao_data["volume_24h"],
            "tao_price_change_24h": tao_data.get("tao_price_change_24h", 0),
            "volume_change_24h": 0.0,
            "active_subnets": active_subnets,
            "sum_alpha_mc": round(sum_alpha_mc, 2),
            "total_ecosystem_mc": round(total_ecosystem_mc, 2),
            "source": tao_data.get("source", "unknown"),
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Stats endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch stats")

# Fetching Subnets
@app.get("/api/subnets")
@limiter.limit("100/minute")
async def get_subnets(request: Request, detailed: bool = False):
    try:
        user = await get_optional_user(request)
        is_authenticated = user is not None
        # Fetch data concurrently
        all_subnet_data, tao_data = await asyncio.gather(
            fetch_all_subnet_data(),
            fetch_tao_price(),
            return_exceptions=True
        )
        # Handle exceptions
        if isinstance(all_subnet_data, Exception):
            logger.warning(f"Dynamic subnet fetch failed: {all_subnet_data}, using fallback")
            all_subnet_data = {}
        if isinstance(tao_data, Exception):
            tao_data = {"tao_price": 180.80}
        tao_price = tao_data.get("tao_price", 180.80)

        # Merge static data with dynamic data
        enriched = []
        for s in static_subnets:
            subnet_id = s["id"]
            merged = dict(s)
            merged["authenticated"] = is_authenticated
            merged["tao_price"] = tao_price

            # Layer in dynamic data if available
            if subnet_id in all_subnet_data:
                dyn = all_subnet_data[subnet_id]
                merged.update(dyn)
                merged["live"] = True
            enriched.append(merged)

        # Sort by market cap (mc field)
        enriched.sort(key=lambda x: x.get("mc", 0), reverse=True)
        logger.info(f"Subnets retrieved", count=len(enriched), authenticated=is_authenticated)
        return enriched
    except Exception as e:
        logger.error(f"Subnets endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch subnets")

# Fetching News
@app.get("/api/news")
@limiter.limit("100/minute")
async def get_news(request: Request):
    try:
        news = await fetch_all_news()
        if not news:
            logger.info("Using static news fallback")
            news = static_news
        logger.info("News retrieved", count=len(news))
        return news
    except Exception as e:
        logger.error(f"News endpoint error: {e}")
        # Return static fallback
        return static_news

# Research articles on Bittnsor economics , trends and analysis
@app.get("/api/research")
@limiter.limit("100/minute")
async def get_research(request: Request):
    return static_research

# Educaional Modules
@app.get("/api/lessons")
@limiter.limit("100/minute")
async def get_lessons(request: Request):
    return static_lessons

# TAO/USD Price Data
@app.get("/api/historical/tao")
@limiter.limit("50/minute")
async def get_historical_tao(request: Request, days: int = 30):
    cache_key = f"historical_tao_{days}"
    cached = await get_cache(cache_key, max_age_mins=60)
    if cached:
        return cached

# Request Access Authentication
@app.post("/api/request-access")
@limiter.limit("10/minute")
async def request_access(request: Request, body: AccessRequest):
    email = body.email.lower().strip()
    logger.info(f"Access requested", email=email)
    return {
        "success": True,
        "message": f"Access request submitted for {email}. Admin will review and send login link.",
        "email": email
    }

# Details on Subnets
@app.get("/api/subnets-detailed")
async def get_subnets_detailed(request: Request, user: dict = Depends(get_current_user)):
    logger.info("Detailed subnets requested", user_id=user.get("uid"))
    # Return full subnets list with additional premium fields
    subnets = await get_subnets(request, detailed=True)
    return {
        "authenticated": True,
        "subnets": subnets,
        "timestamp": datetime.utcnow().isoformat(),
    }

# Admin Approval
@app.post("/api/admin/approve-access")
async def admin_approve_access(
    body: AccessApproval,
    admin: dict = Depends(require_admin)
):
    email = body.email.lower().strip()
    try:
        # Try to get or create Firebase user
        try:
            user_record = auth.get_user_by_email(email)
        except Exception:
            user_record = auth.create_user(
                email=email,
                email_verified=False,
                disabled=False
            )
        # Generate password reset link (24hr expiry in Firebase)
        reset_link = auth.generate_password_reset_link(email)
        logger.info(f"Access approved", email=email, admin=admin.get("email"))
        return {
            "success": True,
            "message": f"Access approved for {email}",
            "uid": user_record.uid,
            "reset_link": reset_link,  # Send via email service
            "expires_in_hours": 24
        }
    except Exception as e:
        logger.error(f"Approval failed: {e}", email=email)
        raise HTTPException(status_code=500, detail=f"Failed to approve: {str(e)}")

# Admin status and cache info
@app.get("/api/admin/status")
async def admin_status(admin: dict = Depends(require_admin)):
    try:
        cache_status = await get_cache("_system_status", max_age_mins=1)
        return {
            "admin": admin.get("email"),
            "cache_available": cache_status is not None,
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        logger.error(f"Admin status check failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to get status")
