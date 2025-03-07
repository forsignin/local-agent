from sqlalchemy import Column, String, Integer, Text, JSON
import enum
from .base import BaseModel

class TaskType(enum.Enum):
    CODE_EXECUTION = "code_execution"
    DATA_ANALYSIS = "data_analysis"
    NETWORK_REQUEST = "network_request"
    SYSTEM_COMMAND = "system_command"

class TaskStatus(enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class TaskPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class Task(BaseModel):
    """Task model for storing task information."""
    __tablename__ = "tasks"

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False, default=TaskStatus.PENDING.value)
    priority = Column(String(20), nullable=False, default=TaskPriority.MEDIUM.value)
    task_metadata = Column(JSON, nullable=True)
    result = Column(JSON, nullable=True)
    error = Column(Text, nullable=True)
    progress = Column(Integer, nullable=False, default=0)

    def to_dict(self):
        """Convert task instance to dictionary."""
        result = super().to_dict()
        return result

    @classmethod
    def from_dict(cls, data: dict):
        """Create task instance from dictionary."""
        if 'type' in data and isinstance(data['type'], TaskType):
            data['type'] = data['type'].value
        if 'status' in data and isinstance(data['status'], TaskStatus):
            data['status'] = data['status'].value
        if 'priority' in data and isinstance(data['priority'], TaskPriority):
            data['priority'] = data['priority'].value
        return super().from_dict(data) 