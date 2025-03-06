from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from src.core.tools.tool_manager import ToolManager
from src.common.security.middleware import SecurityDependency

router = APIRouter(prefix="/tools", tags=["tools"])
tool_manager = ToolManager()

class ToolInfo(BaseModel):
    """工具信息模型"""
    id: str
    name: str
    description: str
    type: str
    async_: bool = False

class ToolExecute(BaseModel):
    """工具执行模型"""
    method: str
    params: Dict[str, Any] = {}

class ToolResult(BaseModel):
    """工具执行结果模型"""
    status: str
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None

@router.get("/", response_model=List[ToolInfo])
async def list_tools(
    tool_type: Optional[str] = None,
    user: Dict[str, Any] = Depends(SecurityDependency("tool:read"))
):
    """列出工具"""
    if tool_type:
        tools = tool_manager.get_tools_by_type(tool_type)
    else:
        tools = tool_manager.list_tools()
    return tools

@router.get("/{tool_id}", response_model=ToolInfo)
async def get_tool(
    tool_id: str,
    user: Dict[str, Any] = Depends(SecurityDependency("tool:read"))
):
    """获取工具信息"""
    tool_info = tool_manager.get_tool_info(tool_id)
    if not tool_info:
        raise HTTPException(status_code=404, detail="Tool not found")
    return {
        "id": tool_id,
        **tool_info
    }

@router.post("/{tool_id}/execute", response_model=ToolResult)
async def execute_tool(
    tool_id: str,
    execution: ToolExecute,
    user: Dict[str, Any] = Depends(SecurityDependency("tool:use"))
):
    """执行工具"""
    try:
        result = await tool_manager.execute_tool(
            tool_id,
            execution.method,
            **execution.params
        )
        return {
            "status": "success",
            "result": result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))