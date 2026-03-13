from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, status, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import firebase_admin
from firebase_admin import credentials
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import structlog
import os
import asyncio
from datetime import datetime, timedelta
from dotenv import load_dotenv

# FUTURE: Platform roadmap (backend)
# - Integrate Bittensor Python SDK for on-chain subnet/owner/scoring data.
# - Migrate all in-memory/static caching to MongoDB-backed collections.
# - Add live news ingestion from TAO Daily and other ecosystem feeds.
# - Expose GitHub subnet commits and activity as a dedicated endpoint.
# - Port validator APY / yield modelling from TaoYield codebase.
# - Support Bittensor wallet signature–based login in addition to Firebase.
# - Enforce consistent rate limiting across all routes and WebSocket channels.
# - Add a comprehensive automated test suite (unit + integration).

# Import static fallback data
from data import subnets as static_subnets, news as static_news, research as static_research, lessons as static_lessons

# Import cache and dynamic data functions
from cache import init_cache, close_cache, get_cache, set_cache
from websocket_manager import price_ticker_manager
from services.pdf import PDFReportGenerator
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

# Authentication — canonical implementations live in dependencies/auth.py
from dependencies.auth import (
    CurrentUser,
    get_current_user,
    require_admin,
    require_staff,
    get_or_create_temp_access,
)

