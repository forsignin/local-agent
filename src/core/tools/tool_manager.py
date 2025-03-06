from typing import Dict, Any, List, Optional, Type
import logging
from datetime import datetime
import importlib
import inspect
from src.common.events.event_bus import EventBus

logger = logging.getLogger(__name__)

class ToolManager:
    """工具链管理器"""
    
    def __init__(self):
        self.tools: Dict[str, Dict[str, Any]] = {}
        self.tool_instances: Dict[str, Any] = {}
        self.event_bus = EventBus()

    def initialize(self) -> None:
        """初始化工具链管理器"""
        try:
            # 注册内置工具
            self._register_builtin_tools()
            logger.info("Tool manager initialized")
        except Exception as e:
            logger.error(f"Failed to initialize tool manager: {str(e)}")
            raise

    def _register_builtin_tools(self) -> None:
        """注册内置工具"""
        from src.agents.executor.tools.code_runner import CodeRunner
        from src.agents.executor.tools.file_processor import FileProcessor
        from src.agents.executor.tools.network_tool import NetworkTool
        from src.agents.executor.tools.data_analyzer import DataAnalyzer
        
        builtin_tools = {
            "code_runner": {
                "name": "代码执行器",
                "description": "执行Python代码",
                "class": CodeRunner,
                "type": "code",
                "async": True
            },
            "file_processor": {
                "name": "文件处理器",
                "description": "处理文件操作",
                "class": FileProcessor,
                "type": "file",
                "async": True
            },
            "network_tool": {
                "name": "网络工具",
                "description": "处理网络请求",
                "class": NetworkTool,
                "type": "network",
                "async": True
            },
            "data_analyzer": {
                "name": "数据分析器",
                "description": "分析数据",
                "class": DataAnalyzer,
                "type": "data",
                "async": True
            }
        }
        
        for tool_id, tool_info in builtin_tools.items():
            self.register_tool(tool_id, tool_info)

    def register_tool(self, tool_id: str, tool_info: Dict[str, Any]) -> None:
        """注册工具"""
        try:
            # 创建工具实例
            tool_class = tool_info["class"]
            tool_instance = tool_class()
            
            # 存储工具信息
            self.tools[tool_id] = {
                "id": tool_id,
                "name": tool_info["name"],
                "description": tool_info["description"],
                "type": tool_info["type"],
                "async": tool_info.get("async", False)
            }
            self.tool_instances[tool_id] = tool_instance
            
            logger.info(f"Tool {tool_id} registered")
        except Exception as e:
            logger.error(f"Failed to register tool {tool_id}: {str(e)}")
            raise

    def get_tool_info(self, tool_id: str) -> Optional[Dict[str, Any]]:
        """获取工具信息"""
        return self.tools.get(tool_id)

    def get_tool_instance(self, tool_id: str) -> Optional[Any]:
        """获取工具实例"""
        return self.tool_instances.get(tool_id)

    def list_tools(self) -> List[Dict[str, Any]]:
        """列出所有工具"""
        return list(self.tools.values())

    def get_tools_by_type(self, tool_type: str) -> List[Dict[str, Any]]:
        """获取指定类型的工具"""
        return [
            tool for tool in self.tools.values()
            if tool["type"] == tool_type
        ]

    def execute_tool(self, tool_id: str, method: str, **params) -> Dict[str, Any]:
        """执行工具"""
        try:
            tool_instance = self.get_tool_instance(tool_id)
            if not tool_instance:
                raise ValueError(f"Tool {tool_id} not found")
            
            # 获取方法
            tool_method = getattr(tool_instance, method, None)
            if not tool_method:
                raise ValueError(f"Method {method} not found in tool {tool_id}")
            
            # 执行方法
            result = tool_method(**params)
            
            # 发布事件
            self.event_bus.publish("tool.executed", {
                "tool_id": tool_id,
                "method": method,
                "params": params,
                "result": result
            })
            
            return result
        except Exception as e:
            logger.error(f"Failed to execute tool {tool_id}: {str(e)}")
            raise

    def cleanup(self) -> None:
        """清理资源"""
        try:
            for tool_id, tool_instance in self.tool_instances.items():
                if hasattr(tool_instance, "cleanup"):
                    tool_instance.cleanup()
            
            self.tools.clear()
            self.tool_instances.clear()
            logger.info("Tool manager cleaned up")
        except Exception as e:
            logger.error(f"Failed to cleanup tool manager: {str(e)}")
            raise 