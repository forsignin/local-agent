from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.orm import Session
import os
import uuid

# 数据库配置
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./localagent.db")

# 创建数据库引擎
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database."""
    from src.models.base import Base
    from src.models.runtime import Runtime
    from src.models.execution import Execution
    
    Base.metadata.create_all(bind=engine)
    
    # 初始化运行时环境
    db = SessionLocal()
    try:
        # 检查是否已经有运行时环境数据
        if db.query(Runtime).count() == 0:
            runtimes = [
                Runtime(
                    id=str(uuid.uuid4()),
                    name="Python 3",
                    version="3.8",
                    status="active",
                    description="Python 3.8 运行时环境",
                    is_enabled=True
                ),
                Runtime(
                    id=str(uuid.uuid4()),
                    name="Node.js",
                    version="14",
                    status="active",
                    description="Node.js 14 运行时环境",
                    is_enabled=True
                ),
                Runtime(
                    id=str(uuid.uuid4()),
                    name="Java",
                    version="11",
                    status="active",
                    description="Java 11 运行时环境",
                    is_enabled=True
                )
            ]
            for runtime in runtimes:
                db.add(runtime)
            db.commit()
    finally:
        db.close() 