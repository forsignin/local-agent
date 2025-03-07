from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from .base import BaseModel
from passlib.context import CryptContext
import enum

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserRole(str, enum.Enum):
    """用户角色"""
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

class User(BaseModel):
    """用户模型"""
    __tablename__ = "users"

    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False, default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True), nullable=True)

    @property
    def password(self):
        raise AttributeError('password is not a readable attribute')

    @password.setter
    def password(self, password):
        self.hashed_password = pwd_context.hash(password)

    def verify_password(self, password):
        """验证密码"""
        return pwd_context.verify(password, self.hashed_password)

    def to_dict(self):
        """转换为字典，排除敏感信息"""
        result = super().to_dict()
        result.pop('hashed_password', None)
        return result 