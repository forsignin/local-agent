from fastapi import Request, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
import logging
from .auth import SecurityContext

logger = logging.getLogger(__name__)

class SecurityMiddleware:
    """安全中间件"""
    
    def __init__(self):
        self.security_context = SecurityContext()
        self.auth_scheme = HTTPBearer()

    async def authenticate(self, request: Request) -> Optional[Dict[str, Any]]:
        """认证请求"""
        try:
            # 获取认证信息
            auth_header = request.headers.get("Authorization")
            api_key = request.headers.get("X-API-Key")
            
            # 如果没有认证信息，返回None
            if not auth_header and not api_key:
                return None
            
            # 处理Bearer令牌
            token = None
            if auth_header:
                try:
                    credentials: HTTPAuthorizationCredentials = await self.auth_scheme(request)
                    token = credentials.credentials
                except HTTPException:
                    logger.warning("Invalid authorization header")
                    return None
            
            # 验证请求
            user_info = self.security_context.validate_request(token, api_key)
            if not user_info:
                return None
            
            return user_info
        except Exception as e:
            logger.error(f"Authentication failed: {str(e)}")
            return None

    async def authorize(self, user: Dict[str, Any], permission: str) -> bool:
        """授权请求"""
        try:
            return self.security_context.authorize_request(user, permission)
        except Exception as e:
            logger.error(f"Authorization failed: {str(e)}")
            return False

    async def __call__(self, request: Request, permission: Optional[str] = None):
        """中间件处理函数"""
        try:
            # 认证
            user = await self.authenticate(request)
            if not user:
                raise HTTPException(
                    status_code=401,
                    detail="Could not validate credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # 授权
            if permission and not await self.authorize(user, permission):
                raise HTTPException(
                    status_code=403,
                    detail="Not enough permissions",
                )
            
            # 将用户信息添加到请求状态
            request.state.user = user
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Security middleware error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Internal server error"
            )

class RateLimitMiddleware:
    """速率限制中间件"""
    
    def __init__(self, rate_limit: int = 100, time_window: int = 60):
        self.rate_limit = rate_limit  # 请求次数限制
        self.time_window = time_window  # 时间窗口（秒）
        self.requests: Dict[str, List[float]] = {}

    async def __call__(self, request: Request):
        """中间件处理函数"""
        try:
            # 获取客户端标识
            client_id = self._get_client_id(request)
            
            # 检查并更新请求记录
            current_time = time.time()
            if client_id not in self.requests:
                self.requests[client_id] = []
            
            # 清理过期的请求记录
            self.requests[client_id] = [
                t for t in self.requests[client_id]
                if current_time - t <= self.time_window
            ]
            
            # 检查是否超过限制
            if len(self.requests[client_id]) >= self.rate_limit:
                raise HTTPException(
                    status_code=429,
                    detail="Too many requests"
                )
            
            # 记录新的请求
            self.requests[client_id].append(current_time)
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Rate limit middleware error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Internal server error"
            )

    def _get_client_id(self, request: Request) -> str:
        """获取客户端标识"""
        # 优先使用API密钥
        api_key = request.headers.get("X-API-Key")
        if api_key:
            return f"api_key:{api_key}"
        
        # 使用IP地址
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return f"ip:{forwarded.split(',')[0]}"
        return f"ip:{request.client.host}"

class SecurityDependency:
    """安全依赖"""
    
    def __init__(self, permission: Optional[str] = None):
        self.security_middleware = SecurityMiddleware()
        self.permission = permission

    async def __call__(self, request: Request) -> Dict[str, Any]:
        """依赖处理函数"""
        await self.security_middleware(request, self.permission)
        return request.state.user