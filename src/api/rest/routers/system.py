from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta
import logging
import psutil
import time
import os

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

# 记录系统启动时间
SYSTEM_START_TIME = time.time()

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
    network_io: Dict[str, float]

class SystemEvent(BaseModel):
    """系统事件模型"""
    type: str
    data: Dict[str, Any]
    timestamp: datetime

class SystemConfig(BaseModel):
    """系统配置模型"""
    version: str
    environment: str
    features: Dict[str, bool]
    limits: Dict[str, int]
    ui: Dict[str, Any]

def get_system_uptime() -> float:
    """获取系统运行时间（秒）"""
    return time.time() - SYSTEM_START_TIME

def get_system_resource_usage() -> Dict[str, float]:
    """获取系统资源使用情况"""
    try:
        cpu_usage = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        net_io = psutil.net_io_counters()
        
        return {
            "cpu_usage": cpu_usage,
            "memory_usage": memory.percent,
            "disk_usage": disk.percent,
            "network_io": {
                "rx_bytes": net_io.bytes_recv,
                "tx_bytes": net_io.bytes_sent
            }
        }
    except Exception as e:
        logger.error(f"Failed to get system resource usage: {str(e)}")
        return {
            "cpu_usage": 0.0,
            "memory_usage": 0.0,
            "disk_usage": 0.0,
            "network_io": {"rx_bytes": 0, "tx_bytes": 0}
        }

@router.get("/status", response_model=SystemStatus)
async def get_system_status(
    user: Dict = Depends(SecurityDependency())
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
            "uptime": get_system_uptime(),
            "agents": agents,
            "tasks": task_stats,
            "tools": tools,
            "events": events
        }
    except Exception as e:
        logger.error(f"Failed to get system status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/config", response_model=SystemConfig)
async def get_system_config(user: Dict = Depends(SecurityDependency())):
    """获取系统配置"""
    return {
        "version": "1.0.0",
        "environment": "development",
        "features": {
            "code_execution": True,
            "file_processing": True,
            "network_access": True,
            "data_analysis": True
        },
        "limits": {
            "max_tasks": 100,
            "max_agents": 10,
            "max_file_size": 10485760  # 10MB
        },
        "ui": {
            "theme": "light",
            "language": "zh-CN",
            "dateFormat": "YYYY-MM-DD HH:mm:ss",
            "timezone": "Asia/Shanghai",
            "features": {
                "darkMode": True,
                "notifications": True,
                "realTimeUpdates": True
            }
        }
    }

@router.get("/metrics", response_model=SystemMetrics)
async def get_system_metrics(user: Dict = Depends(SecurityDependency())):
    """获取系统指标"""
    return get_system_resource_usage()

@router.get("/dashboard/metrics")
async def get_dashboard_metrics(user: Dict = Depends(SecurityDependency())):
    """获取仪表盘指标"""
    try:
        # 获取系统资源使用情况
        resource_usage = get_system_resource_usage()
        
        # 获取任务统计
        tasks = task_manager.list_tasks()
        completed_tasks = len([t for t in tasks if t["status"] == "completed"])
        failed_tasks = len([t for t in tasks if t["status"] == "failed"])
        total_tasks = len(tasks)
        
        # 计算错误率
        error_rate = failed_tasks / total_tasks if total_tasks > 0 else 0
        
        # 评估系统健康状态
        health_status = "good"
        if resource_usage["cpu_usage"] > 80 or resource_usage["memory_usage"] > 80:
            health_status = "warning"
        if error_rate > 0.1:  # 如果错误率超过10%
            health_status = "critical"
            
        return {
            "active_agents": len([
                a for a in AgentRegistry.list_agents()
                if AgentRegistry.get_agent(a).get_state().status == "ready"
            ]),
            "completed_tasks": completed_tasks,
            "error_rate": round(error_rate, 4),
            "system_health": health_status,
            "system_metrics": {
                "cpu_usage": resource_usage["cpu_usage"],
                "memory_usage": resource_usage["memory_usage"],
                "disk_usage": resource_usage["disk_usage"]
            },
            "uptime": get_system_uptime()
        }
    except Exception as e:
        logger.error(f"Failed to get dashboard metrics: {str(e)}")
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