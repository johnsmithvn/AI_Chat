"""
Analytics-related Pydantic schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date
from uuid import UUID


class TokenStats(BaseModel):
    """Token usage statistics"""
    total_prompt_tokens: int = 0
    total_completion_tokens: int = 0
    total_tokens: int = 0
    message_count: int = 0
    avg_tokens_per_message: float = 0.0


class SessionTokenStats(BaseModel):
    """Token stats for a single session"""
    session_id: UUID
    session_title: Optional[str]
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    message_count: int
    created_at: datetime


class DailyTokenStats(BaseModel):
    """Token stats grouped by day"""
    date: date
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    message_count: int


class TokenAnalyticsResponse(BaseModel):
    """Full token analytics response"""
    overall: TokenStats
    by_session: List[SessionTokenStats]
    by_day: List[DailyTokenStats]


class SessionCompareRequest(BaseModel):
    """Request to compare two sessions"""
    session_id_1: UUID
    session_id_2: UUID


class SessionCompareItem(BaseModel):
    """Single session data for comparison"""
    session_id: UUID
    title: Optional[str]
    message_count: int
    total_tokens: int
    avg_confidence: Optional[float] = None  # Legacy
    avg_signal_strength: Optional[float] = None  # v2.1
    persona_distribution: dict = {}  # Legacy persona or persona_used
    tone_distribution: dict = {}  # v2.0+ tone breakdown
    behavior_distribution: dict = {}  # v2.0+ behavior breakdown
    model_used: Optional[str] = None
    created_at: datetime
    duration_minutes: float


class SessionCompareResponse(BaseModel):
    """Compare two sessions response"""
    session_1: SessionCompareItem
    session_2: SessionCompareItem
