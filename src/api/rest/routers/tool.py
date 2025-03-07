from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from datetime import datetime

from src.common.security.middleware import SecurityDependency
from src.core.tools.tool_manager import ToolManager

router = APIRouter(prefix="/tools", tags=["tools"])
tool_manager = ToolManager()

class ToolBase(BaseModel):
    """工具基础模型"""
    id: str
    name: str
    type: str
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None

class ToolStats(BaseModel):
    """工具统计模型"""
    total: int
    by_type: Dict[str, int]
    active: int
    error_rate: float

@router.get("", response_model=List[ToolBase])
async def list_tools(
    type: Optional[str] = None,
    user: Dict = Depends(SecurityDependency())
):
    """获取工具列表"""
    try:
        tools = tool_manager.list_tools()
        if type:
            tools = [t for t in tools if t["type"] == type]
        return tools
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=ToolStats)
async def get_tool_stats(user: Dict = Depends(SecurityDependency())):
    """获取工具统计信息"""
    try:
        tools = tool_manager.list_tools()
        by_type = {}
        for tool in tools:
            tool_type = tool["type"]
            by_type[tool_type] = by_type.get(tool_type, 0) + 1
        
        return {
            "total": len(tools),
            "by_type": by_type,
            "active": len([t for t in tools if t.get("status") == "active"]),
            "error_rate": 0.0  # 简化实现
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# 添加特定工具类型的路由
@router.get("/code-runner/runtimes")
async def list_runtimes(user: Dict = Depends(SecurityDependency())):
    """获取代码运行时列表"""
    return [
        {"id": "python3", "name": "Python 3", "version": "3.8"},
        {"id": "node", "name": "Node.js", "version": "14"},
        {"id": "java", "name": "Java", "version": "11"}
    ]

@router.get("/data-analyzer/datasets")
async def list_datasets(user: Dict = Depends(SecurityDependency())):
    """获取数据集列表"""
    return [
        {"id": "sample1", "name": "示例数据集1", "type": "csv"},
        {"id": "sample2", "name": "示例数据集2", "type": "json"}
    ]

@router.get("/network/cache/stats")
async def get_cache_stats(user: Dict = Depends(SecurityDependency())):
    """获取网络缓存统计"""
    return {
        "total_entries": 100,
        "hit_rate": 0.85,
        "size_bytes": 1024000,
        "oldest_entry": (datetime.now().isoformat())
    }