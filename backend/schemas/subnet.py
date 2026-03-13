"""Subnet response schemas."""

from datetime import datetime
from typing import List, Literal, Optional
from pydantic import BaseModel, Field


class SubnetResponse(BaseModel):
    """Basic subnet information."""
    
    id: int = Field(description="Subnet ID (NetUID)")
    name: str
    category: str  
    icon: Optional[str] = None
    market_cap_millions: float
    daily_emission: float
    apy: float
    validators_count: int
    trend: Literal["up", "down", "stable"]
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SubnetDetailedResponse(SubnetResponse):
    """Detailed subnet information with additional metrics."""
    
    total_stake: float
    miners_count: int
    registration_count: int
    github_url: Optional[str] = None
    github_commits_30d: int
    github_stars: int
    test_coverage: Optional[float] = None
    momentum_score: float
    quality_score: float
    last_synced_at: datetime


class SubnetsResponse(BaseModel):
    """Paginated subnets response."""
    
    status: str = "success"
    data: List[SubnetResponse]
    pagination: dict = Field(
        default_factory=lambda: {
            "total": 0,
            "skip": 0,
            "limit": 20,
            "has_more": False,
        }
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)
