"""APScheduler background job scheduler configuration and management."""

from datetime import datetime

import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = structlog.get_logger(__name__)


class BackgroundScheduler:
    """Background job scheduler using APScheduler."""

    def __init__(self):
        self.scheduler: AsyncIOScheduler = None
        self.services = {}

    async def start(self) -> None:
        """Start the background scheduler."""
        try:
            self.scheduler = AsyncIOScheduler()

            from services.metagraph import MetagraphService
            from services.github_service import GitHubService
            from services.price import PriceService
            from services.news import NewsService
            from services.health import HealthService

            metagraph_service = MetagraphService()
            github_service = GitHubService()
            price_service = PriceService()
            news_service = NewsService()
            health_service = HealthService()

            self.services = {
                "metagraph": metagraph_service,
                "github": github_service,
                "price": price_service,
                "news": news_service,
                "health": health_service,
            }

            self.scheduler.add_job(
                metagraph_service.run,
                trigger=IntervalTrigger(minutes=metagraph_service.interval_minutes),
                id="metagraph_sync",
                name="Metagraph Synchronization",
                coalesce=True,
                max_instances=1,
                misfire_grace_time=60,
            )

            self.scheduler.add_job(
                github_service.run,
                trigger=IntervalTrigger(minutes=github_service.interval_minutes),
                id="github_sync",
                name="GitHub Commits Synchronization",
                coalesce=True,
                max_instances=1,
                misfire_grace_time=300,
            )

            self.scheduler.add_job(
                price_service.run,
                trigger=IntervalTrigger(minutes=price_service.interval_minutes),
                id="price_sync",
                name="Price History Synchronization",
                coalesce=True,
                max_instances=1,
                misfire_grace_time=30,
            )

            self.scheduler.add_job(
                news_service.run,
                trigger=IntervalTrigger(minutes=news_service.interval_minutes),
                id="news_sync",
                name="News Aggregation",
                coalesce=True,
                max_instances=1,
                misfire_grace_time=120,
            )

            self.scheduler.add_job(
                health_service.run,
                trigger=IntervalTrigger(minutes=health_service.interval_minutes),
                id="health_check",
                name="Health Monitoring",
                coalesce=True,
                max_instances=1,
                misfire_grace_time=30,
            )

            # Run all services immediately on startup so data is available right away
            import asyncio
            for name, svc in [
                ("metagraph", metagraph_service),
                ("price", price_service),
                ("news", news_service),
                ("github", github_service),
            ]:
                try:
                    logger.info(f"Running initial {name} sync")
                    await svc.run()
                except Exception as e:
                    logger.error(f"Initial {name} sync failed: {e}")

            self.scheduler.start()
            logger.info("Scheduler started", jobs=len(self.scheduler.get_jobs()))

        except Exception as e:
            logger.error(f"Scheduler startup error: {e}")
            raise

    async def stop(self) -> None:
        """Stop the background scheduler."""
        try:
            if self.scheduler and self.scheduler.running:
                self.scheduler.shutdown(wait=True)
                logger.info("Scheduler stopped")
        except Exception as e:
            logger.error(f"Scheduler shutdown error: {e}")

    def get_jobs(self) -> list:
        if not self.scheduler:
            return []
        return [
            {
                "id": job.id,
                "name": job.name,
                "next_run_time": job.next_run_time.isoformat() if job.next_run_time else None,
                "trigger": str(job.trigger),
            }
            for job in self.scheduler.get_jobs()
        ]

    def get_health_service(self):
        return self.services.get("health")


scheduler = BackgroundScheduler()
