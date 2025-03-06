import ast
import sys
from typing import Dict, Any, Optional
import asyncio
from io import StringIO
import traceback
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class CodeRunner:
    """代码执行工具"""
    
    def __init__(self):
        self.output_buffer = StringIO()
        self.error_buffer = StringIO()
        self.locals = {}
        self.globals = {
            '__builtins__': __builtins__,
            'print': self._custom_print
        }

    async def run(self, code: str, timeout: int = 30) -> Dict[str, Any]:
        """执行代码"""
        try:
            # 重置缓冲区
            self.output_buffer = StringIO()
            self.error_buffer = StringIO()
            
            # 解析代码
            tree = ast.parse(code)
            
            # 创建执行任务
            task = asyncio.create_task(self._execute_code(code))
            
            # 等待执行完成或超时
            try:
                await asyncio.wait_for(task, timeout=timeout)
                status = "completed"
                error = None
            except asyncio.TimeoutError:
                status = "timeout"
                error = f"Code execution timed out after {timeout} seconds"
            
            return {
                "status": status,
                "output": self.output_buffer.getvalue(),
                "error": error or self.error_buffer.getvalue(),
                "timestamp": datetime.now().isoformat()
            }
        except SyntaxError as e:
            return {
                "status": "error",
                "output": "",
                "error": f"Syntax error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "output": "",
                "error": f"Execution error: {str(e)}\n{traceback.format_exc()}",
                "timestamp": datetime.now().isoformat()
            }
        finally:
            self.output_buffer.close()
            self.error_buffer.close()

    async def _execute_code(self, code: str) -> None:
        """执行代码的具体实现"""
        try:
            # 执行代码
            exec(code, self.globals, self.locals)
        except Exception as e:
            self.error_buffer.write(f"Execution error: {str(e)}\n")
            self.error_buffer.write(traceback.format_exc())
            raise

    def _custom_print(self, *args, **kwargs):
        """自定义print函数，输出重定向到缓冲区"""
        print(*args, file=self.output_buffer, **kwargs)

    def get_context(self) -> Dict[str, Any]:
        """获取执行上下文"""
        return {
            "locals": self.locals,
            "globals": {k: v for k, v in self.globals.items() if k != '__builtins__'}
        }

    def reset_context(self) -> None:
        """重置执行上下文"""
        self.locals = {}
        self.globals = {
            '__builtins__': __builtins__,
            'print': self._custom_print
        }