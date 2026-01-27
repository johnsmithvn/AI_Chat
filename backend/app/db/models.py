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
    """User model - Tối giản cho giai đoạn này"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    # Relationships
    sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")


class ChatSession(Base):
    """
    Chat session - mapping 1-1 với AI Core session
    """
    __tablename__ = "chat_sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    ai_session_id = Column(Text, unique=True, nullable=False)
    title = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    last_active_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
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
    persona = Column(Text, nullable=True)
    context_type = Column(Text, nullable=True)
    confidence = Column(Float, CheckConstraint("confidence >= 0 AND confidence <= 1"), nullable=True)
    
    model_name = Column(Text, nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    
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
