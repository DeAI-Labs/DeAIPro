"""ResearchArticle Beanie model for educational content."""

from datetime import datetime
from typing import List, Optional
from beanie import Document, Indexed
from pydantic import Field


class ResearchArticle(Document):
    """Research, analysis, and educational articles about Bittensor & AI."""
    
    # Content
    title: str
    category: Indexed(str)  # "market-analysis", "technical", "governance", "tutorials", etc.
    icon: str  # emoji (📊, 🔬, 💡, etc.)
    excerpt: str  # Short summary
    content: str  # Full content (Markdown)
    
    # Metadata
    author: Optional[str] = None
    tags: List[Indexed(str)] = Field(default_factory=list)
    
    # Timestamps
    published_date: Indexed(datetime)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        collection = "research_articles"
        indexes = [
            [("category", 1)],
            [("published_date", -1)],
            [("tags", 1)],
            [("updated_at", -1)],
        ]
