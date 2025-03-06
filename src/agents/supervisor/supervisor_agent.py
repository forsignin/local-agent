from typing import Dict, Any, List, Optional
from ..base import BaseAgent, AgentRegistry
import asyncio
import uuid
from datetime import datetime
import logging
from src.common.config.settings import settings

class SupervisorAgent(BaseAgent):
    """监督代理实现"""
    
    def __init__(self):
        super().__init__(f"supervisor_{uuid.uuid4().hex[:8]}")
        self.monitored_agents: Dict[str, Dict[str, Any]] = {}
        self.performance_metrics: Dict[str, List[Dict[str, Any]]] = {}
        self.alerts: List[Dict[str, Any]] = []

    async def initialize(self) -> bool:
        """初始化监督代理"""
        try:
            # 开始监控循环
            asyncio.create_task(self._monitoring_loop())
            await self.update_state("ready")
            self.logger.info(f"Supervisor {self.agent_id} initialized")
            return True
        except Exception as e:
            await self.handle_error(e)
            return False

    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """处理监督任务"""
        try:
            task_type = task.get("type", "monitor")
            task_id = task.get("task_id", uuid.uuid4().hex)
            
            if task_type == "monitor":
                result = await self._monitor_agents()
            elif task_type == "analyze":
                result = await self._analyze_performance()
            elif task_type == "alert":
                result = await self._process_alerts()
            else:
                result = {"status": "error", "error": "Unknown task type"}
            
            return {
                "task_id": task_id,
                "status": "completed",
                "result": result
            }
        except Exception as e:
            await self.handle_error(e)
            return {"status": "error", "error": str(e)}

    async def cleanup(self) -> bool:
        """清理资源"""
        try:
            self.monitored_agents = {}
            self.performance_metrics = {}
            self.alerts = []
            await self.update_state("shutdown")
            return True
        except Exception as e:
            await self.handle_error(e)
            return False

    async def _monitoring_loop(self) -> None:
        """监控循环"""
        while True:
            try:
                await self._update_agent_states()
                await self._check_performance()
                await self._generate_alerts()
                await asyncio.sleep(settings.TASK_TIMEOUT)  # 监控间隔
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {str(e)}")
                await asyncio.sleep(5)  # 错误后短暂等待

    async def _update_agent_states(self) -> None:
        """更新代理状态"""
        agents = AgentRegistry.list_agents()
        for agent_id in agents:
            agent = AgentRegistry.get_agent(agent_id)
            if agent:
                self.monitored_agents[agent_id] = {
                    "state": agent.get_state().dict(),
                    "last_check": datetime.now()
                }

    async def _check_performance(self) -> None:
        """检查性能指标"""
        for agent_id, data in self.monitored_agents.items():
            metrics = {
                "timestamp": datetime.now(),
                "state": data["state"]["status"],
                "task_count": len(data["state"].get("metadata", {}).get("tasks", [])),
                "last_update": data["state"]["last_update"]
            }
            
            if agent_id not in self.performance_metrics:
                self.performance_metrics[agent_id] = []
            
            self.performance_metrics[agent_id].append(metrics)
            
            # 保持最近100条记录
            if len(self.performance_metrics[agent_id]) > 100:
                self.performance_metrics[agent_id] = self.performance_metrics[agent_id][-100:]

    async def _generate_alerts(self) -> None:
        """生成告警"""
        for agent_id, metrics in self.performance_metrics.items():
            if not metrics:
                continue
                
            latest = metrics[-1]
            
            # 检查代理状态
            if latest["state"] == "error":
                self._add_alert(agent_id, "error", f"Agent {agent_id} is in error state")
            
            # 检查更新时间
            last_update = latest["last_update"]
            if (datetime.now() - last_update).total_seconds() > settings.TASK_TIMEOUT:
                self._add_alert(agent_id, "warning", f"Agent {agent_id} has not updated for {settings.TASK_TIMEOUT} seconds")

    def _add_alert(self, agent_id: str, level: str, message: str) -> None:
        """添加告警"""
        alert = {
            "timestamp": datetime.now(),
            "agent_id": agent_id,
            "level": level,
            "message": message
        }
        self.alerts.append(alert)
        self.logger.warning(f"Alert generated: {message}")

    async def _monitor_agents(self) -> Dict[str, Any]:
        """监控代理状态"""
        return {
            "agents": self.monitored_agents,
            "timestamp": datetime.now().isoformat()
        }

    async def _analyze_performance(self) -> Dict[str, Any]:
        """分析性能指标"""
        analysis = {}
        for agent_id, metrics in self.performance_metrics.items():
            if not metrics:
                continue
                
            analysis[agent_id] = {
                "total_tasks": sum(m["task_count"] for m in metrics),
                "current_state": metrics[-1]["state"],
                "performance_trend": self._calculate_trend(metrics)
            }
        
        return analysis

    async def _process_alerts(self) -> Dict[str, Any]:
        """处理告警"""
        return {
            "alerts": self.alerts[-10:],  # 最近10条告警
            "total_alerts": len(self.alerts),
            "timestamp": datetime.now().isoformat()
        }

    def _calculate_trend(self, metrics: List[Dict[str, Any]]) -> str:
        """计算性能趋势"""
        if len(metrics) < 2:
            return "stable"
            
        recent_tasks = metrics[-1]["task_count"]
        previous_tasks = metrics[-2]["task_count"]
        
        if recent_tasks > previous_tasks:
            return "increasing"
        elif recent_tasks < previous_tasks:
            return "decreasing"
        else:
            return "stable" 