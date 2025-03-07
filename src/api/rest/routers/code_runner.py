from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import uuid

from src.common.security.middleware import SecurityDependency
from src.database import get_db
from sqlalchemy.orm import Session
from src.models.runtime import Runtime as RuntimeModel
from src.models.code_execution import CodeExecution

router = APIRouter(prefix="/code-runner", tags=["code-runner"])

class Runtime(BaseModel):
    """运行时环境模型"""
    id: str
    name: str
    version: str
    status: str = "active"
    description: Optional[str] = None
    is_enabled: bool = True

    class Config:
        orm_mode = True

class ExecutionResult(BaseModel):
    """执行结果模型"""
    id: str
    code: str
    runtime_id: str
    output: Optional[str] = None
    error: Optional[str] = None
    duration: Optional[float] = None
    memory_usage: Optional[float] = None
    cpu_usage: Optional[float] = None
    status: str = "pending"
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True

@router.get("/runtimes", response_model=List[Runtime])
async def list_runtimes(
    db: Session = Depends(get_db),
    user: Dict = Depends(SecurityDependency())
):
    """获取可用的运行时环境列表"""
    runtimes = db.query(RuntimeModel).filter(RuntimeModel.is_enabled == True).all()
    return runtimes

@router.post("/execute", response_model=ExecutionResult)
async def execute_code(
    code: str,
    runtime_id: str,
    db: Session = Depends(get_db),
    user: Dict = Depends(SecurityDependency())
):
    """执行代码"""
    # 检查运行时环境是否存在
    runtime = db.query(RuntimeModel).filter(
        RuntimeModel.id == runtime_id,
        RuntimeModel.is_enabled == True
    ).first()
    if not runtime:
        raise HTTPException(status_code=404, detail="Runtime not found")

    # 创建执行记录
    execution = CodeExecution(
        id=str(uuid.uuid4()),
        code=code,
        runtime_id=runtime_id,
        status="pending"
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)

    # TODO: 实际的代码执行逻辑
    # 这里应该异步执行代码，并在执行完成后更新执行记录
    # 现在我们只是返回执行记录
    return execution 