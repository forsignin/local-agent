from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Optional
import logging
from src.common.config.settings import settings
from .models import Base

logger = logging.getLogger(__name__)

class DatabaseManager:
    """数据库管理器"""
    
    def __init__(self):
        self.engine = create_engine(
            settings.DATABASE_URL,
            echo=settings.DEBUG,
            poolclass=QueuePool,
            pool_size=5,
            max_overflow=10
        )
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine
        )
        
        # 创建表
        Base.metadata.create_all(bind=self.engine)
        logger.info("Database initialized")

    def get_session(self) -> Session:
        """获取数据库会话"""
        return self.SessionLocal()

    def cleanup(self):
        """清理资源"""
        self.engine.dispose()
        logger.info("Database connection cleaned up")