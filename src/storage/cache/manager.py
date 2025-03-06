 
from typing import Optional, Any, Dict
import json
import logging
from src.common.config.settings import settings

logger = logging.getLogger(__name__)

class CacheManager:
    """缓存管理器"""
    
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None

    async def initialize(self) -> None:
        """初始化Redis连接"""
        try:
            self.redis = await aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            logger.info("Redis connection initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Redis: {str(e)}")
            raise

    async def set(self, key: str, value: Any, expire: int = None) -> bool:
        """设置缓存"""
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            await self.redis.set(key, value, ex=expire)
            return True
        except Exception as e:
            logger.error(f"Failed to set cache key {key}: {str(e)}")
            return False

    async def get(self, key: str, default: Any = None) -> Any:
        """获取缓存"""
        try:
            value = await self.redis.get(key)
            if value is None:
                return default
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value
        except Exception as e:
            logger.error(f"Failed to get cache key {key}: {str(e)}")
            return default

    async def delete(self, key: str) -> bool:
        """删除缓存"""
        try:
            await self.redis.delete(key)
            return True
        except Exception as e:
            logger.error(f"Failed to delete cache key {key}: {str(e)}")
            return False

    async def exists(self, key: str) -> bool:
        """检查缓存是否存在"""
        try:
            return await self.redis.exists(key)
        except Exception as e:
            logger.error(f"Failed to check cache key {key}: {str(e)}")
            return False

    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """增加计数"""
        try:
            return await self.redis.incrby(key, amount)
        except Exception as e:
            logger.error(f"Failed to increment cache key {key}: {str(e)}")
            return None

    async def expire(self, key: str, seconds: int) -> bool:
        """设置过期时间"""
        try:
            return await self.redis.expire(key, seconds)
        except Exception as e:
            logger.error(f"Failed to set expiry for key {key}: {str(e)}")
            return False

    async def cleanup(self) -> None:
        """清理Redis连接"""
        if self.redis:
            await self.redis.close()
            logger.info("Redis connection closed")