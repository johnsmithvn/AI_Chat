"""
Authentication utilities - JWT + Password hashing
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash password using bcrypt (truncate to 72 bytes max)"""
    # bcrypt has a 72 byte limit - truncate safely at character boundary
    password_utf8 = password.encode('utf-8')
    if len(password_utf8) > 72:
        # Truncate at byte 72, then find last valid UTF-8 char boundary
        truncated = password_utf8[:72]
        # Decode with ignore to drop incomplete chars at the end
        password = truncated.decode('utf-8', errors='ignore')
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.jwt_secret_key, 
        algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(
            token, 
            settings.jwt_secret_key, 
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError:
        return None
