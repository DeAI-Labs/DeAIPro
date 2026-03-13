"""Statistics response schema."""

from datetime import datetime
from pydantic import BaseModel, Field


class StatsResponse(BaseModel):
    """Market statistics response."""
    
    status: str = "success"
    data: dict = Field(
        default_factory=lambda: {
            "tao_price": 0.0,
            "market_cap": 0.0,
            "volume_24h": 0.0,
            "tao_price_change_24h": 0.0,
            "active_subnets": 0,
            "total_ecosystem_mc": 0.0,
            "timestamp": datetime.utcnow().isoformat(),
        }
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow)
