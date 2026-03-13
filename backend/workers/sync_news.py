"""News aggregation worker - fetches and synchronizes news and research content."""

from datetime import datetime, timedelta
from typing import Dict, Any, List
import httpx
import structlog
import feedparser
from workers.base import BaseWorker
from models.news import SubnetNews

logger = structlog.get_logger(__name__)


class NewsWorker(BaseWorker):
    """Aggregate news from RSS feeds and APIs."""
    
    def __init__(self):
        super().__init__(
            service_name="research_news",
            description="Fetch research articles and news updates"
        )
        # RSS feeds for Bittensor ecosystem news
        self.rss_feeds = [
            "https://taodaily.substack.com/feed",  # TAO Daily newsletter
            # Additional feeds can be added here
        ]
    
    async def execute(self) -> Dict[str, Any]:
        """Fetch news from RSS feeds and APIs."""
        records_created = 0
        records_processed = 0
        
        try:
            # Fetch from RSS feeds
            for feed_url in self.rss_feeds:
                try:
                    articles = await self._fetch_rss_feed(feed_url)
                    records_processed += len(articles)
                    
                    for article in articles:
                        created = await self._save_article(article)
                        if created:
                            records_created += 1
                
                except Exception as e:
                    logger.warning(f"Failed to fetch feed {feed_url}: {e}")
        
        except Exception as e:
            logger.error(f"News aggregation failed: {e}", exc_info=e)
        
        return {
            "records_processed": records_processed,
            "records_created": records_created,
            "records_updated": 0,
        }
    
    async def _fetch_rss_feed(self, feed_url: str) -> List[Dict[str, Any]]:
        """Fetch articles from an RSS feed."""
        articles = []
        
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(feed_url)
                
                if response.status_code == 200:
                    feed = feedparser.parse(response.content)
                    
                    # Extract last 10 entries
                    for entry in feed.entries[:10]:
                        article = {
                            "title": entry.get("title", "").strip(),
                            "url": entry.get("link", "").strip(),
                            "summary": entry.get("summary", "").strip(),
                            "published_at": self._parse_published_date(entry),
                            "source": feed.feed.get("title", "Unknown"),
                            "category": "ecosystem",
                            "relevance_score": 0.5,  # Default, could be enhanced with ML
                        }
                        
                        if article["url"] and article["title"]:
                            articles.append(article)
        
        except Exception as e:
            logger.warning(f"Error fetching RSS feed {feed_url}: {e}")
        
        return articles
    
    def _parse_published_date(self, entry: Dict[str, Any]) -> datetime:
        """Extract and parse publication date from feed entry."""
        try:
            # Try published_parsed first (most common in atom/rss)
            if hasattr(entry, "published_parsed") and entry.published_parsed:
                import time
                return datetime.fromtimestamp(time.mktime(entry.published_parsed))
            
            # Fallback to current time
            return datetime.utcnow()
        
        except Exception:
            return datetime.utcnow()
    
    async def _save_article(self, article_data: Dict[str, Any]) -> bool:
        """Save article if it doesn't already exist."""
        try:
            # Check if article already exists (by URL)
            existing = await SubnetNews.find_one(
                SubnetNews.url == article_data["url"]
            )
            
            if existing:
                return False  # Already exists
            
            # Create new article
            news = SubnetNews(
                title=article_data["title"],
                url=article_data["url"],
                content_excerpt=article_data["summary"][:500],  # Truncate to 500 chars
                source=article_data["source"],
                category=article_data["category"],
                relevance_score=article_data["relevance_score"],
                published_at=article_data["published_at"],
                created_at=datetime.utcnow(),
            )
            
            await news.insert()
            logger.debug(f"Created news article: {news.title[:50]}...")
            return True
        
        except Exception as e:
            logger.warning(f"Failed to save article {article_data.get('title', 'Unknown')}: {e}")
            return False


# Global worker instance
_worker = NewsWorker()


async def sync_news_task():
    """Task for APScheduler to call."""
    await _worker.run()
