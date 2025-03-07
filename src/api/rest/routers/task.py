from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from src.common.security.middleware import SecurityDependency
from src.database import get_db
from src.models.task import Task, TaskType, TaskStatus, TaskPriority
from sqlalchemy.orm import Session
from sqlalchemy import func

router = APIRouter(prefix="/tasks", tags=["tasks"])

class TaskBase(BaseModel):
    """任务基础模型"""
    name: str
    type: TaskType
    status: TaskStatus
    priority: TaskPriority
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class TaskCreate(TaskBase):
    """创建任务的请求模型"""
    pass

class TaskResponse(TaskBase):
    """任务响应模型"""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    agent_id: Optional[str] = None
    result: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True

class TaskStats(BaseModel):
    """任务统计模型"""
    total: int
    completed: int
    failed: int
    pending: int

@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    db: Session = Depends(get_db),
    user: Dict = Depends(SecurityDependency())
):
    """获取任务列表"""
    tasks = db.query(Task).all()
    return [TaskResponse.from_orm(task) for task in tasks]

@router.get("/stats", response_model=TaskStats)
async def get_task_stats(
    db: Session = Depends(get_db),
    user: Dict = Depends(SecurityDependency())
):
    """获取任务统计信息"""
    total = db.query(func.count(Task.id)).scalar()
    completed = db.query(func.count(Task.id)).filter(Task.status == TaskStatus.COMPLETED.value).scalar()
    failed = db.query(func.count(Task.id)).filter(Task.status == TaskStatus.FAILED.value).scalar()
    pending = db.query(func.count(Task.id)).filter(Task.status == TaskStatus.PENDING.value).scalar()
    
    return {
        "total": total,
        "completed": completed,
        "failed": failed,
        "pending": pending
    }

@router.post("", response_model=TaskResponse)
async def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    user: Dict = Depends(SecurityDependency())
):
    """创建新任务"""
    db_task = Task(
        id=str(uuid.uuid4()),
        **task.dict()
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return TaskResponse.from_orm(db_task)

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    user: Dict = Depends(SecurityDependency())
):
    """获取特定任务"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return TaskResponse.from_orm(task)

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_update: TaskBase,
    db: Session = Depends(get_db),
    user: Dict = Depends(SecurityDependency())
):
    """更新任务"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    for key, value in task_update.dict(exclude_unset=True).items():
        setattr(task, key, value)
    
    db.commit()
    db.refresh(task)
    return TaskResponse.from_orm(task)

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    user: Dict = Depends(SecurityDependency())
):
    """删除任务"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}