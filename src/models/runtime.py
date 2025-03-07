from sqlalchemy import Column, String, Boolean
from .base import BaseModel

class Runtime(BaseModel):
    """运行时环境模型"""
    __tablename__ = "runtimes"

    name = Column(String(255), nullable=False)
    version = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, default="active")
    description = Column(String(500), nullable=True)
    is_enabled = Column(Boolean, default=True)

    def to_dict(self):
        """Convert runtime instance to dictionary."""
        result = super().to_dict()
        return result 