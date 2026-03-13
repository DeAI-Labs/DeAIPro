from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    model_config = ConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"  # Ignore extra fields from .env file
    )
    
    # Environment
    environment: str = "development"
    debug: bool = False
    
    # Database
    database_url: str = "mongodb://root:password@localhost:27017/deaipro"
    
    # Firebase
    firebase_project_id: str = ""
    google_application_credentials: Optional[str] = None
    
    # External APIs
    taostats_api_key: Optional[str] = None
    taostats_api_url: str = "https://api.taostats.io"
    taomarketcap_api_url: str = "https://api.taomarketcap.com"
    github_api_token: Optional[str] = None
    github_api_url: str = "https://api.github.com"
    
    # Monitoring
    sentry_dsn_backend: Optional[str] = None
    
    # CORS
    backend_cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000,https://de-ai-pro.vercel.app"
    
    # Rate Limiting
    rate_limit_enabled: bool = True
    rate_limit_default: str = "100/minute"
    
    # Background Workers
    metagraph_sync_interval: int = 15
    github_sync_interval: int = 60
    price_sync_interval: int = 5
    
    # Redis (optional)
    redis_url: Optional[str] = None

settings = Settings()
