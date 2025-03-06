from typing import Dict, List, Callable, Any, Awaitable
import asyncio
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class EventBus:
    """事件总线"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance.initialize()
        return cls._instance
    
    def initialize(self):
        """初始化事件总线"""
        self.subscribers: Dict[str, List[Callable[..., Awaitable[None]]]] = {}
        self.event_history: List[Dict[str, Any]] = []
        self.max_history = 1000
        logger.info("Event bus initialized")

    async def publish(self, event_type: str, data: Any = None) -> None:
        """发布事件"""
        try:
            # 记录事件
            event = {
                "type": event_type,
                "data": data,
                "timestamp": datetime.now().isoformat()
            }
            self.event_history.append(event)
            
            # 维护历史记录大小
            if len(self.event_history) > self.max_history:
                self.event_history = self.event_history[-self.max_history:]
            
            # 通知订阅者
            if event_type in self.subscribers:
                tasks = []
                for subscriber in self.subscribers[event_type]:
                    tasks.append(asyncio.create_task(subscriber(event)))
                
                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)
            
            logger.debug(f"Event published: {event_type}")
        except Exception as e:
            logger.error(f"Failed to publish event {event_type}: {str(e)}")

    def subscribe(self, event_type: str, callback: Callable[..., Awaitable[None]]) -> None:
        """订阅事件"""
        try:
            if event_type not in self.subscribers:
                self.subscribers[event_type] = []
            self.subscribers[event_type].append(callback)
            logger.debug(f"Subscribed to event: {event_type}")
        except Exception as e:
            logger.error(f"Failed to subscribe to event {event_type}: {str(e)}")

    def unsubscribe(self, event_type: str, callback: Callable[..., Awaitable[None]]) -> None:
        """取消订阅"""
        try:
            if event_type in self.subscribers:
                self.subscribers[event_type].remove(callback)
                if not self.subscribers[event_type]:
                    del self.subscribers[event_type]
            logger.debug(f"Unsubscribed from event: {event_type}")
        except Exception as e:
            logger.error(f"Failed to unsubscribe from event {event_type}: {str(e)}")

    def get_history(self, event_type: str = None, limit: int = None) -> List[Dict[str, Any]]:
        """获取事件历史"""
        try:
            history = self.event_history
            if event_type:
                history = [e for e in history if e["type"] == event_type]
            if limit:
                history = history[-limit:]
            return history
        except Exception as e:
            logger.error(f"Failed to get event history: {str(e)}")
            return []

    def clear_history(self) -> None:
        """清除事件历史"""
        try:
            self.event_history = []
            logger.debug("Event history cleared")
        except Exception as e:
            logger.error(f"Failed to clear event history: {str(e)}")

# 预定义事件类型
class EventTypes:
    # 任务相关事件
    TASK_CREATED = "task.created"
    TASK_STARTED = "task.started"
    TASK_COMPLETED = "task.completed"
    TASK_FAILED = "task.failed"
    
    # 代理相关事件
    AGENT_INITIALIZED = "agent.initialized"
    AGENT_STARTED = "agent.started"
    AGENT_STOPPED = "agent.stopped"
    AGENT_ERROR = "agent.error"
    
    # 工具相关事件
    TOOL_STARTED = "tool.started"
    TOOL_COMPLETED = "tool.completed"
    TOOL_FAILED = "tool.failed"
    
    # 系统相关事件
    SYSTEM_STARTED = "system.started"
    SYSTEM_STOPPED = "system.stopped"
    SYSTEM_ERROR = "system.error"