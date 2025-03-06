from abc import ABC, abstractmethod
from typing import Dict, Any, List
from pydantic import BaseModel
import asyncio
import logging
from datetime import datetime

class AgentState(BaseModel):
    """代理状态模型"""
    agent_id: str
    status: str
    current_task: Dict[str, Any] = None
    last_update: datetime = datetime.now()
    metadata: Dict[str, Any] = {}

class BaseAgent(ABC):
    """基础代理类"""
    def __init__(self, agent_id: str):
        self.agent_id = agent_id
        self.state = AgentState(
            agent_id=agent_id,
            status="initialized"
        )
        self.logger = logging.getLogger(f"agent.{agent_id}")

    @abstractmethod
    async def initialize(self) -> bool:
        """初始化代理"""
        pass

    @abstractmethod
    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """处理任务"""
        pass

    @abstractmethod
    async def cleanup(self) -> bool:
        """清理资源"""
        pass

    async def update_state(self, status: str, metadata: Dict[str, Any] = None) -> None:
        """更新代理状态"""
        self.state.status = status
        self.state.last_update = datetime.now()
        if metadata:
            self.state.metadata.update(metadata)
        self.logger.info(f"Agent {self.agent_id} state updated: {status}")

    async def handle_error(self, error: Exception) -> None:
        """错误处理"""
        self.logger.error(f"Error in agent {self.agent_id}: {str(error)}")
        await self.update_state("error", {"error": str(error)})

    def get_state(self) -> AgentState:
        """获取当前状态"""
        return self.state

class AgentRegistry:
    """代理注册表"""
    _instance = None
    _agents: Dict[str, BaseAgent] = {}

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @classmethod
    def register(cls, agent: BaseAgent) -> None:
        """注册代理"""
        cls._agents[agent.agent_id] = agent

    @classmethod
    def unregister(cls, agent_id: str) -> None:
        """注销代理"""
        if agent_id in cls._agents:
            del cls._agents[agent_id]

    @classmethod
    def get_agent(cls, agent_id: str) -> BaseAgent:
        """获取代理"""
        return cls._agents.get(agent_id)

    @classmethod
    def list_agents(cls) -> List[str]:
        """列出所有代理"""
        return list(cls._agents.keys()) 