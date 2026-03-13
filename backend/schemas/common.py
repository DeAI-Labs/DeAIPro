"""Common Pydantic schemas for shared request/response structures."""

from datetime import datetime
from typing import Any, Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Pagination query parameters."""
    
    skip: int = Field(default=0, ge=0, description="Number of records to skip")
    limit: int = Field(default=20, ge=1, le=100, description="Number of records to return")
    sort_by: Optional[str] = None
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$")


class SuccessResponse(BaseModel, Generic[T]):
    """Generic success response wrapper."""
    
    status: str = "success"
    data: T
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response schema."""
    
    status: str = "error"
    message: str
    code: str  # Error code (e.g., "INVALID_REQUEST", "NOT_FOUND")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[dict] = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated list response."""
    
    status: str = "success"
    data: List[T]
    pagination: dict = Field(
        default_factory=lambda: {
            "total": 0,
            "skip": 0,
            "limit": 20,
            "has_more": False,
        }
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)
