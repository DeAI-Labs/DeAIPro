"""Pydantic V2 schemas for request/response validation."""

from .common import ErrorResponse, PaginationParams, SuccessResponse
from .subnet import SubnetResponse, SubnetDetailedResponse, SubnetsResponse
from .stats import StatsResponse
from .news import SubnetNewsResponse, NewsListResponse
from .access import AccessRequestSchema, AccessTokenResponse
from .research import ResearchArticleResponse, ResearchListResponse
from .lesson import LessonResponse, LessonListResponse

__all__ = [
    # Common
    "ErrorResponse",
    "PaginationParams",
    "SuccessResponse",
    # Subnet
    "SubnetResponse",
    "SubnetDetailedResponse",
    "SubnetsResponse",
    # Stats
    "StatsResponse",
    # News
    "SubnetNewsResponse",
    "NewsListResponse",
    # Access
    "AccessRequestSchema",
    "AccessTokenResponse",
    # Research
    "ResearchArticleResponse",
    "ResearchListResponse",
    # Lesson
    "LessonResponse",
    "LessonListResponse",
]
