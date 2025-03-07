from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import jwt
from passlib.context import CryptContext
import logging
import secrets
from sqlalchemy.orm import Session
from src.common.config.settings import settings
from src.models.user import User
from src.database import get_db

logger = logging.getLogger(__name__)

class SecurityManager:
    """安全管理器"""
    
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        self.secret_key = settings.SECRET_KEY
        self.algorithm = "HS256"
        self.access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        self.db = next(get_db())

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """验证密码"""
        try:
            return self.pwd_context.verify(plain_password, hashed_password)
        except Exception as e:
            logger.error(f"Password verification failed: {str(e)}")
            return False

    def get_password_hash(self, password: str) -> str:
        """获取密码哈希"""
        return self.pwd_context.hash(password)

    def create_access_token(self, data: Dict[str, Any]) -> str:
        """创建访问令牌"""
        try:
            to_encode = data.copy()
            expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
            to_encode.update({"exp": expire})
            encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
            return encoded_jwt
        except Exception as e:
            logger.error(f"Token creation failed: {str(e)}")
            raise

    def decode_token(self, token: str) -> Optional[Dict[str, Any]]:
        """解码令牌"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token has expired")
            return None
        except Exception as e:
            logger.error(f"Token validation failed: {str(e)}")
            return None

    def get_user_by_username_or_email(self, username_or_email: str) -> Optional[User]:
        """通过用户名或邮箱获取用户"""
        try:
            return self.db.query(User).filter(
                (User.username == username_or_email) | 
                (User.email == username_or_email)
            ).first()
        except Exception as e:
            logger.error(f"Failed to get user: {str(e)}")
            return None

class RBACManager:
    """基于角色的访问控制管理器"""
    
    def __init__(self):
        self.roles: Dict[str, Dict[str, Any]] = {
            "admin": {
                "name": "管理员",
                "permissions": ["*"]  # 所有权限
            },
            "user": {
                "name": "普通用户",
                "permissions": [
                    "task:read",
                    "task:create",
                    "tool:use"
                ]
            },
            "guest": {
                "name": "访客",
                "permissions": [
                    "task:read"
                ]
            }
        }

    def has_permission(self, role: str, permission: str) -> bool:
        """检查角色是否有权限"""
        try:
            if role not in self.roles:
                return False
            
            role_permissions = self.roles[role]["permissions"]
            
            # 管理员拥有所有权限
            if "*" in role_permissions:
                return True
            
            # 检查具体权限
            return permission in role_permissions
        except Exception as e:
            logger.error(f"Permission check failed: {str(e)}")
            return False

    def get_role_permissions(self, role: str) -> List[str]:
        """获取角色的所有权限"""
        try:
            if role not in self.roles:
                return []
            return self.roles[role]["permissions"]
        except Exception as e:
            logger.error(f"Failed to get role permissions: {str(e)}")
            return []

class APIKeyManager:
    """API密钥管理器"""
    
    def __init__(self):
        self.api_keys: Dict[str, Dict[str, Any]] = {}

    def create_api_key(self, user_id: str, role: str) -> str:
        """创建API密钥"""
        try:
            api_key = secrets.token_urlsafe(32)
            self.api_keys[api_key] = {
                "user_id": user_id,
                "role": role,
                "created_at": datetime.utcnow(),
                "last_used": None
            }
            return api_key
        except Exception as e:
            logger.error(f"API key creation failed: {str(e)}")
            raise

    def validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """验证API密钥"""
        try:
            if api_key not in self.api_keys:
                return None
            
            key_info = self.api_keys[api_key]
            key_info["last_used"] = datetime.utcnow()
            return key_info
        except Exception as e:
            logger.error(f"API key validation failed: {str(e)}")
            return None

    def revoke_api_key(self, api_key: str) -> bool:
        """撤销API密钥"""
        try:
            if api_key in self.api_keys:
                del self.api_keys[api_key]
                return True
            return False
        except Exception as e:
            logger.error(f"API key revocation failed: {str(e)}")
            return False

class SecurityContext:
    """安全上下文"""
    
    def __init__(self):
        self.security_manager = SecurityManager()
        self.rbac_manager = RBACManager()
        self.api_key_manager = APIKeyManager()

    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        """用户认证"""
        try:
            user = self.security_manager.get_user_by_username_or_email(username)
            if user and user.verify_password(password):
                user.last_login = datetime.utcnow()
                self.security_manager.db.commit()
                return user.to_dict()
            return None
        except Exception as e:
            logger.error(f"User authentication failed: {str(e)}")
            return None

    def authorize_request(self, user: Dict[str, Any], permission: str) -> bool:
        """请求授权"""
        try:
            role = user.get("role")
            if not role:
                return False
            return self.rbac_manager.has_permission(role, permission)
        except Exception as e:
            logger.error(f"Request authorization failed: {str(e)}")
            return False

    def validate_request(self, token: Optional[str], api_key: Optional[str]) -> Optional[Dict[str, Any]]:
        """验证请求"""
        try:
            # 优先验证API密钥
            if api_key:
                return self.api_key_manager.validate_api_key(api_key)
            
            # 验证JWT令牌
            if token:
                return self.security_manager.decode_token(token)
            
            return None
        except Exception as e:
            logger.error(f"Request validation failed: {str(e)}")
            return None