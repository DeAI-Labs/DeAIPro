"""Access request/token response schemas."""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class AccessRequestSchema(BaseModel):
    """Request 24-hour temporary access."""
    
    email: EmailStr
    
    class Config:
        json_schema_extra = {
            "example": {"email": "user@example.com"}
        }


class AccessTokenResponse(BaseModel):
    """24-hour temporary access token response."""
    
    status: str = "success"
    data: dict = Field(
        default_factory=lambda: {
            "token": "abc123...xyz789",
            "expires_in_hours": 24,
            "created_at": datetime.utcnow().isoformat(),
        }
    )
    message: str = "Access token generated successfully"
    timestamp: datetime = Field(default_factory=datetime.utcnow)
