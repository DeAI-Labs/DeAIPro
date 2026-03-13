"""SyncState Beanie model for tracking background worker runs."""

from datetime import datetime
from typing import Literal, Optional
from beanie import Document, Indexed
from pydantic import Field


class SyncState(Document):
    """Tracks the last sync time and status for background workers."""
    
    # Service identification
    service: Indexed(str, unique=True)  # "metagraph", "github_commits", "price", "research_news"
    
    # Timing
    last_run: Optional[datetime] = None
    last_completed: Optional[datetime] = None
    next_scheduled: Optional[datetime] = None
    
    # Status tracking
    status: Literal["success", "failed", "pending", "running"] = "pending"
    error_message: Optional[str] = None
    
    # Statistics
    records_processed: int = 0
    records_created: int = 0
    records_updated: int = 0
    duration_seconds: Optional[float] = None
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        collection = "sync_state"
        indexes = [
            [("service", 1)],  # unique index
            [("last_run", -1)],
            [("status", 1)],
            [("updated_at", -1)],
        ]
