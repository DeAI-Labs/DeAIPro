"""Price history synchronization worker - tracks TAO/USD prices with OHLCV candles."""

from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import httpx
import structlog
from workers.base import BaseWorker
from models.price import PriceHistory

logger = structlog.get_logger(__name__)


class PriceWorker(BaseWorker):
    """Fetch and store price history for TAO token."""
    
    def __init__(self):
        super().__init__(
            service_name="price",
            description="Sync TAO token price history"
        )
    
    async def execute(self) -> Dict[str, Any]:
        """Fetch current TAO/USD price and create hourly candle."""
        records_created = 0
        
        try:
            price_data = await self._fetch_tao_price()
            
            if price_data:
                # Create hourly candle
                candle = await self._create_price_candle(price_data)
                if candle:
                    records_created = 1
        
        except Exception as e:
            logger.error(f"Price sync failed: {e}", exc_info=e)
        
        return {
            "records_processed": 1,
            "records_created": records_created,
            "records_updated": 0,
        }
    
    async def _fetch_tao_price(self) -> Optional[Dict[str, Any]]:
        """Fetch current TAO price from CoinGecko API."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    "https://api.coingecko.com/api/v3/simple/price",
                    params={
                        "ids": "bittensor",
                        "vs_currencies": "usd,btc",
                        "include_market_cap": "true",
                        "include_24hr_vol": "true",
                        "include_24hr_change": "true",
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    bittensor_data = data.get("bittensor", {})
                    
                    return {
                        "price_usd": bittensor_data.get("usd", 0),
                        "price_btc": bittensor_data.get("btc", 0),
                        "market_cap_usd": bittensor_data.get("usd_market_cap", 0),
                        "volume_24h_usd": bittensor_data.get("usd_24h_vol", 0),
                        "change_24h_percent": bittensor_data.get("usd_24h_change", 0),
                    }
        
        except Exception as e:
            logger.warning(f"Failed to fetch TAO price from CoinGecko: {e}")
            return None
    
    async def _create_price_candle(self, price_data: Dict[str, Any]) -> Optional[PriceHistory]:
        """Create hourly OHLCV candle from price data."""
        try:
            now = datetime.utcnow()
            # Round to hour (OHLCV is hourly)
            hour_start = now.replace(minute=0, second=0, microsecond=0)
            
            # Check if candle already exists for this hour
            existing = await PriceHistory.find_one(
                (PriceHistory.symbol == "TAO/USD") &
                (PriceHistory.timestamp == hour_start)
            )
            
            if existing:
                # Update existing candle
                existing.close = price_data.get("price_usd", 0)
                existing.volume = price_data.get("volume_24h_usd", 0)
                existing.market_cap = price_data.get("market_cap_usd", 0)
                await existing.save()
                return existing
            
            # Create new candle
            price = price_data.get("price_usd", 0)
            candle = PriceHistory(
                symbol="TAO/USD",
                timestamp=hour_start,
                open=price,
                high=price,
                low=price,
                close=price,
                volume=price_data.get("volume_24h_usd", 0),
                market_cap=price_data.get("market_cap_usd", 0),
                source="coingecko",
            )
            
            await candle.insert()
            return candle
        
        except Exception as e:
            logger.error(f"Failed to create price candle: {e}", exc_info=e)
            return None


# Global worker instance
_worker = PriceWorker()


async def sync_prices_task():
    """Task for APScheduler to call."""
    await _worker.run()
