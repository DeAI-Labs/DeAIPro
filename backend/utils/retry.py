"""Retry mechanisms and fallback handlers for background services."""

import asyncio
from functools import wraps
from typing import Awaitable, Callable, Optional, TypeVar, Any

import structlog

logger = structlog.get_logger(__name__)

T = TypeVar("T")


class RetryConfig:
    """Configuration for retry behavior."""

    def __init__(
        self,
        max_retries: int = 3,
        initial_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_base: float = 2.0,
        jitter: bool = True,
    ):
        """Initialize retry configuration.
        
        Args:
            max_retries: Maximum number of retry attempts
            initial_delay: Initial delay between retries in seconds
            max_delay: Maximum delay between retries in seconds
            exponential_base: Base for exponential backoff calculation
            jitter: Whether to add random jitter to delays
        """
        self.max_retries = max_retries
        self.initial_delay = initial_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter

    def get_delay(self, attempt: int) -> float:
        """Calculate delay for given attempt number.
        
        Args:
            attempt: Attempt number (0-indexed)
            
        Returns:
            Delay in seconds
        """
        import random

        # Exponential backoff: delay = initial_delay * (base ^ attempt)
        delay = min(
            self.initial_delay * (self.exponential_base ** attempt),
            self.max_delay,
        )

        # Add jitter if enabled
        if self.jitter:
            # Random jitter: ±20% of delay
            jitter_amount = delay * 0.2
            delay = delay + random.uniform(-jitter_amount, jitter_amount)

        return max(0, delay)


async def retry_with_backoff(
    func: Callable[..., Awaitable[T]],
    *args,
    retry_config: RetryConfig = None,
    fallback_value: Optional[T] = None,
    on_retry: Optional[Callable] = None,
    on_failure: Optional[Callable] = None,
    **kwargs,
) -> Optional[T]:
    """
    Execute async function with exponential backoff retry.
    
    Args:
        func: Async function to execute
        *args: Positional arguments for func
        retry_config: Retry configuration (defaults to standard)
        fallback_value: Value to return if all retries fail
        on_retry: Callback function called on each retry
        on_failure: Callback function called if all retries fail
        **kwargs: Keyword arguments for func
        
    Returns:
        Result from func, fallback_value, or None
    """
    if retry_config is None:
        retry_config = RetryConfig()

    last_exception = None

    for attempt in range(retry_config.max_retries + 1):
        try:
            return await func(*args, **kwargs)

        except Exception as e:
            last_exception = e

            if attempt < retry_config.max_retries:
                # More retries available
                delay = retry_config.get_delay(attempt)

                if on_retry:
                    await on_retry(attempt, delay, e)

                logger.warning(
                    "retry_attempt",
                    attempt=attempt + 1,
                    max_retries=retry_config.max_retries,
                    delay_seconds=delay,
                    error=str(e),
                )

                await asyncio.sleep(delay)
            else:
                # Final attempt failed
                if on_failure:
                    await on_failure(e)

                logger.error(
                    "retry_exhausted",
                    attempts=attempt + 1,
                    error=str(e),
                )

    return fallback_value


def retry_decorator(
    retry_config: RetryConfig = None,
    fallback_value: Optional[Any] = None,
    log_on_retry: bool = True,
):
    """
    Decorator for retrying async functions with exponential backoff.
    
    Args:
        retry_config: Retry configuration
        fallback_value: Value to return on failure
        log_on_retry: Whether to log retry attempts
        
    Returns:
        Decorator function
        
    Example:
        @retry_decorator(
            retry_config=RetryConfig(max_retries=3, initial_delay=1.0),
            fallback_value=[],
        )
        async def fetch_data():
            return await api.get_data()
    """
    if retry_config is None:
        retry_config = RetryConfig()

    def decorator(func: Callable[..., Awaitable[T]]) -> Callable[..., Awaitable[T]]:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Optional[T]:
            last_exception = None

            for attempt in range(retry_config.max_retries + 1):
                try:
                    return await func(*args, **kwargs)

                except Exception as e:
                    last_exception = e

                    if attempt < retry_config.max_retries:
                        delay = retry_config.get_delay(attempt)

                        if log_on_retry:
                            logger.warning(
                                "function_retry",
                                function=func.__name__,
                                attempt=attempt + 1,
                                max_retries=retry_config.max_retries,
                                delay_seconds=delay,
                                error=str(e),
                            )

                        await asyncio.sleep(delay)
                    else:
                        if log_on_retry:
                            logger.error(
                                "function_retry_exhausted",
                                function=func.__name__,
                                attempts=attempt + 1,
                                error=str(e),
                            )

            return fallback_value

        return wrapper

    return decorator


class FallbackRegistry:
    """Registry for fallback handlers by exception type."""

    def __init__(self):
        """Initialize the fallback registry."""
        self.handlers = {}

    def register(
        self,
        exception_type: type,
        handler: Callable,
    ):
        """Register a fallback handler for an exception type.
        
        Args:
            exception_type: Exception class to handle
            handler: Async function to call for fallback
        """
        self.handlers[exception_type] = handler

    async def handle(
        self,
        exception: Exception,
        context: dict = None,
    ) -> Optional[Any]:
        """Handle exception using registered fallback.
        
        Args:
            exception: Exception to handle
            context: Additional context for handler
            
        Returns:
            Fallback value or None
        """
        # Check for exact exception type match first
        handler = self.handlers.get(type(exception))

        if handler:
            return await handler(exception, context or {})

        # Check for exception hierarchy
        for exc_type, handler in self.handlers.items():
            if isinstance(exception, exc_type):
                return await handler(exception, context or {})

        return None
