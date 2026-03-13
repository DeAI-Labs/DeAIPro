"""Lesson Beanie model for educational curriculum."""

from datetime import datetime
from typing import List, Literal
from beanie import Document, Indexed
from pydantic import Field


class Lesson(Document):
    """Educational lesson on Bittensor, subnets, or cryptocurrency concepts."""
    
    # Content
    title: str
    category: Indexed(str)  # "getting-started", "subnets", "economics", "advanced", etc.
    level: Literal["beginner", "intermediate", "advanced"]
    duration_minutes: int
    
    # Learning content
    content: str  # Markdown
    key_takeaways: List[str] = Field(default_factory=list)
    
    # Resources
    resources: List[dict] = Field(default_factory=list)  # [{title, url, type}]
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        collection = "lessons"
        indexes = [
            [("category", 1)],
            [("level", 1)],
            [("updated_at", -1)],
        ]
