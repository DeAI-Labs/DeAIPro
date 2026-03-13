"""Fear & Greed Sentiment Engine for the Bittensor/TAO ecosystem.

Signal weighting (as per product specification):
    ┌─────────────────────────┬────────┐
    │ Signal                  │ Weight │
    ├─────────────────────────┼────────┤
    │ Price Volatility        │  25 %  │
    │ Market Momentum         │  25 %  │
    │ Volume Momentum         │  25 %  │
    │ GitHub Dev Activity     │  25 %  │
    └─────────────────────────┴────────┘

Score range: 0 (Extreme Fear) → 100 (Extreme Greed)
    0–24   : Extreme Fear
    25–44  : Fear
    45–55  : Neutral
    56–74  : Greed
    75–100 : Extreme Greed

Data sources:
    - PriceHistory MongoDB collection (close prices + volumes)
    - GitHub commits via fetch_github_commits (dynamic.py)
"""

from __future__ import annotations

import asyncio
import statistics
from datetime import datetime, timedelta
from typing import Optional

import structlog

logger = structlog.get_logger(__name__)


# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

def _normalise(value: float, min_val: float, max_val: float) -> float:
    """Clamp-normalise 'value' to [0, 100]."""
    if max_val == min_val:
        return 50.0
    normalised = (value - min_val) / (max_val - min_val) * 100
    return max(0.0, min(100.0, normalised))


def _label(score: float) -> str:
    if score < 25:
        return "Extreme Fear"
    elif score < 45:
        return "Fear"
    elif score <= 55:
        return "Neutral"
    elif score <= 74:
        return "Greed"
    else:
        return "Extreme Greed"


# ──────────────────────────────────────────────────────────────────────────────
# Individual signal calculators
# ──────────────────────────────────────────────────────────────────────────────

def _volatility_score(close_prices: list[float]) -> float:
    """25 % weight.

    Higher volatility → higher fear (lower score).
    We compute the rolling 30-day population stdev of daily returns,
    then invert it: low volatility = greed, high volatility = fear.
    """
    if len(close_prices) < 2:
        return 50.0
    returns = [
        abs((close_prices[i] - close_prices[i - 1]) / close_prices[i - 1])
        for i in range(1, len(close_prices))
        if close_prices[i - 1] > 0
    ]
    if not returns:
        return 50.0
    stdev = statistics.pstdev(returns)
    # Typical TAO daily volatility range: 0 % (no move) → 15 % (extreme swing).
    # Invert: low stdev = greed (score near 100), high stdev = fear (score near 0).
    raw_fear = _normalise(stdev, 0.0, 0.15)
    return 100.0 - raw_fear  # flip: low vol → high greed score


def _momentum_score(close_prices: list[float]) -> float:
    """25 % weight.

    Compares the 7-day moving average to the 30-day moving average.
    Positive crossover (7d > 30d) → bullish momentum → greed.
    """
    if len(close_prices) < 30:
        return 50.0
    avg_7d = statistics.mean(close_prices[-7:])
    avg_30d = statistics.mean(close_prices[-30:])
    if avg_30d == 0:
        return 50.0
    # Momentum ratio: 1.0 = neutral, >1 = greed, <1 = fear.
    ratio = avg_7d / avg_30d
    # Map [0.7, 1.3] → [0, 100].
    return _normalise(ratio, 0.7, 1.3)


def _volume_momentum_score(volumes: list[float]) -> float:
    """25 % weight.

    Compares the latest 24h volume to the 30-day average volume.
    Elevated volume on up-days → greed.
    """
    if len(volumes) < 2:
        return 50.0
    avg_30d_vol = statistics.mean(volumes[-30:]) if len(volumes) >= 30 else statistics.mean(volumes)
    recent_vol = volumes[-1]
    if avg_30d_vol == 0:
        return 50.0
    # Map [0.5×avg, 2×avg] → [0, 100].
    ratio = recent_vol / avg_30d_vol
    return _normalise(ratio, 0.5, 2.0)


