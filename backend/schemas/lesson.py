"""Lesson response schemas."""

from datetime import datetime
from typing import List
from pydantic import BaseModel, Field


class LessonResponse(BaseModel):
    """Lesson response."""
    
    title: str
    category: str
    level: str  # "beginner", "intermediate", "advanced"
    duration_minutes: int
    content: str
    key_takeaways: List[str] = Field(default_factory=list)
    resources: List[dict] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class LessonListResponse(BaseModel):
    """Paginated lessons response."""
    
    status: str = "success"
    data: List[LessonResponse]
    pagination: dict = Field(
        default_factory=lambda: {
            "total": 0,
            "skip": 0,
            "limit": 20,
            "has_more": False,
        }
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)
