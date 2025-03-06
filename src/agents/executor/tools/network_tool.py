import aiohttp
from typing import Dict, Any, Optional
from datetime import datetime
import logging
import json
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

class NetworkTool:
    """网络工具"""
    
    def __init__(self):
        self.session: Optional[aiohttp.ClientSession] = None
        self.default_headers = {
            "User-Agent": "LocalAgent/1.0",
            "Accept": "application/json, text/plain, */*"
        }

    async def initialize(self) -> None:
        """初始化会话"""
        if not self.session:
            self.session = aiohttp.ClientSession(headers=self.default_headers)

    async def cleanup(self) -> None:
        """清理会话"""
        if self.session:
            await self.session.close()
            self.session = None

    async def request(self, method: str, url: str, **kwargs) -> Dict[str, Any]:
        """发送请求"""
        try:
            await self.initialize()
            
            # 验证URL
            parsed_url = urlparse(url)
            if not parsed_url.scheme or not parsed_url.netloc:
                raise ValueError("Invalid URL")
            
            # 准备请求参数
            request_kwargs = self._prepare_request_kwargs(kwargs)
            
            async with self.session.request(method.upper(), url, **request_kwargs) as response:
                # 获取响应内容
                content_type = response.headers.get("Content-Type", "")
                if "application/json" in content_type:
                    data = await response.json()
                else:
                    data = await response.text()
                
                return {
                    "status": "completed",
                    "status_code": response.status,
                    "headers": dict(response.headers),
                    "data": data,
                    "timestamp": datetime.now().isoformat()
                }
        except aiohttp.ClientError as e:
            logger.error(f"Network request error: {str(e)}")
            return {
                "status": "error",
                "error": f"Request failed: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            return {
                "status": "error",
                "error": f"Unexpected error: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }

    def _prepare_request_kwargs(self, kwargs: Dict[str, Any]) -> Dict[str, Any]:
        """准备请求参数"""
        prepared = {}
        
        # 处理headers
        headers = dict(self.default_headers)
        headers.update(kwargs.get("headers", {}))
        prepared["headers"] = headers
        
        # 处理JSON数据
        if "json" in kwargs:
            prepared["json"] = kwargs["json"]
            if "headers" not in prepared:
                prepared["headers"] = {}
            prepared["headers"]["Content-Type"] = "application/json"
        
        # 处理表单数据
        if "data" in kwargs:
            prepared["data"] = kwargs["data"]
        
        # 处理查询参数
        if "params" in kwargs:
            prepared["params"] = kwargs["params"]
        
        # 处理超时
        prepared["timeout"] = aiohttp.ClientTimeout(
            total=kwargs.get("timeout", 30)
        )
        
        # 处理SSL验证
        prepared["ssl"] = kwargs.get("verify_ssl", True)
        
        return prepared

    async def get(self, url: str, **kwargs) -> Dict[str, Any]:
        """发送GET请求"""
        return await self.request("GET", url, **kwargs)

    async def post(self, url: str, **kwargs) -> Dict[str, Any]:
        """发送POST请求"""
        return await self.request("POST", url, **kwargs)

    async def put(self, url: str, **kwargs) -> Dict[str, Any]:
        """发送PUT请求"""
        return await self.request("PUT", url, **kwargs)

    async def delete(self, url: str, **kwargs) -> Dict[str, Any]:
        """发送DELETE请求"""
        return await self.request("DELETE", url, **kwargs)

    async def head(self, url: str, **kwargs) -> Dict[str, Any]:
        """发送HEAD请求"""
        return await self.request("HEAD", url, **kwargs)

    async def options(self, url: str, **kwargs) -> Dict[str, Any]:
        """发送OPTIONS请求"""
        return await self.request("OPTIONS", url, **kwargs)

    async def patch(self, url: str, **kwargs) -> Dict[str, Any]:
        """发送PATCH请求"""
        return await self.request("PATCH", url, **kwargs) 