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
    persona: Optional[str] = None  # Legacy or persona_used
    tone: Optional[str] = None  # v2.0+
    behavior: Optional[str] = None  # v2.0+
    context_type: Optional[str] = None
    confidence: Optional[float] = None  # Legacy
    signal_strength: Optional[float] = None  # v2.1
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
