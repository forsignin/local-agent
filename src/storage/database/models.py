from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class Task(Base):
    """任务表"""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True)
    type = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    task_metadata = Column(JSON)

    # 关联
    agent_states = relationship("AgentState", back_populates="task")
    execution_logs = relationship("ExecutionLog", back_populates="task")

class AgentState(Base):
    """代理状态表"""
    __tablename__ = "agent_states"

    id = Column(Integer, primary_key=True)
    agent_id = Column(String(50), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    state = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.now)

    # 关联
    task = relationship("Task", back_populates="agent_states")

class ExecutionLog(Base):
    """执行记录表"""
    __tablename__ = "execution_logs"

    id = Column(Integer, primary_key=True)
    task_id = Column(Integer, ForeignKey("tasks.id"))
    agent_id = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    result = Column(JSON)
    created_at = Column(DateTime, default=datetime.now)

    # 关联
    task = relationship("Task", back_populates="execution_logs")