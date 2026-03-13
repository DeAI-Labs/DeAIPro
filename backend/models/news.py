"""SubnetNews Beanie model for MongoDB."""

from datetime import datetime
from typing import Optional
from beanie import Document, Indexed
from pydantic import Field


class SubnetNews(Document):
    """News article related to Bittensor, subnets, or TAO ecosystem."""
    
    # Content
    title: str
    url: Indexed(str)
    source: str  # "TAO Daily", "Twitter", "GitHub", etc.
    category: Indexed(str)  # tech, economics, governance, partnerships, etc.
    content_excerpt: str
    image_url: Optional[str] = None
    
    # Ranking & relevance
    relevance_score: float = 0.5  # 0-1, used for sorting
    subnet_id: Optional[Indexed(int)] = None  # If subnet-specific
    
    # Timestamps
    published_at: datetime
    fetched_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        collection = "subnet_news"
        indexes = [
            [("category", 1)],
            [("published_at", -1)],
            [("relevance_score", -1)],
            [("subnet_id", 1)],
            [("fetched_at", -1)],
        ]
