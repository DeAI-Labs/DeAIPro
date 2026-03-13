"""
Logging configuration using structlog.

All logs are output as JSON for easy parsing and aggregation in production.
"""

import structlog
import logging
import sys

def setup_logging():
    """Configure structlog for structured logging"""
    
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
    )
    
    # Get logger
    logger = structlog.get_logger(__name__)
    logger.info("Structlog configured for structured logging")
    
    return logger

def get_logger(name: str):
    """Get a logger instance"""
    return structlog.get_logger(name)
