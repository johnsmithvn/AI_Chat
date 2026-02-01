"""
SQLAlchemy database models
"""
from sqlalchemy import Column, String, Text, Float, Integer, TIMESTAMP, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.base import Base


class User(Base):
    """User model with authentication"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(Text, unique=True, nullable=False, index=True)
    password_hash = Column(Text, nullable=False)
    name = Column(Text, nullable=False)
    avatar_url = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    last_login_at = Column(TIMESTAMP, nullable=True)
    
    # Relationships
    sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")


class ChatSession(Base):
    """Chat session with message count and archive support"""
    __tablename__ = "chat_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ai_session_id = Column(Text, unique=True, nullable=False)
    title = Column(Text, nullable=True)
    message_count = Column(Integer, default=0)
    is_archived = Column(Integer, default=0)  # 0=active, 1=archived
    created_at = Column(TIMESTAMP, server_default=func.now())
    last_active_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), index=True)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="session", cascade="all, delete-orphan")


class Message(Base):
    """
    Message - TRUNG TÂM DEBUG AI
    Lưu đầy đủ AI metadata
    """
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    
    role = Column(Text, CheckConstraint("role IN ('user', 'assistant')"), nullable=False)
    content = Column(Text, nullable=False)
    
    # AI Metadata (chỉ có khi role = 'assistant')
    persona = Column(Text, nullable=True)  # Legacy - built from tone+behavior
    tone = Column(Text, nullable=True)  # v2.0: casual | technical
    behavior = Column(Text, nullable=True)  # v2.0: normal | cautious
    context_type = Column(Text, nullable=True)
    confidence = Column(Float, CheckConstraint("confidence >= 0 AND confidence <= 1"), nullable=True)  # Legacy
    signal_strength = Column(Float, CheckConstraint("signal_strength >= 0 AND signal_strength <= 1"), nullable=True)  # v2.1
    _context_clarity = Column("context_clarity", Integer, CheckConstraint("context_clarity IN (0, 1)"), nullable=True)  # v2.1: 0=false, 1=true
    _needs_knowledge = Column("needs_knowledge", Integer, CheckConstraint("needs_knowledge IN (0, 1)"), default=0)  # v2.1: 0=false, 1=true
    
    # Properties to convert Integer to Boolean for Pydantic
    @property
    def context_clarity(self) -> bool | None:
        if self._context_clarity is None:
            return None
        return self._context_clarity == 1
    
    @context_clarity.setter
    def context_clarity(self, value: bool | None):
        if value is None:
            self._context_clarity = None
        else:
            self._context_clarity = 1 if value else 0
    
    @property
    def needs_knowledge(self) -> bool | None:
        if self._needs_knowledge is None:
            return None
        return self._needs_knowledge == 1
    
    @needs_knowledge.setter
    def needs_knowledge(self, value: bool | None):
        if value is None:
            self._needs_knowledge = None
        else:
            self._needs_knowledge = 1 if value else 0
    
    model_name = Column(Text, nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    
    # Mistake tracking
    is_mistake = Column(Integer, default=0)  # 0=normal, 1=marked as mistake
    mistake_note = Column(Text, nullable=True)
    
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    session = relationship("ChatSession", back_populates="messages")


class Event(Base):
    """
    Event log - optional, ngon khi debug AI
    """
    __tablename__ = "events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    type = Column(Text, nullable=False)  # 'persona_switch', 'warning', 'refusal'
    payload = Column(JSONB, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    session = relationship("ChatSession", back_populates="events")
