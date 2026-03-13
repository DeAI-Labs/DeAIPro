"""News article response schemas."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class SubnetNewsResponse(BaseModel):
    """News article response."""
    
    title: str
    url: str
    source: str
    category: str
    content_excerpt: str
    image_url: Optional[str] = None
    relevance_score: float
    subnet_id: Optional[int] = None
    published_at: datetime
    fetched_at: datetime
    
    class Config:
        from_attributes = True


class NewsListResponse(BaseModel):
    """Paginated news list response."""
    
    status: str = "success"
    data: List[SubnetNewsResponse]
    pagination: dict = Field(
        default_factory=lambda: {
            "total": 0,
            "skip": 0,
            "limit": 20,
            "has_more": False,
        }
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)
