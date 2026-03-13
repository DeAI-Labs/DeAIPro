"""Base service class for all background synchronization services."""

from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum

import structlog
from beanie import PydanticObjectId

logger = structlog.get_logger(__name__)


class SyncStatus(str, Enum):
    """Sync status enumeration."""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    FAILED = "failed"


class BaseService(ABC):
    """Base class for all synchronization services."""

    service_name: str = "base_service"
    interval_minutes: int = 60

    def __init__(self):
        """Initialize the service."""
        self.logger = logger.bind(service=self.service_name)

    @abstractmethod
    async def run(self) -> None:
        """
        Execute the service synchronization logic.
        
        Must be implemented by subclasses.
        """
        pass

    async def update_sync_state(
        self,
        status: SyncStatus,
        records_processed: int = 0,
        records_created: int = 0,
        records_updated: int = 0,
        error: str = None,
        duration_seconds: float = 0,
    ) -> None:
        """
        Update the SyncState collection with service status.
        
        Args:
            status: Current sync status
            records_processed: Number of records processed
            records_created: Number of new records created
            records_updated: Number of existing records updated
            error: Error message if status is FAILED
            duration_seconds: Time taken to complete sync
        """
        from models.sync_state import SyncState

        try:
            # Find existing SyncState for this service
            sync_state = await SyncState.find_one(SyncState.service == self.service_name)

            if sync_state:
                # Update existing record
                sync_state.status = status.value
                sync_state.last_run = datetime.utcnow()
                sync_state.last_completed = (
                    datetime.utcnow() if status == SyncStatus.SUCCESS else sync_state.last_completed
                )
                sync_state.records_processed = records_processed
                sync_state.records_created = records_created
                sync_state.records_updated = records_updated
                sync_state.duration_seconds = duration_seconds
                sync_state.error_message = error
                sync_state.next_scheduled = None  # Will be set by scheduler
                await sync_state.save()
            else:
                # Create new SyncState record
                sync_state = SyncState(
                    service=self.service_name,
                    status=status.value,
                    last_run=datetime.utcnow(),
                    last_completed=(
                        datetime.utcnow() if status == SyncStatus.SUCCESS else None
                    ),
                    records_processed=records_processed,
                    records_created=records_created,
                    records_updated=records_updated,
                    duration_seconds=duration_seconds,
                    error_message=error,
                    next_scheduled=None,
                )
                await sync_state.insert()

            self.logger.info(
                "sync_state_updated",
                status=status.value,
                records_processed=records_processed,
                duration=duration_seconds,
            )

        except Exception as e:
            self.logger.error(
                "sync_state_update_failed",
                error=str(e),
            )

    async def log_sync(
        self,
        message: str,
        level: str = "info",
        **kwargs,
    ) -> None:
        """
        Log a sync operation with context.
        
        Args:
            message: Log message
            level: Log level (info, warning, error, debug)
            **kwargs: Additional context fields
        """
        log_method = getattr(self.logger, level, self.logger.info)
        log_method(message, **kwargs)
