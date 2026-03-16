"""TemporaryAccess Beanie model for MongoDB."""

from datetime import datetime, timedelta
from typing import Optional
from beanie import Document, Indexed
from pymongo import IndexModel, ASCENDING, DESCENDING
from pydantic import Field, EmailStr


class TemporaryAccess(Document):
    """Temporary 24-hour access token for unauthenticated users."""
    
    # User identification
    email: Indexed(EmailStr)
    token: str  # Random 32-char token
    
    # Lifetime management
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: datetime = Field(
        default_factory=lambda: datetime.utcnow() + timedelta(hours=24)
    )
    
    # Usage tracking
    accessed_at: Optional[datetime] = None
    request_count: int = 0  # How many requests made with this token
    
    # Revocation
    revoked: bool = False
    revoked_at: Optional[datetime] = None
    revocation_reason: Optional[str] = None
    
    class Settings:
        collection = "temporary_access"
        indexes = [
            IndexModel([("token", ASCENDING)], unique=True),
            IndexModel([("email", ASCENDING)]),
            IndexModel([("expires_at", ASCENDING)]),
            IndexModel([("created_at", DESCENDING)]),
        ]
