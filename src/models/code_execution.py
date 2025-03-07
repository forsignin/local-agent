from sqlalchemy import Column, String, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel

class CodeExecution(BaseModel):
    """代码执行记录模型"""
    __tablename__ = "code_executions"

    code = Column(Text, nullable=False)
    runtime_id = Column(String(36), ForeignKey("runtimes.id"), nullable=False)
    output = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    duration = Column(Float, nullable=True)
    memory_usage = Column(Float, nullable=True)
    cpu_usage = Column(Float, nullable=True)
    status = Column(String(20), nullable=False, default="pending")

    # 关联关系
    runtime = relationship("Runtime", backref="executions")

    def to_dict(self):
        """Convert execution instance to dictionary."""
        result = super().to_dict()
        if self.runtime:
            result["runtime"] = self.runtime.to_dict()
        return result 