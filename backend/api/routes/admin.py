"""
Admin-only routes (staff only: deaistrategies.io emails)
"""

from fastapi import APIRouter
import structlog

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])

# Note: Full implementations with Firebase auth will be added in Phase 2

@router.post("/approve-access")
async def admin_approve_access(body: dict):
    """Admin endpoint to approve temporary access"""
    email = body.get("email", "").lower().strip()
    logger.info("Admin access approval attempted", email=email)
    return {
        "success": False,
        "message": "Admin authentication and approval implemented in Phase 2",
    }

@router.get("/status")
async def admin_status():
    """Admin status endpoint"""
    return {
        "status": "pending_implementation",
        "message": "Admin endpoints implemented in Phase 2",
    }
