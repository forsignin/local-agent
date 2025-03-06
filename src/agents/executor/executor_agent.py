from typing import Dict, Any, List, Optional
from ..base import BaseAgent
import asyncio
import uuid
from datetime import datetime
import logging
from src.common.config.settings import settings

from .tools.code_runner import CodeRunner
from .tools.file_processor import FileProcessor
from .tools.network_tool import NetworkTool
from .tools.data_analyzer import DataAnalyzer

class ExecutorAgent(BaseAgent):
    """执行代理实现"""
    
    def __init__(self):
        super().__init__(f"executor_{uuid.uuid4().hex[:8]}")
        self.current_task: Optional[Dict[str, Any]] = None
        self.tools: Dict[str, Any] = {}
        self.results: Dict[str, Any] = {}

    async def initialize(self) -> bool:
        """初始化执行代理"""
        try:
            # 初始化工具集
            await self._initialize_tools()
            await self.update_state("ready")
            self.logger.info(f"Executor {self.agent_id} initialized")
            return True
        except Exception as e:
            await self.handle_error(e)
            return False

    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """处理任务"""
        try:
            self.current_task = task
            task_id = task.get("task_id", uuid.uuid4().hex)
            await self.update_state("processing", {"task_id": task_id})

            # 1. 选择合适的工具
            tools = await self._select_tools(task)
            
            # 2. 执行任务
            result = await self._execute_task(task, tools)
            
            # 3. 验证结果
            validated_result = await self._validate_result(result)
            
            # 4. 存储结果
            self.results[task_id] = validated_result
            
            await self.update_state("completed", {"task_id": task_id})
            return validated_result
        except Exception as e:
            await self.handle_error(e)
            return {"status": "error", "error": str(e)}
        finally:
            self.current_task = None

    async def cleanup(self) -> bool:
        """清理资源"""
        try:
            # 清理工具资源
            await self._cleanup_tools()
            await self.update_state("shutdown")
            return True
        except Exception as e:
            await self.handle_error(e)
            return False

    async def _initialize_tools(self) -> None:
        """初始化工具集"""
        # 创建工具实例
        code_runner = CodeRunner()
        file_processor = FileProcessor(base_dir="./data")
        network_tool = NetworkTool()
        await network_tool.initialize()
        data_analyzer = DataAnalyzer()
        
        self.tools = {
            "code_runner": {
                "name": "代码执行器",
                "description": "执行Python代码",
                "instance": code_runner,
                "handler": self._run_code
            },
            "file_processor": {
                "name": "文件处理器",
                "description": "处理文件操作",
                "instance": file_processor,
                "handler": self._process_file
            },
            "network_tool": {
                "name": "网络工具",
                "description": "处理网络请求",
                "instance": network_tool,
                "handler": self._handle_network
            },
            "data_analyzer": {
                "name": "数据分析器",
                "description": "分析数据",
                "instance": data_analyzer,
                "handler": self._analyze_data
            }
        }

    async def _select_tools(self, task: Dict[str, Any]) -> List[Dict[str, Any]]:
        """选择合适的工具"""
        task_type = task.get("type", "general")
        selected_tools = []
        
        if task_type == "code_analysis":
            selected_tools.extend([
                self.tools["code_runner"],
                self.tools["data_analyzer"]
            ])
        elif task_type == "file_operation":
            selected_tools.append(self.tools["file_processor"])
        elif task_type == "data_processing":
            selected_tools.extend([
                self.tools["data_analyzer"],
                self.tools["file_processor"]
            ])
        elif task_type == "network_request":
            selected_tools.append(self.tools["network_tool"])
        else:
            # 对于一般任务，根据内容选择工具
            content = task.get("content", "").lower()
            if "code" in content or "python" in content:
                selected_tools.append(self.tools["code_runner"])
            if "file" in content or "data" in content:
                selected_tools.append(self.tools["file_processor"])
            if "http" in content or "api" in content:
                selected_tools.append(self.tools["network_tool"])
            if "analyze" in content or "statistics" in content:
                selected_tools.append(self.tools["data_analyzer"])
        
        return selected_tools

    async def _execute_task(self, task: Dict[str, Any], tools: List[Dict[str, Any]]) -> Dict[str, Any]:
        """执行任务"""
        results = []
        for tool in tools:
            try:
                result = await tool["handler"](task)
                results.append(result)
            except Exception as e:
                self.logger.error(f"Tool {tool['name']} execution failed: {str(e)}")
                results.append({"status": "error", "error": str(e)})
        
        return {
            "status": "completed",
            "results": results,
            "timestamp": datetime.now().isoformat()
        }

    async def _validate_result(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """验证结果"""
        if not result.get("results"):
            return {"status": "error", "error": "No results produced"}
        
        # 检查是否所有工具都执行成功
        all_success = all(r.get("status") == "completed" for r in result["results"])
        if not all_success:
            failed_tools = [
                r.get("error", "Unknown error")
                for r in result["results"]
                if r.get("status") != "completed"
            ]
            result["warnings"] = {
                "message": "Some tools failed to execute",
                "details": failed_tools
            }
        
        return result

    async def _cleanup_tools(self) -> None:
        """清理工具资源"""
        for tool_name, tool_info in self.tools.items():
            try:
                if hasattr(tool_info["instance"], "cleanup"):
                    await tool_info["instance"].cleanup()
            except Exception as e:
                self.logger.error(f"Error cleaning up tool {tool_name}: {str(e)}")
        self.tools = {}

    # 工具处理器
    async def _run_code(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """执行代码"""
        code = task.get("content", "")
        timeout = task.get("timeout", 30)
        
        runner = self.tools["code_runner"]["instance"]
        return await runner.run(code, timeout)

    async def _process_file(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """处理文件"""
        operation = task.get("operation", "read")
        file_path = task.get("file_path", "")
        content = task.get("content")
        format = task.get("format")
        
        processor = self.tools["file_processor"]["instance"]
        return await processor.process(operation, file_path, content, format)

    async def _handle_network(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """处理网络请求"""
        method = task.get("method", "GET")
        url = task.get("url", "")
        kwargs = task.get("kwargs", {})
        
        network_tool = self.tools["network_tool"]["instance"]
        return await network_tool.request(method, url, **kwargs)

    async def _analyze_data(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """分析数据"""
        data = task.get("data", [])
        analysis_type = task.get("analysis_type", "basic")
        
        analyzer = self.tools["data_analyzer"]["instance"]
        return await analyzer.analyze(data, analysis_type) 