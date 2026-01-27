"""
Chat-related Pydantic schemas
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

from app.schemas.common import MetadataSchema


class ChatRequest(BaseModel):
    """Request to send a chat message"""
    message: str = Field(..., min_length=1, description="User message")
    session_id: Optional[str] = Field(None, description="Session ID (optional, creates new if not provided)")


class ChatResponse(BaseModel):
    """Response from chat endpoint"""
    session_id: str = Field(..., description="Session ID")
    response: str = Field(..., description="AI response")
    metadata: MetadataSchema = Field(..., description="AI metadata")


class MessageCreate(BaseModel):
    """Schema for creating a message"""
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str
    persona: Optional[str] = None
    context_type: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    model_name: Optional[str] = None
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None


class MessageResponse(BaseModel):
    """Message response schema"""
    id: UUID
    session_id: UUID
    role: str
    content: str
    persona: Optional[str] = None
    context_type: Optional[str] = None
    confidence: Optional[float] = None
    model_name: Optional[str] = None
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class HistoryResponse(BaseModel):
    """Response with conversation history"""
    session_id: UUID
    messages: list[MessageResponse]
