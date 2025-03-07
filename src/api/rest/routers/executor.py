from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

from src.common.security.middleware import SecurityDependency
from src.database import get_db
from sqlalchemy.orm import Session
from src.models.execution import Execution as ExecutionModel

router = APIRouter(prefix="/executor", tags=["executor"])

class Execution(BaseModel):
    """执行记录模型"""
    id: str
    type: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    duration: Optional[float] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

    class Config:
        orm_mode = True

class QueuedExecution(BaseModel):
    """队列中的执行任务模型"""
    id: str
    type: str
    priority: int
    queued_at: datetime
    estimated_duration: Optional[float] = None
    parameters: Optional[Dict[str, Any]] = None

@router.get("/queue", response_model=List[QueuedExecution])
async def get_execution_queue(user: Dict = Depends(SecurityDependency())):
    """获取执行队列中的任务列表"""
    now = datetime.now()
    return [
        QueuedExecution(
            id="queue1",
            type="analysis",
            priority=1,
            queued_at=now,
            estimated_duration=300,
            parameters={"dataset_id": "sample1"}
        ),
        QueuedExecution(
            id="queue2",
            type="training",
            priority=2,
            queued_at=now,
            estimated_duration=600,
            parameters={"model_type": "classification"}
        )
    ]

@router.get("/executions", response_model=List[Execution])
async def list_executions(
    db: Session = Depends(get_db),
    user: Dict = Depends(SecurityDependency())
):
    """获取执行记录列表"""
    try:
        executions = db.query(ExecutionModel).all()
        return executions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/execute")
async def create_execution(
    execution_type: str,
    params: Dict[str, Any],
    user: Dict = Depends(SecurityDependency())
):
    """创建新的执行任务"""
    now = datetime.now()
    return Execution(
        id="new_exec",
        type=execution_type,
        status="pending",
        created_at=now
    ) 