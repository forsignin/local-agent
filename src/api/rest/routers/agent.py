from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel

from src.agents.base import AgentRegistry
from src.common.security.middleware import SecurityDependency

router = APIRouter(prefix="/agents", tags=["agents"])

class AgentState(BaseModel):
    """代理状态模型"""
    agent_id: str
    status: str
    type: str
    metadata: Dict[str, Any] = {}

@router.get("", response_model=Dict[str, List[AgentState]])
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

@router.get("/{agent_id}", response_model=AgentState)
async def get_agent(agent_id: str):
    """获取指定代理的状态"""
    agent = AgentRegistry.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    state = agent.get_state()
    return AgentState(
        agent_id=agent_id,
        status=state.status,
        type=agent.__class__.__name__,
        metadata=state.metadata
    ) 