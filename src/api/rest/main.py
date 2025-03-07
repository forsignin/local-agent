from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uvicorn
import asyncio
import logging
import os

from src.common.config.settings import settings
from src.agents.controller.controller_agent import ControllerAgent
from src.agents.base import AgentRegistry
from src.api.rest.routers import (
    tool, agent, system, auth, task, dashboard,
    code_runner, data_analyzer, executor, network
)  # 导入路由模块
from src.database import init_db

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    description="本地 AI Agent 系统",
    version="0.1.0"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 明确指定前端域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录
app.mount("/static", StaticFiles(directory="static"), name="static")

# 初始化数据库
init_db()

# 创建API路由
api_router = FastAPI(title="API")

# 注册子路由
api_router.include_router(tool.router)
api_router.include_router(agent.router)
api_router.include_router(system.router)
api_router.include_router(auth.router)
api_router.include_router(task.router)
api_router.include_router(dashboard.router)
api_router.include_router(code_runner.router)
api_router.include_router(data_analyzer.router)
api_router.include_router(executor.router)
api_router.include_router(network.router)

# 将API路由挂载到主应用
app.mount("/api", api_router)

# 请求模型
class TaskRequest(BaseModel):
    content: str
    type: Optional[str] = "general"
    metadata: Optional[Dict[str, Any]] = {}

# 响应模型
class TaskResponse(BaseModel):
    task_id: str
    status: str
    result: Optional[Dict[str, Any]] = None

class AgentState(BaseModel):
    agent_id: str
    status: str
    type: str
    metadata: Optional[Dict[str, Any]] = None

class SystemStatus(BaseModel):
    status: str
    controller: Dict[str, Any]
    agents: List[AgentState]
    tasks: List[Dict[str, Any]]

# 全局控制器代理
controller: Optional[ControllerAgent] = None

@app.on_event("startup")
async def startup_event():
    """应用启动时初始化"""
    global controller
    controller = ControllerAgent()
    await controller.initialize()
    AgentRegistry.register(controller)
    logger.info("Application started, controller initialized")

@app.on_event("shutdown")
async def shutdown_event():
    """应用关闭时清理"""
    global controller
    if controller:
        await controller.cleanup()
        AgentRegistry.unregister(controller.agent_id)
    logger.info("Application shutdown, controller cleaned up")

@app.post("/tasks", response_model=TaskResponse)
async def create_task(task: TaskRequest):
    """创建新任务"""
    if not controller:
        raise HTTPException(status_code=503, detail="Controller not initialized")
    
    try:
        result = await controller.process_task({
            "content": task.content,
            "type": task.type,
            "metadata": task.metadata
        })
        
        return TaskResponse(
            task_id=result.get("task_id", ""),
            status=result.get("status", "unknown"),
            result=result
        )
    except Exception as e:
        logger.error(f"Error processing task: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str):
    """获取任务状态"""
    if not controller:
        raise HTTPException(status_code=503, detail="Controller not initialized")
    
    task = controller.tasks.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskResponse(
        task_id=task_id,
        status=task["status"],
        result=task.get("result")
    )

@app.get("/agents", response_model=Dict[str, List[AgentState]])
async def list_agents():
    """列出所有代理"""
    agents = []
    for agent_id in AgentRegistry.list_agents():
        agent = AgentRegistry.get_agent(agent_id)
        if agent:
            state = agent.get_state()
            agents.append(AgentState(
                agent_id=agent_id,
                status=state.status,
                type=agent.__class__.__name__,
                metadata=state.metadata
            ))
    
    return {"agents": agents}

@app.get("/status", response_model=SystemStatus)
async def get_status():
    """获取系统状态"""
    if not controller:
        raise HTTPException(status_code=503, detail="Controller not initialized")
    
    # 获取所有代理状态
    agents = []
    for agent_id in AgentRegistry.list_agents():
        agent = AgentRegistry.get_agent(agent_id)
        if agent:
            state = agent.get_state()
            agents.append(AgentState(
                agent_id=agent_id,
                status=state.status,
                type=agent.__class__.__name__,
                metadata=state.metadata
            ))
    
    # 获取所有任务
    tasks = [
        {
            "task_id": task_id,
            "status": task_data["status"],
            "created_at": task_data["created_at"].isoformat(),
            "type": task_data["task"].get("type", "general")
        }
        for task_id, task_data in controller.tasks.items()
    ]
    
    return SystemStatus(
        status="running",
        controller=controller.get_state().dict(),
        agents=agents,
        tasks=tasks
    )

if __name__ == "__main__":
    uvicorn.run(
        "src.api.rest.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.DEBUG else False
    ) 