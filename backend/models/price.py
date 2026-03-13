"""PriceHistory Beanie model for price data."""

from datetime import datetime
from beanie import Document, Indexed
from pydantic import Field


class PriceHistory(Document):
    """Historical price data for TAO token (OHLCV candles)."""
    
    # Identification
    symbol: Indexed(str)  # "TAO"
    
    # Timing (hourly candles)
    timestamp: Indexed(datetime)  # Candle open time
    
    # OHLCV
    open: float
    high: float
    low: float
    close: float
    volume: float
    
    # Additional metrics
    market_cap: float
    volume_24h: float
    
    # Metadata
    source: str = "coingecko"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Settings:
        collection = "price_history"
        indexes = [
            # Unique compound index
            [("symbol", 1), ("timestamp", -1)],
            [("timestamp", -1)],
            [("symbol", 1)],
        ]
