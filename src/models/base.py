from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, String, DateTime
from datetime import datetime
from typing import Dict, Any
import uuid

Base = declarative_base()

class BaseModel(Base):
    """Base model class that includes common fields and methods."""
    __abstract__ = True

    id = Column(String(36), primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self) -> Dict[str, Any]:
        """Convert model instance to dictionary."""
        return {column.name: getattr(self, column.name) for column in self.__table__.columns}

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> Any:
        """Create model instance from dictionary."""
        return cls(**data) 