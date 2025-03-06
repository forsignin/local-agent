from typing import Dict, Any, List, Optional
from ..base import BaseAgent, AgentRegistry
from ..executor.executor_agent import ExecutorAgent
from ..supervisor.supervisor_agent import SupervisorAgent
import asyncio
import uuid
from datetime import datetime
import logging
from src.common.config.settings import settings

class ControllerAgent(BaseAgent):
    """控制器代理实现"""
    
    def __init__(self):
        super().__init__(f"controller_{uuid.uuid4().hex[:8]}")
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.executor: Optional[ExecutorAgent] = None
        self.supervisor: Optional[SupervisorAgent] = None

    async def initialize(self) -> bool:
        """初始化控制器代理"""
        try:
            # 初始化执行代理
            self.executor = ExecutorAgent()
            await self.executor.initialize()
            AgentRegistry.register(self.executor)
            
            # 初始化监督代理
            self.supervisor = SupervisorAgent()
            await self.supervisor.initialize()
            AgentRegistry.register(self.supervisor)
            
            await self.update_state("ready")
            self.logger.info(f"Controller {self.agent_id} initialized with executor and supervisor")
            return True
        except Exception as e:
            await self.handle_error(e)
            return False

    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """处理任务"""
        try:
            task_id = uuid.uuid4().hex
            task["task_id"] = task_id
            self.tasks[task_id] = {
                "task": task,
                "status": "pending",
                "created_at": datetime.now(),
                "result": None
            }
            
            await self.update_state("processing", {"task_id": task_id})
            
            # 1. 任务分析和规划
            plan = await self._analyze_task(task)
            
            # 2. 分配任务给执行代理
            if self.executor:
                execution_result = await self.executor.process_task(task)
                self.tasks[task_id]["result"] = execution_result
                
                # 3. 监督任务执行
                if self.supervisor:
                    await self.supervisor.process_task({
                        "type": "monitor",
                        "target": self.executor.agent_id,
                        "task_id": task_id
                    })
            
            # 4. 更新任务状态
            self.tasks[task_id]["status"] = "completed"
            await self.update_state("completed", {"task_id": task_id})
            
            return {
                "task_id": task_id,
                "status": "completed",
                "result": self.tasks[task_id]["result"]
            }
        except Exception as e:
            if task_id in self.tasks:
                self.tasks[task_id]["status"] = "error"
                self.tasks[task_id]["error"] = str(e)
            await self.handle_error(e)
            return {"status": "error", "error": str(e)}

    async def cleanup(self) -> bool:
        """清理资源"""
        try:
            # 清理执行代理
            if self.executor:
                await self.executor.cleanup()
                AgentRegistry.unregister(self.executor.agent_id)
            
            # 清理监督代理
            if self.supervisor:
                await self.supervisor.cleanup()
                AgentRegistry.unregister(self.supervisor.agent_id)
            
            self.tasks = {}
            await self.update_state("shutdown")
            return True
        except Exception as e:
            await self.handle_error(e)
            return False

    async def _analyze_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """分析任务并制定执行计划"""
        task_type = task.get("type", "general")
        content = task.get("content", "")
        metadata = task.get("metadata", {})
        
        plan = {
            "task_id": task["task_id"],
            "type": task_type,
            "steps": []
        }
        
        if task_type == "code_analysis":
            plan["steps"] = [
                {"action": "analyze_code", "tool": "code_runner"},
                {"action": "generate_report", "tool": "data_analyzer"}
            ]
        elif task_type == "file_operation":
            plan["steps"] = [
                {"action": "process_file", "tool": "file_processor"}
            ]
        elif task_type == "data_processing":
            plan["steps"] = [
                {"action": "analyze_data", "tool": "data_analyzer"},
                {"action": "process_results", "tool": "file_processor"}
            ]
        else:
            plan["steps"] = [
                {"action": "general_processing", "tool": "code_runner"}
            ]
        
        return plan

    def get_state(self) -> Dict[str, Any]:
        """获取代理状态"""
        state = super().get_state()
        state.metadata["tasks"] = [
            {
                "task_id": task_id,
                "status": task_data["status"],
                "created_at": task_data["created_at"].isoformat()
            }
            for task_id, task_data in self.tasks.items()
        ]
        return state 