# Optional-user helper for public endpoints that optionally accept a token
async def get_optional_user(request: Request):
    """Return a CurrentUser if a valid Bearer token is present, else None."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    from dependencies.auth import verify_token
    try:
        decoded = await verify_token(token)
        if not decoded:
            return None
        return decoded
    except Exception:
        return None

# Lifecycle Events
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 DeAIPro starting up...")
    try:
        # Initialize database connection
        from dependencies.db import db
        await db.connect()
        logger.info("✓ MongoDB connection established")
    except Exception as e:
        logger.error(f"⚠️ Database initialization failed: {e}")
        raise

    # IMPROVED: Initialize Mongo-backed cache (best effort, non-fatal).
    try:
        await init_cache()
        logger.info("✓ Cache layer initialized")
    except Exception as e:
        logger.warning(f"⚠️ Cache initialization failed; continuing without cache: {e}")

    try:
        # Initialize and start scheduler
        from workers import init_scheduler, start_scheduler
        init_scheduler()
        await start_scheduler()
        logger.info("✓ Background scheduler initialized and started")
    except Exception as e:
        logger.error(f"⚠️ Scheduler initialization failed: {e}")
        # Don't raise - scheduler is optional for basic functionality

    # Phase 4: Verify WeasyPrint system libraries are present.
    # This catches missing libcairo/libpango on bare-metal or broken CI images
    # at startup rather than silently crashing during the first PDF request.
    try:
        import asyncio as _asyncio
        loop = _asyncio.get_event_loop()
        def _check_weasyprint():
            import weasyprint
            weasyprint.HTML(string="<html><body>ok</body></html>").write_pdf()
        await loop.run_in_executor(None, _check_weasyprint)
        logger.info("✓ WeasyPrint and system PDF libraries verified")
    except Exception as e:
        logger.warning(
            f"⚠️ WeasyPrint system dependency check FAILED: {e}. "
            "Install libcairo2 libpango-1.0-0 libpangocairo-1.0-0 libgdk-pixbuf2.0-0. "
            "PDF report endpoints will error until this is resolved."
        )


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 DeAIPro shutting down...")
    try:
        # Stop scheduler
        from workers import stop_scheduler
        await stop_scheduler()
        logger.info("✓ Scheduler stopped")
    except Exception as e:
        logger.warning(f"Scheduler shutdown warning: {e}")

    try:
        # Close database connection
        from dependencies.db import db
        await db.disconnect()
        logger.info("✓ Database connection closed")
    except Exception as e:
        logger.warning(f"Database shutdown warning: {e}")

    # IMPROVED: Shut down cache (if it was initialized).
    try:
        await close_cache()
        logger.info("✓ Cache layer closed")
    except Exception as e:
        logger.warning(f"Cache shutdown warning: {e}")



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
    return []


# Fear & Greed sentiment index
@app.get("/api/market/sentiment")
@limiter.limit("30/minute")
async def get_market_sentiment(request: Request):
    """Return the current Fear & Greed Index for the TAO ecosystem.

    Scores 0 (Extreme Fear) to 100 (Extreme Greed) based on:
      - Price Volatility     (25 %)
      - Market Momentum      (25 %)
      - Volume Momentum      (25 %)
      - GitHub Dev Activity  (25 %)
    """
    cache_key = "market_sentiment"
    cached = await get_cache(cache_key, max_age_mins=60)
    if cached:
        return cached
    try:
        from services.sentiment import FearGreedEngine
        result = await FearGreedEngine.compute()
        await set_cache(cache_key, result, ttl_mins=60, source="fear_greed_engine")
        return result
    except Exception as e:
        logger.error(f"Sentiment endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Failed to compute sentiment index")

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


# ============================================================================
# Reports: PDF Generation
# ============================================================================

@app.get("/api/reports/market")
async def get_market_report(request: Request, user: CurrentUser = Depends(get_current_user)):
    """Generate a market report PDF (authenticated users only)."""
    try:
        # Fetch current market data
        stats = await fetch_all_subnet_data()
        tao_price = await fetch_tao_price()

        if not stats:
            raise HTTPException(status_code=500, detail="Failed to fetch market data")

        # Generate PDF
        pdf_data = PDFReportGenerator.generate_market_report(
            tao_price=tao_price,
            market_cap=stats.get("market_cap", 0),
            volume_24h=stats.get("volume_24h", 0),
            active_subnets=stats.get("active_subnets", 0),
            subnets_data=stats.get("subnets", []),
        )

        logger.info("Market report generated", user_id=user.uid)

        # StreamingResponse is correct for BytesIO objects; FileResponse expects a path.
        pdf_data.seek(0)
        filename = f"DeAIPro_Market_Report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        return StreamingResponse(
            pdf_data,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Market report generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate report")


@app.get("/api/reports/subnet/{subnet_id}")
async def get_subnet_report(
    subnet_id: int,
    request: Request,
    user: CurrentUser = Depends(get_current_user),
):
    """Generate a detailed subnet report PDF (authenticated users only)."""
    try:
        # Fetch all subnets and find the requested one
        all_subnets = await fetch_all_subnet_data()

        if not all_subnets:
            raise HTTPException(status_code=404, detail="Subnet not found")

        # all_subnets is Dict[int, dict] from fetch_all_subnet_data()
        subnet = all_subnets.get(subnet_id)
        if not subnet:
            raise HTTPException(status_code=404, detail=f"Subnet {subnet_id} not found")

        # Fix: fetch_github_commits expects (owner, repo), not a full URL.
        # Parse the github_url to extract owner/repo.
        github_url = subnet.get("github_url", "")
        github_commits_count = 0
        if github_url and "github.com/" in github_url:
            try:
                parts = github_url.rstrip("/").split("github.com/")[1].split("/")
                if len(parts) >= 2:
                    commits_list = await fetch_github_commits(parts[0], parts[1])
                    github_commits_count = len(commits_list) if commits_list else 0
            except Exception as gh_err:
                logger.warning(f"GitHub fetch failed for subnet {subnet_id}: {gh_err}")

        # Generate PDF
        pdf_data = PDFReportGenerator.generate_subnet_report(
            subnet_name=subnet.get("name", "Unknown"),
            subnet_id=subnet_id,
            market_cap=subnet.get("market_cap_millions", 0),
            apy=subnet.get("apy", 0),
            validators_count=subnet.get("validator_count", 0),
            miners_count=subnet.get("miner_count", 0),
            github_commits=github_commits_count,
        )

        logger.info(f"Subnet report generated", subnet_id=subnet_id, user_id=user.uid)

        # StreamingResponse is correct for BytesIO objects; FileResponse expects a path.
        pdf_data.seek(0)
        name = subnet.get("name", str(subnet_id))
        filename = f"DeAIPro_Subnet_{name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        return StreamingResponse(
            pdf_data,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Subnet report generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate report")


# ============================================================================
# WebSocket: Real-time Price Ticker
# ============================================================================

@app.websocket("/ws/price-ticker")
async def websocket_price_ticker(websocket: WebSocket):
    """WebSocket endpoint for real-time TAO price updates.
    
    Clients connect and receive price updates every 30 seconds.
    """
    await price_ticker_manager.connect(websocket)
    
    try:
        # Send initial price to client
        current_price = await fetch_tao_price()
        await websocket.send_json({
            "type": "price_update",
            "tao_price": current_price,
            "timestamp": datetime.utcnow().isoformat(),
        })
        
        # Keep connection alive and send periodic updates
        while True:
            try:
                # Wait for any message from client (e.g., ping/keepalive)
                # This will raise WebSocketDisconnect when client closes
                await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
            except asyncio.TimeoutError:
                # Send price update every 30 seconds
                current_price = await fetch_tao_price()
                await price_ticker_manager.broadcast_price_update(
                    current_price,
                    datetime.utcnow().isoformat()
                )
            except WebSocketDisconnect:
                await price_ticker_manager.disconnect(websocket)
                logger.info("WebSocket price ticker client disconnected")
                break
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await price_ticker_manager.disconnect(websocket)

