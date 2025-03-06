from typing import Dict, Any, List, Optional
import logging
from datetime import datetime
import uuid

from src.storage.database.manager import DatabaseManager
from src.storage.database.models import Task, AgentState, ExecutionLog
from src.common.events.event_bus import EventBus

logger = logging.getLogger(__name__)

class TaskManager:
    """任务管理器"""
    
    def __init__(self):
        self.db_manager = DatabaseManager()
        self.event_bus = EventBus()
        self.tasks: Dict[str, Dict[str, Any]] = {}

    def initialize(self) -> None:
        """初始化任务管理器"""
        try:
            # 从数据库加载任务
            with self.db_manager.get_session() as session:
                tasks = session.query(Task).all()
                for task in tasks:
                    self.tasks[str(task.id)] = {
                        "task": {
                            "type": task.type,
                            "metadata": task.task_metadata
                        },
                        "status": task.status,
                        "created_at": task.created_at
                    }
            logger.info("Task manager initialized")
        except Exception as e:
            logger.error(f"Failed to initialize task manager: {str(e)}")
            raise

    def create_task(self, task_data: Dict[str, Any]) -> str:
        """创建新任务"""
        try:
            task_id = str(uuid.uuid4())
            
            # 保存到数据库
            with self.db_manager.get_session() as session:
                task = Task(
                    id=task_id,
                    type=task_data.get("type", "general"),
                    status="pending",
                    task_metadata=task_data.get("metadata", {})
                )
                session.add(task)
                session.commit()
            
            # 保存到内存
            self.tasks[task_id] = {
                "task": task_data,
                "status": "pending",
                "created_at": datetime.now()
            }
            
            # 发布事件
            self.event_bus.publish("task.created", {
                "task_id": task_id,
                "task": task_data
            })
            
            return task_id
        except Exception as e:
            logger.error(f"Failed to create task: {str(e)}")
            raise

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """获取任务"""
        return self.tasks.get(task_id)

    def update_task_status(self, task_id: str, status: str, result: Optional[Dict[str, Any]] = None) -> None:
        """更新任务状态"""
        try:
            if task_id not in self.tasks:
                raise ValueError(f"Task {task_id} not found")
            
            # 更新数据库
            with self.db_manager.get_session() as session:
                task = session.query(Task).filter(Task.id == task_id).first()
                if task:
                    task.status = status
                    if result:
                        task.task_metadata.update({"result": result})
                    session.commit()
            
            # 更新内存
            self.tasks[task_id]["status"] = status
            if result:
                self.tasks[task_id]["result"] = result
            
            # 发布事件
            self.event_bus.publish("task.updated", {
                "task_id": task_id,
                "status": status,
                "result": result
            })
        except Exception as e:
            logger.error(f"Failed to update task status: {str(e)}")
            raise

    def list_tasks(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """列出任务"""
        try:
            with self.db_manager.get_session() as session:
                query = session.query(Task)
                
                if filters:
                    if "status" in filters:
                        query = query.filter(Task.status == filters["status"])
                    if "type" in filters:
                        query = query.filter(Task.type == filters["type"])
                
                tasks = query.all()
                return [
                    {
                        "id": str(task.id),
                        "type": task.type,
                        "status": task.status,
                        "metadata": task.task_metadata,
                        "created_at": task.created_at,
                        "updated_at": task.updated_at
                    }
                    for task in tasks
                ]
        except Exception as e:
            logger.error(f"Failed to list tasks: {str(e)}")
            raise

    def cleanup(self) -> None:
        """清理资源"""
        try:
            self.db_manager.cleanup()
            self.tasks.clear()
            logger.info("Task manager cleaned up")
        except Exception as e:
            logger.error(f"Failed to cleanup task manager: {str(e)}")
            raise 