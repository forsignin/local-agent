from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

from src.core.task.task_manager import TaskManager
from src.common.security.middleware import SecurityDependency

router = APIRouter(prefix="/tasks", tags=["tasks"])
task_manager = TaskManager()

class TaskCreate(BaseModel):
    """任务创建请求模型"""
    type: str
    content: str
    metadata: Optional[Dict[str, Any]] = None

class TaskResponse(BaseModel):
    """任务响应模型"""
    id: str
    type: str
    status: str
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class TaskLog(BaseModel):
    """任务日志模型"""
    id: int
    agent_id: str
    action: str
    result: Dict[str, Any]
    created_at: datetime

@router.post("/", response_model=TaskResponse)
async def create_task(
    task: TaskCreate,
    user: Dict[str, Any] = Depends(SecurityDependency("task:create"))
):
    """创建任务"""
    try:
        task_data = {
            "type": task.type,
            "content": task.content,
            "metadata": task.metadata or {},
            "created_by": user["id"]
        }
        result = await task_manager.create_task(task_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    user: Dict[str, Any] = Depends(SecurityDependency("task:read"))
):
    """获取任务信息"""
    task = await task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.get("/{task_id}/logs", response_model=List[TaskLog])
async def get_task_logs(
    task_id: str,
    user: Dict[str, Any] = Depends(SecurityDependency("task:read"))
):
    """获取任务日志"""
    logs = await task_manager.get_task_logs(task_id)
    return logs

@router.get("/", response_model=List[TaskResponse])
async def list_tasks(
    status: Optional[str] = None,
    task_type: Optional[str] = None,
    user: Dict[str, Any] = Depends(SecurityDependency("task:read"))
):
    """列出任务"""
    tasks = await task_manager.list_tasks(status, task_type)
    return tasks