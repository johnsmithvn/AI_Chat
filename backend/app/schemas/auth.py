"""
Authentication schemas
"""
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    name: str = Field(..., min_length=1)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    avatar_url: Optional[str] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
