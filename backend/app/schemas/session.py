"""
Session-related Pydantic schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class SessionCreate(BaseModel):
    """Schema for creating a session"""
    ai_session_id: str = Field(..., description="AI Core session ID")
    title: Optional[str] = Field(None, description="Session title")


class SessionUpdate(BaseModel):
    """Schema for updating a session"""
    title: str = Field(..., min_length=1, max_length=255, description="New session title")


class SessionResponse(BaseModel):
    """Session response schema"""
    id: UUID
    user_id: UUID
    ai_session_id: str
    title: Optional[str]
    created_at: datetime
    last_active_at: datetime
    
    class Config:
        from_attributes = True


class SessionListResponse(BaseModel):
    """Response with list of sessions"""
    sessions: list[SessionResponse]
