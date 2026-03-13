"""
Authentication routes
"""

from fastapi import APIRouter, Request, status, HTTPException
from slowapi import Limiter
from slowapi.util import get_remote_address
import structlog
from datetime import datetime, timedelta
import secrets
from pydantic import EmailStr, BaseModel
import os

from models import TemporaryAccess
from dependencies import get_current_user, CurrentUser

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api", tags=["auth"])
limiter = Limiter(key_func=get_remote_address)


class TemporaryAccessRequest(BaseModel):
    """Request for temporary access token."""
    email: EmailStr


class TemporaryAccessResponse(BaseModel):
    """Response with temporary access token."""
    token: str
    expires_at: str
    message: str


class TestLoginRequest(BaseModel):
    """Request for test login (development only)."""
    test_user: str


@router.post("/authenticate-temporary", response_model=dict)
@limiter.limit("5/minute")
async def authenticate_temporary(
    request: Request,
    data: TemporaryAccessRequest,
) -> dict:
    """
    Create a temporary 24-hour access token.
    
    User provides email, receives a token valid for 24 hours.
    This token can be used to access protected endpoints without Firebase auth.
    """
    try:
        email = data.email.lower()
        
        # Check if user already has a valid token
        existing = await TemporaryAccess.find_one(
            TemporaryAccess.email == email,
            TemporaryAccess.revoked == False,
            TemporaryAccess.expires_at > datetime.utcnow(),
        )
        
        if existing:
            logger.info(f"Temporary token already exists for {email}")
            return {
                "status": "success",
                "data": {
                    "message": "An active token already exists for this email",
                    "expires_at": existing.expires_at.isoformat(),
                    "note": "Please check your email for the token link",
                },
            }
        
        # Generate secure random token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        # Create access record
        temp_access = TemporaryAccess(
            email=email,
            token=token,
            expires_at=expires_at,
        )
        
        await temp_access.insert()
        
        logger.info(f"Temporary access token created for {email}")
        
        # In production, send email with token link
        # For now, return token in response (development only)
        return {
            "status": "success",
            "data": {
                "token": token,
                "expires_at": expires_at.isoformat(),
                "message": f"Temporary access token created for {email}. Token expires in 24 hours.",
                "usage": "Include token in Authorization header: Bearer {token}",
            },
        }
        
    except Exception as e:
        logger.error(f"Error creating temporary access: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create temporary access token",
        )


@router.post("/revoke-temporary", response_model=dict)
async def revoke_temporary(
    request: Request,
    current_user: CurrentUser = None,
):
    """Revoke a temporary access token."""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid token",
            )
        
        token = auth_header.split(" ")[1]
        
        # Find and revoke token
        temp_access = await TemporaryAccess.find_one(TemporaryAccess.token == token)
        
        if not temp_access:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Token not found",
            )
        
        temp_access.revoked = True
        temp_access.revoked_at = datetime.utcnow()
        temp_access.revocation_reason = "User requested revocation"
        await temp_access.save()
        
        logger.info(f"Temporary access revoked for {temp_access.email}")
        
        return {
            "status": "success",
            "message": "Token revoked successfully",
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error revoking token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke token",
        )


@router.post("/verify-token", response_model=dict)
@limiter.limit("30/minute")
async def verify_token(
    request: Request,
) -> dict:
    """
    Verify if a temporary access token is valid.
    
    Can be used to check token status before making requests.
    """
    try:
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing or invalid authorization header",
            )
        
        token = auth_header.split(" ")[1]
        
        # Find token
        temp_access = await TemporaryAccess.find_one(TemporaryAccess.token == token)
        
        if not temp_access:
            return {
                "status": "error",
                "valid": False,
                "message": "Token not found",
            }
        
        # Check if revoked
        if temp_access.revoked:
            return {
                "status": "error",
                "valid": False,
                "message": "Token has been revoked",
            }
        
        # Check if expired
        if temp_access.expires_at < datetime.utcnow():
            return {
                "status": "error",
                "valid": False,
                "message": "Token has expired",
            }
        
        # Token is valid
        return {
            "status": "success",
            "valid": True,
            "data": {
                "email": temp_access.email,
                "expires_at": temp_access.expires_at.isoformat(),
                "accessed_at": temp_access.accessed_at.isoformat() if temp_access.accessed_at else None,
                "request_count": temp_access.request_count,
            },
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying token: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify token",
        )

