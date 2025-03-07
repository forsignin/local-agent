from sqlalchemy import Column, String, Float, JSON, DateTime
from .base import BaseModel

class Execution(BaseModel):
    """执行记录模型"""
    __tablename__ = "executions"

    type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    completed_at = Column(DateTime, nullable=True)
    duration = Column(Float, nullable=True)
    result = Column(JSON, nullable=True)
    error = Column(String(500), nullable=True)

    def to_dict(self):
        """转换为字典"""
        result = super().to_dict()
        return result 