from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime
import logging

from src.common.security.middleware import SecurityDependency
from src.common.events.event_bus import EventBus
from src.agents.base import AgentRegistry
from src.core.task.task_manager import TaskManager
from src.core.tools.tool_manager import ToolManager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/system", tags=["system"])
event_bus = EventBus()
task_manager = TaskManager()
tool_manager = ToolManager()

class SystemStatus(BaseModel):
    """系统状态模型"""
    status: str
    version: str
    uptime: float
    agents: Dict[str, Any]
    tasks: Dict[str, int]
    tools: Dict[str, int]
    events: Dict[str, int]

class SystemMetrics(BaseModel):
    """系统指标模型"""
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    network_io: Dict[str, int]
    task_throughput: float
    error_rate: float

class SystemEvent(BaseModel):
    """系统事件模型"""
    type: str
    data: Dict[str, Any]
    timestamp: datetime

@router.get("/status", response_model=SystemStatus)
async def get_system_status(
    user: Dict[str, Any] = Depends(SecurityDependency("system:read"))
):
    """获取系统状态"""
    try:
        # 获取代理状态
        agents = {
            "total": len(AgentRegistry.list_agents()),
            "active": len([
                a for a in AgentRegistry.list_agents()
                if AgentRegistry.get_agent(a).get_state().status == "ready"
            ])
        }
        
        # 获取任务统计
        tasks = task_manager.list_tasks()
        task_stats = {
            "total": len(tasks),
            "pending": len([t for t in tasks if t["status"] == "pending"]),
            "running": len([t for t in tasks if t["status"] == "running"]),
            "completed": len([t for t in tasks if t["status"] == "completed"]),
            "failed": len([t for t in tasks if t["status"] == "failed"])
        }
        
        # 获取工具统计
        tools = {
            "total": len(tool_manager.list_tools()),
            "types": len(set(t["type"] for t in tool_manager.list_tools()))
        }
        
        # 获取事件统计
        events = {
            "total": len(event_bus.get_history()),
            "errors": len([
                e for e in event_bus.get_history()
                if "error" in e["type"].lower()
            ])
        }
        
        return {
            "status": "running",
            "version": "0.1.0",
            "uptime": 0.0,  # TODO: 实现uptime计算
            "agents": agents,
            "tasks": task_stats,
            "tools": tools,
            "events": events
        }
    except Exception as e:
        logger.error(f"Failed to get system status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics", response_model=SystemMetrics)
async def get_system_metrics(
    user: Dict[str, Any] = Depends(SecurityDependency("system:read"))
):
    """获取系统指标"""
    try:
        # TODO: 实现系统指标收集
        return {
            "cpu_usage": 0.0,
            "memory_usage": 0.0,
            "disk_usage": 0.0,
            "network_io": {
                "in": 0,
                "out": 0
            },
            "task_throughput": 0.0,
            "error_rate": 0.0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/events", response_model=List[SystemEvent])
async def get_system_events(
    event_type: Optional[str] = None,
    limit: Optional[int] = 100,
    user: Dict[str, Any] = Depends(SecurityDependency("system:read"))
):
    """获取系统事件"""
    try:
        events = event_bus.get_history(event_type, limit)
        return [
            {
                "type": e["type"],
                "data": e["data"],
                "timestamp": datetime.fromisoformat(e["timestamp"])
            }
            for e in events
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset")
async def reset_system(
    user: Dict[str, Any] = Depends(SecurityDependency("system:manage"))
):
    """重置系统"""
    try:
        # 停止所有代理
        for agent_id in AgentRegistry.list_agents():
            agent = AgentRegistry.get_agent(agent_id)
            if agent:
                agent.cleanup()
                AgentRegistry.unregister(agent_id)
        
        # 清理事件历史
        event_bus.clear_history()
        
        # 重新初始化管理器
        task_manager.initialize()
        tool_manager.initialize()
        
        return {"message": "System reset successfully"}
    except Exception as e:
        logger.error(f"Failed to reset system: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))