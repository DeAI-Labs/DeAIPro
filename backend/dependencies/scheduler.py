"""APScheduler background job scheduler configuration and management."""

from datetime import datetime

import structlog
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = structlog.get_logger(__name__)


class BackgroundScheduler:
    """Background job scheduler using APScheduler."""

    def __init__(self):
        """Initialize the scheduler."""
        self.scheduler: AsyncIOScheduler = None
        self.services = {}

    async def start(self) -> None:
        """Start the background scheduler."""
        try:
            self.scheduler = AsyncIOScheduler()

            # Import services here to avoid circular imports
            from services.metagraph import MetagraphService
            from services.github_service import GitHubService
            from services.price import PriceService
            from services.news import NewsService
            from services.health import HealthService

            # Initialize services
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

            # Schedule metagraph sync (every 15 minutes)
            self.scheduler.add_job(
                metagraph_service.run,
                trigger=IntervalTrigger(minutes=metagraph_service.interval_minutes),
                id="metagraph_sync",
                name="Metagraph Synchronization",
                coalesce=True,
                max_instances=1,
                misfire_grace_time=60,
            )

            # Schedule GitHub sync (every 60 minutes)
            self.scheduler.add_job(
                github_service.run,
                trigger=IntervalTrigger(minutes=github_service.interval_minutes),
                id="github_sync",
                name="GitHub Commits Synchronization",
                coalesce=True,
                max_instances=1,
                misfire_grace_time=300,
            )

            # Schedule price sync (every 5 minutes)
            self.scheduler.add_job(
                price_service.run,
                trigger=IntervalTrigger(minutes=price_service.interval_minutes),
                id="price_sync",
                name="Price History Synchronization",
                coalesce=True,
                max_instances=1,
                misfire_grace_time=30,
            )

            # Schedule news sync (every 30 minutes)
            self.scheduler.add_job(
                news_service.run,
                trigger=IntervalTrigger(minutes=news_service.interval_minutes),
                id="news_sync",
                name="News Aggregation",
                coalesce=True,
                max_instances=1,
                misfire_grace_time=120,
            )

            # Schedule health check (every 1 minute)
            self.scheduler.add_job(
                health_service.run,
                trigger=IntervalTrigger(minutes=health_service.interval_minutes),
                id="health_check",
                name="Health Monitoring",
                coalesce=True,
                max_instances=1,
                misfire_grace_time=30,
            )

            # Start the scheduler
            self.scheduler.start()

            logger.info(
                "scheduler_started",
                jobs_scheduled=len(self.scheduler.get_jobs()),
            )

        except Exception as e:
            logger.error("scheduler_startup_error", error=str(e))
            raise

    async def stop(self) -> None:
        """Stop the background scheduler."""
        try:
            if self.scheduler and self.scheduler.running:
                self.scheduler.shutdown(wait=True)
                logger.info("scheduler_stopped")
        except Exception as e:
            logger.error("scheduler_shutdown_error", error=str(e))

    def get_jobs(self) -> list:
        """Get list of scheduled jobs.
        
        Returns:
            List of job details
        """
        if not self.scheduler:
            return []

        jobs = []
        for job in self.scheduler.get_jobs():
            jobs.append({
                "id": job.id,
                "name": job.name,
                "next_run_time": (
                    job.next_run_time.isoformat()
                    if job.next_run_time
                    else None
                ),
                "trigger": str(job.trigger),
            })

        return jobs

    def get_health_service(self):
        """Get health service for status checks.
        
        Returns:
            HealthService instance
        """
        return self.services.get("health")


# Global scheduler instance
scheduler = BackgroundScheduler()
