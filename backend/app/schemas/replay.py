"""
Session replay schemas
"""
from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class ReplayMessage(BaseModel):
    """Message for replay with timing info"""
    model_config = ConfigDict(from_attributes=True, protected_namespaces=())
    
    id: UUID
    role: str
    content: str
    persona: Optional[str] = None
    context_type: Optional[str] = None
    confidence: Optional[float] = None
    model_name: Optional[str] = None
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    created_at: datetime
    delay_ms: int  # Delay from previous message in milliseconds


class SessionReplayResponse(BaseModel):
    """Session replay data"""
    session_id: UUID
    title: Optional[str]
    messages: List[ReplayMessage]
    total_duration_ms: int
    message_count: int