def _github_activity_score(commits_30d: list[int]) -> float:
    """25 % weight.

    Aggregate commit count across monitored subnets in the last 30 days.
    Higher developer activity → higher greed score.
    Expected typical range: 0–1000 commits.
    """
    total = sum(commits_30d) if commits_30d else 0
    return _normalise(float(total), 0.0, 1000.0)


# ──────────────────────────────────────────────────────────────────────────────
# Main engine
# ──────────────────────────────────────────────────────────────────────────────

class FearGreedEngine:
    """Computes the composite Fear & Greed Index for the TAO ecosystem.

    Weights: Volatility 25 % | Momentum 25 % | Volume 25 % | GitHub 25 %
    """

    WEIGHTS = {
        "volatility": 0.25,
        "momentum": 0.25,
        "volume": 0.25,
        "github": 0.25,
    }

    @classmethod
    async def compute(cls) -> dict:
        """Compute and return the current Fear & Greed score.

        Fetches required data from MongoDB (PriceHistory) and returns a
        structured result dictionary ready to be cached or served via API.

        Returns:
            {
                "score": float,          # 0–100
                "label": str,            # e.g. "Greed"
                "components": {...},     # per-signal scores
                "computed_at": str,      # ISO timestamp
                "data_points": int,      # number of price candles used
            }
        """
        try:
            close_prices, volumes = await cls._fetch_price_series()
            commits_30d = await cls._fetch_github_activity()

            vol_score = _volatility_score(close_prices)
            mom_score = _momentum_score(close_prices)
            vol_mom_score = _volume_momentum_score(volumes)
            gh_score = _github_activity_score(commits_30d)

            composite = (
                vol_score * cls.WEIGHTS["volatility"]
                + mom_score * cls.WEIGHTS["momentum"]
                + vol_mom_score * cls.WEIGHTS["volume"]
                + gh_score * cls.WEIGHTS["github"]
            )

            result = {
                "score": round(composite, 2),
                "label": _label(composite),
                "components": {
                    "volatility": round(vol_score, 2),
                    "momentum": round(mom_score, 2),
                    "volume_momentum": round(vol_mom_score, 2),
                    "github_activity": round(gh_score, 2),
                },
                "computed_at": datetime.utcnow().isoformat(),
                "data_points": len(close_prices),
            }
            logger.info(
                "Fear & Greed computed",
                score=composite,
                label=result["label"],
            )
            return result

        except Exception as e:
            logger.error(f"FearGreedEngine.compute failed: {e}")
            return {
                "score": 50.0,
                "label": "Neutral",
                "components": {},
                "computed_at": datetime.utcnow().isoformat(),
                "data_points": 0,
                "error": str(e),
            }

    # ── Data fetchers ──────────────────────────────────────────────────────────

    @staticmethod
    async def _fetch_price_series() -> tuple[list[float], list[float]]:
        """Return (close_prices, volumes) for the last 30 days from MongoDB.

        Falls back to empty lists if the collection is not yet populated.
        """
        try:
            from models.price import PriceHistory

            cutoff = datetime.utcnow() - timedelta(days=30)
            candles = (
                await PriceHistory.find(
                    PriceHistory.timestamp >= cutoff,
                    PriceHistory.symbol == "TAO/USD",
                )
                .sort("+timestamp")
                .to_list()
            )
            closes = [c.close for c in candles if c.close > 0]
            volumes = [c.volume for c in candles if c.volume >= 0]
            return closes, volumes
        except Exception as e:
            logger.warning(f"Price series fetch failed: {e}")
            return [], []

    @staticmethod
    async def _fetch_github_activity() -> list[int]:
        """Return a list of commit counts from the top tracked subnets.

        Pulls the github_commits_30d field from the Subnet collection.
        Falls back to empty list if no data exists yet.
        """
        try:
            from models.subnet import Subnet

            subnets = (
                await Subnet.find()
                .sort("-market_cap_millions")
                .limit(10)
                .to_list()
            )
            return [s.github_commits_30d for s in subnets]
        except Exception as e:
            logger.warning(f"GitHub activity fetch failed: {e}")
            return []
