from typing import Optional, Dict, List, Any
import asyncio
import httpx
from datetime import datetime
import structlog
from bs4 import BeautifulSoup
import os

# Import cache
from cache import get_cache, set_cache

logger = structlog.get_logger(__name__)

# API Keys & Constants

TAOSTATS_API_KEY = os.getenv("TAOSTATS_API_KEY", "")
TAOSTATS_BASE = "https://api.taostats.io/api"

TAO_DAILY_URL = "https://taodaily.io"
GITHUB_API_BASE = "https://api.github.com"


# Bittensor SDK Integration
def _sync_get_subtensor():
    """Construct a synchronous bt.subtensor client (blocking — run in executor)."""
    try:
        import bittensor as bt
        network = os.getenv("BITTENSOR_NETWORK", "finney")
        subtensor_url = os.getenv("BITTENSOR_SUBTENSOR_URL", None)
        subtensor = bt.subtensor(network=network, _url=subtensor_url)
        logger.info(f"Bittensor connected to {network}")
        return subtensor
    except ImportError:
        logger.warning("Bittensor SDK not installed, using API fallback")
        return None
    except Exception as e:
        logger.error(f"Bittensor connection failed: {e}, using API fallback")
        return None


def _sync_fetch_metagraph(subtensor, netuid: int):
    """Fetch a single subnet metagraph (blocking — run in executor)."""
    return subtensor.metagraph(netuid=netuid)


async def fetch_subnets_from_sdk() -> Optional[Dict[int, Dict[str, Any]]]:
    """Fetch live subnet data from the Bittensor SDK.

    All synchronous SDK calls are dispatched to the default thread-pool
    executor via `run_in_executor` so the event loop is never stalled.

    FUTURE: Migrate to `bittensor.AsyncSubtensor` (SDK >= 7.x) to avoid
    the executor overhead entirely.
    """
    cache = await get_cache("bittensor_subnets", max_age_mins=10)
    if cache:
        return cache

    loop = asyncio.get_event_loop()

    # Construct the subtensor client in a thread (synchronous gRPC handshake).
    subtensor = await loop.run_in_executor(None, _sync_get_subtensor)
    if not subtensor:
        return None

    try:
        subnets = {}
        # Query each netuid concurrently in the thread-pool.
        async def _fetch_one(netuid: int):
            try:
                metagraph = await loop.run_in_executor(
                    None, _sync_fetch_metagraph, subtensor, netuid
                )
                if metagraph.n > 0:
                    subnets[netuid] = {
                        "netuid": netuid,
                        "n_validators": int(metagraph.n) if not hasattr(metagraph.n, "validators") else metagraph.n.validators,
                        "n_miners": 0 if not hasattr(metagraph.n, "miners") else metagraph.n.miners,
                        "total_stake": float(metagraph.total_stake) if hasattr(metagraph, "total_stake") else 0,
                        "emission_tao": float(metagraph.emission) if hasattr(metagraph, "emission") else 0,
                        "updated": datetime.utcnow().isoformat(),
                    }
            except Exception as e:
                logger.debug(f"Subnet {netuid} query failed: {e}")

        await asyncio.gather(*[_fetch_one(netuid) for netuid in range(1, 65)])

        logger.info(f"Fetched {len(subnets)} subnets from Bittensor SDK")
        await set_cache("bittensor_subnets", subnets, ttl_mins=10, source="bittensor_sdk")
        return subnets
    except Exception as e:
        logger.error(f"Bittensor SDK subnet fetch failed: {e}")
        return None

# TaoStats: Emissions & Network Data
async def fetch_subnets_from_taostats() -> Optional[Dict[int, Dict[str, Any]]]:
    cache = await get_cache("taostats_subnets", max_age_mins=5)
    if cache:
        return cache
    if not TAOSTATS_API_KEY:
        logger.debug("TaoStats API key not set, skipping")
        return None
    headers = {"Authorization": f"Bearer {TAOSTATS_API_KEY}"}
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                f"{TAOSTATS_BASE}/subnet/latest/v1",
                params={"limit": 256, "order": "emission desc"},
                headers=headers
            )
            resp.raise_for_status()
            raw = resp.json()
            subnets_raw = raw.get("data", raw) if isinstance(raw, dict) else raw
            result = {}
            for s in subnets_raw:
                netuid = s.get("netuid") or s.get("net_uid")
                if netuid is None:
                    continue
                nid = int(netuid)
                result[nid] = {
                    "netuid": nid,
                    "name": s.get("name") or s.get("subnet_name") or f"Subnet {nid}",
                    "emission_tao": round(float(s.get("emission") or s.get("emission_tao", 0)), 2),
                    "emission_share_pct": round(float(s.get("emission_pct") or s.get("emission_share", 0)) * 100, 2),
                    "validator_count": int(s.get("validator_count") or s.get("num_validators", 0)),
                    "miner_count": int(s.get("miner_count") or s.get("num_miners", 0)),
                    "alpha_price_tao": round(float(s.get("alpha_price_tao") or 0), 6),
                    "updated": datetime.utcnow().isoformat(),
                }
            logger.info(f"Fetched {len(result)} subnets from TaoStats")
            await set_cache("taostats_subnets", result, ttl_mins=5, source="taostats")
            return result
    except Exception as e:
        logger.error(f"TaoStats fetch failed: {e}")
        return None


