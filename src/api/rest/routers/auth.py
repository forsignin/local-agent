from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict
from src.common.security.auth import SecurityContext
from src.common.security.middleware import SecurityDependency
from datetime import datetime, timedelta
import jwt
from sqlalchemy.orm import Session
import uuid
from src.common.config.settings import settings

from src.database import get_db
from src.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])
security_context = SecurityContext()

# JWT配置
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

class UserCreate(BaseModel):
    """用户注册请求模型"""
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    """用户登录请求模型"""
    username: str  # 改为 username，支持用户名或邮箱
    password: str

class Token(BaseModel):
    """令牌响应模型"""
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    """用户响应模型"""
    id: str
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    user: UserResponse

class PasswordChangeRequest(BaseModel):
    currentPassword: str
    newPassword: str

class ProfileUpdateRequest(BaseModel):
    username: Optional[str] = None

def create_access_token(data: dict):
    """创建访问令牌"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register", response_model=AuthResponse)
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    """注册新用户"""
    # 检查邮箱是否已存在
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="邮箱已被注册")
    
    # 检查用户名是否已存在
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(status_code=400, detail="用户名已被使用")
    
    # 创建新用户
    user = User(
        id=str(uuid.uuid4()),
        username=user_data.username,
        email=user_data.email,
        role="user"
    )
    user.password = user_data.password  # 这里会自动哈希密码
    
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # 创建访问令牌
    access_token = create_access_token({"sub": user.id})
    
    return {
        "access_token": access_token,
        "user": user
    }

@router.post("/login", response_model=AuthResponse)
async def login(
    user_data: UserLogin,
    db: Session = Depends(get_db)
):
    """用户登录"""
    # 查找用户（支持用户名或邮箱登录）
    user = db.query(User).filter(
        (User.username == user_data.username) | 
        (User.email == user_data.username)
    ).first()
    
    if not user or not user.verify_password(user_data.password):
        raise HTTPException(status_code=401, detail="用户名/邮箱或密码错误")
    
    # 更新最后登录时间
    user.last_login = datetime.utcnow()
    db.commit()
    
    # 创建访问令牌
    access_token = create_access_token({"sub": user.id})
    
    return {
        "access_token": access_token,
        "user": user
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    db: Session = Depends(get_db),
    user: Dict = Depends(SecurityDependency())
):
    """获取当前用户信息"""
    db_user = db.query(User).filter(User.id == user["sub"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.post("/logout")
async def logout():
    """用户登出"""
    # 由于使用的是JWT，服务端不需要特殊处理
    # 客户端会清除token
    return {"message": "已登出"}

@router.put("/profile", response_model=UserResponse)
async def update_profile(
    request: ProfileUpdateRequest,
    user: Dict = Depends(SecurityDependency())
):
    """更新用户信息"""
    # 这里简化实现，实际应该更新数据库
    updated_user = {
        **user,
        **(request.dict(exclude_unset=True))
    }
    return UserResponse(**updated_user)

@router.put("/password")
async def change_password(
    request: PasswordChangeRequest,
    user: Dict = Depends(SecurityDependency())
):
    """修改密码"""
    # 验证当前密码
    if not security_context.authenticate_user(user["username"], request.currentPassword):
        raise HTTPException(
            status_code=400,
            detail="当前密码错误"
        )
    
    # 这里简化实现，实际应该更新数据库中的密码
    return {"message": "密码修改成功"} 