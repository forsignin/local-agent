from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from pydantic import BaseModel
from datetime import datetime, timedelta

from src.common.security.middleware import SecurityDependency
from src.agents.base import AgentRegistry
from src.core.task.task_manager import TaskManager
from src.core.tools.tool_manager import ToolManager

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

class Task(BaseModel):
    id: str
    type: str
    status: str
    created_at: datetime
    updated_at: datetime
    metadata: Dict[str, Any] = {}

class Agent(BaseModel):
    id: str
    name: str
    status: str
    type: str

class Tool(BaseModel):
    id: str
    name: str
    usageCount: int

class SystemEvent(BaseModel):
    id: str
    type: str
    source: str
    timestamp: datetime
    level: str
    message: str
    metadata: Dict[str, Any] = {}

class DashboardMetrics(BaseModel):
    """仪表盘指标模型"""
    tasks: Dict[str, Any]
    agents: Dict[str, Any]
    tools: Dict[str, Any]
    recentTasks: List[Task]
    recentEvents: List[SystemEvent]
    activeAgents: List[Agent]
    popularTools: List[Tool]

@router.get("/metrics", response_model=DashboardMetrics)
async def get_dashboard_metrics(user: Dict = Depends(SecurityDependency())):
    """获取仪表盘指标"""
    try:
        now = datetime.now()
        
        # 任务统计
        tasks = {
            "total": 100,
            "completed": 75,
            "failed": 5,
            "running": 15,
            "pending": 5,
            "successRate": 0.95,
            "averageCompletionTime": 120
        }
        
        # 代理统计
        agents = {
            "total": 10,
            "active": 8,
            "idle": 2,
            "error": 0,
            "utilization": 0.8
        }
        
        # 工具统计
        tools = {
            "total": 20,
            "enabled": 18,
            "disabled": 2,
            "mostUsed": [
                {"id": "tool1", "name": "分析工具", "usageCount": 150},
                {"id": "tool2", "name": "执行工具", "usageCount": 120}
            ]
        }
        
        # 最近任务
        recent_tasks = [
            Task(
                id="task1",
                type="analysis",
                status="completed",
                created_at=now - timedelta(hours=1),
                updated_at=now,
                metadata={"result": "success"}
            )
        ]
        
        # 最近事件
        recent_events = [
            SystemEvent(
                id="event1",
                type="task_completed",
                source="system",
                timestamp=now - timedelta(minutes=5),
                level="info",
                message="数据分析任务完成",
                metadata={"taskId": "task1"}
            )
        ]
        
        # 活跃代理
        active_agents = [
            Agent(
                id="agent1",
                name="分析代理",
                status="active",
                type="analyzer"
            )
        ]
        
        # 热门工具
        popular_tools = [
            Tool(
                id="tool1",
                name="分析工具",
                usageCount=150
            )
        ]
        
        return {
            "tasks": tasks,
            "agents": agents,
            "tools": tools,
            "recentTasks": recent_tasks,
            "recentEvents": recent_events,
            "activeAgents": active_agents,
            "popularTools": popular_tools
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 