# BeautifulSoup: TAO Daily News Scraping
async def scrape_tao_daily_news() -> List[Dict[str, str]]:
    cache = await get_cache("tao_daily_news", max_age_mins=10)
    if cache:
        return cache
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(TAO_DAILY_URL)
            resp.raise_for_status()
            soup = BeautifulSoup(resp.text, "html.parser")
            news_items = []
            # Find all article cards
            articles = soup.find_all("article", limit=20)
            for article in articles:
                try:
                    title_el = article.find("h2") or article.find("h3")
                    link_el = article.find("a", href=True)
                    time_el = article.find("time")
                    if title_el and link_el:
                        news_items.append({
                            "title": title_el.get_text(strip=True),
                            "url": link_el.get("href"),
                            "timestamp": time_el.get_text(strip=True) if time_el else "recent",
                            "source": "taodaily",
                            "category": "Ecosystem"
                        })
                except Exception as e:
                    logger.debug(f"Failed to parse article: {e}")
                    continue
            logger.info(f"Scraped {len(news_items)} articles from TAO Daily")
            await set_cache("tao_daily_news", news_items, ttl_mins=10, source="webscrape")
            return news_items
    except Exception as e:
        logger.error(f"TAO Daily scraping failed: {e}")
        return []

# GitHub: Subnet Repository Commits
async def fetch_github_commits(
    owner: str,
    repo: str,
    limit: int = 10
) -> Optional[List[Dict[str, str]]]:
    cache_key = f"github_commits_{owner}_{repo}"
    cache = await get_cache(cache_key, max_age_mins=60)
    if cache:
        return cache
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{GITHUB_API_BASE}/repos/{owner}/{repo}/commits",
                params={"per_page": limit},
                headers={"Accept": "application/vnd.github+json"}
            )
            resp.raise_for_status()
            commits = resp.json()
            result = [
                {
                    "sha": c.get("sha", ""),
                    "message": c.get("commit", {}).get("message", ""),
                    "author": c.get("commit", {}).get("author", {}).get("name", ""),
                    "date": c.get("commit", {}).get("author", {}).get("date", ""),
                    "url": c.get("html_url", "")
                }
                for c in commits
            ]
            await set_cache(cache_key, result, ttl_mins=60, source="github")
            return result
    except Exception as e:
        logger.error(f"GitHub commits fetch failed ({owner}/{repo}): {e}")
        return None


# Composite Functions
async def fetch_all_subnet_data() -> Dict[int, Dict[str, Any]]:
    """
    Aggregate subnet data for use in HTTP endpoints.

    IMPROVED: To protect the event loop, this function no longer calls the
    synchronous Bittensor SDK directly. It relies on TaoStats (and, in the
    future, background workers + Mongo) and preserves the existing response
    structure for callers.
    """
    taostats_data = await fetch_subnets_from_taostats()
    if isinstance(taostats_data, Exception):
        taostats_data = None

    merged: Dict[int, Dict[str, Any]] = {}
    if taostats_data:
        for nid, data in taostats_data.items():
            merged[nid] = {"source": "taostats", **data}
    return merged

async def fetch_all_news() -> List[Dict[str, Any]]:
    news = await scrape_tao_daily_news()
    # If scrape failed, return static (from data.py)
    if not news:
        logger.info("Using static news fallback")
        from data import news as static_news
        news = static_news
    return news


async def fetch_tao_price() -> Optional[Dict[str, Any]]:
    """Fetch live TAO/USD price from CoinGecko via the price service.

    Re-exported here for backwards compatibility (main.py imports from dynamic).
    """
    try:
        from services.price import PriceService
        service = PriceService()
        return await service.get_current_price()
    except Exception as e:
        logger.warning(f"fetch_tao_price failed: {e}")
        return None
