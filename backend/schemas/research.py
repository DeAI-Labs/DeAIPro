"""Research article response schemas."""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ResearchArticleResponse(BaseModel):
    """Research article response."""
    
    title: str
    category: str
    icon: str
    excerpt: str
    content: str
    author: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    published_date: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ResearchListResponse(BaseModel):
    """Paginated research articles response."""
    
    status: str = "success"
    data: List[ResearchArticleResponse]
    pagination: dict = Field(
        default_factory=lambda: {
            "total": 0,
            "skip": 0,
            "limit": 20,
            "has_more": False,
        }
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)
