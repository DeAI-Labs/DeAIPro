from datetime import datetime, timedelta
from typing import Optional, Any, Dict
import os
import json

from google_crc32c import value
from motor.motor_asyncio import AsyncIOMotorClient
import structlog

logger = structlog.get_logger(__name__)

class MongoCache:
    def __init__(self, mongo_uri: Optional[str] = None, db_name: str = "deaipro"):
        self.mongo_uri = mongo_uri or os.getenv(
            "DATABASE_URL", 
            "mongodb://root:password@localhost:27017/deaipro"
        )
        self.db_name = db_name
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[Any] = None
        self._connected = False
    async def connect(self):
        if self._connected:
            return
        try:
            self.client = AsyncIOMotorClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            self.db = self.client[self.db_name]

            # Test connection
            await self.client.admin.command('ping')
            logger.info("MongoDB connected", db=self.db_name)

            # Create TTL index on cache collection
            cache_collection = self.db["cache"]
            await cache_collection.create_index(
                "expires_at",
                expireAfterSeconds=0
            )
            logger.info("TTL index created on 'cache' collection")
            self._connected = True
        except Exception as e:
            logger.error(f"MongoDB connection failed: {e}")
            self._connected = False
            raise
    async def disconnect(self):
        if self.client:
            self.client.close()
            self._connected = False
            logger.info("MongoDB disconnected")
    async def get(
        self,
        key: str,
        max_age_mins: int = 5
    ) -> Optional[Dict[str, Any]]:
        if not self._connected or not self.db:
            return None
        try:
            cache_collection = self.db["cache"]
            doc = await cache_collection.find_one({"key": key})
            if not doc:
                logger.debug(f"Cache miss: {key}")
                return None

            # Check if expired
            expires_at = doc.get("expires_at")
            if expires_at and expires_at < datetime.utcnow():
                await cache_collection.delete_one({"key": key})
                logger.debug(f"Cache expired: {key}")
                return None
            logger.debug(f"Cache hit: {key}", source=doc.get("source"))
            return doc.get("data")
        except Exception as e:
            logger.error(f"Cache GET failed for {key}: {e}")
            return None
    async def set(
        self, 
        key: str, 
        data: Dict[str, Any], 
        ttl_mins: int = 5,
        source: str = "unknown"
    ):
        if not self._connected or not self.db:
            logger.warning(f"Cache SET skipped (not connected): {key}")
            return
        try:
            cache_collection = self.db["cache"]
            expires_at = datetime.utcnow() + timedelta(minutes=ttl_mins)
            await cache_collection.update_one(
                {"key": key},
                {
                    "$set": {
                        "key": key,
                        "data": data,
                        "expires_at": expires_at,
                        "created_at": datetime.utcnow(),
                        "source": source
                    }
                },
                upsert=True
            )
            logger.debug(f"Cache SET: {key}", ttl_mins=ttl_mins, source=source)
        except Exception as e:
            logger.error(f"Cache SET failed for {key}: {e}")
    async def delete(self, key: str):
        if not self._connected or not self.db:
            return
        try:
            cache_collection = self.db["cache"]
            await cache_collection.delete_one({"key": key})
            logger.debug(f"Cache deleted: {key}")
        except Exception as e:
            logger.error(f"Cache DELETE failed for {key}: {e}")
    async def clear_all(self):
        if not self._connected or not self.db:
            return
        try:
            cache_collection = self.db["cache"]
            result = await cache_collection.delete_many({})
            logger.warning(f"Cleared {result.deleted_count} cache entries")
        except Exception as e:
            logger.error(f"Cache CLEAR_ALL failed: {e}")

# Global cache instance
mongo_cache: Optional[MongoCache] = None

async def init_cache():
    global mongo_cache
    mongo_cache = MongoCache()
    try:
        await mongo_cache.connect()
    except Exception as e:
        logger.error(f"Failed to initialize cache: {e}")
        mongo_cache = None

async def close_cache():
    global mongo_cache
    if mongo_cache:
        await mongo_cache.disconnect()


async def get_cache(key: str, max_age_mins: int = 5) -> Optional[Dict[str, Any]]:
    if mongo_cache:
        return await mongo_cache.get(key, max_age_mins)
    return None


async def set_cache(
    key: str, 
    data: Dict[str, Any], 
    ttl_mins: int = 5,
    source: str = "unknown"
):
    if mongo_cache:
        await mongo_cache.set(key, data, ttl_mins, source)
