"""
CRUD operations for database
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID, uuid4
from datetime import datetime

from app.db import models
from app.schemas.chat import MessageCreate
from app.schemas.session import SessionCreate


# ============ USER CRUD ============

def get_user(db: Session, user_id: UUID) -> Optional[models.User]:
    """Get user by ID"""
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """Get user by email"""
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, email: str, password_hash: str, name: str) -> models.User:
    """Create new user with authentication"""
    db_user = models.User(
        email=email,
        password_hash=password_hash,
        name=name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def update_user_last_login(db: Session, user_id: UUID) -> None:
    """Update last login timestamp"""
    db.query(models.User).filter(models.User.id == user_id).update({
        "last_login_at": datetime.utcnow()
    })
    db.commit()


def update_user_profile(
    db: Session, 
    user_id: UUID, 
    name: Optional[str] = None, 
    avatar_url: Optional[str] = None
) -> models.User:
    """Update user profile"""
    updates = {}
    if name is not None:
        updates["name"] = name
    if avatar_url is not None:
        updates["avatar_url"] = avatar_url
    
    db.query(models.User).filter(models.User.id == user_id).update(updates)
    db.commit()
    
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_or_create_user(db: Session, user_id: UUID, name: str) -> models.User:
    """Get existing user or create new one (backward compat)"""
    user = get_user(db, user_id)
    if not user:
        # Check if email already exists (for backward compat users)
        temp_email = f"{user_id}@temp.com"
        existing = get_user_by_email(db, temp_email)
        if existing:
            return existing
        # Create with dummy email for backward compat
        user = create_user(db, temp_email, "temp", name)
    return user


# ============ SESSION CRUD ============

def get_session(db: Session, session_id: UUID) -> Optional[models.ChatSession]:
    """Get session by ID"""
    return db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()


def get_session_by_ai_session_id(db: Session, ai_session_id: str) -> Optional[models.ChatSession]:
    """Get session by AI Core session ID"""
    return db.query(models.ChatSession).filter(models.ChatSession.ai_session_id == ai_session_id).first()


def create_session(db: Session, user_id: UUID, session_data: SessionCreate) -> models.ChatSession:
    """Create new chat session"""
    db_session = models.ChatSession(
        user_id=user_id,
        ai_session_id=session_data.ai_session_id,
        title=session_data.title
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session


def list_user_sessions(db: Session, user_id: UUID, limit: int = 20) -> List[models.ChatSession]:
    """List user's active sessions"""
    return db.query(models.ChatSession)\
        .filter(
            models.ChatSession.user_id == user_id,
            models.ChatSession.is_archived == 0
        )\
        .order_by(models.ChatSession.last_active_at.desc())\
        .limit(limit)\
        .all()


def delete_session(db: Session, session_id: UUID) -> bool:
    """Delete session and all messages"""
    db_session = get_session(db, session_id)
    if db_session:
        db.delete(db_session)
        db.commit()
        return True
    return False


def delete_all_user_sessions(db: Session, user_id: UUID) -> int:
    """
    Delete ALL sessions for a user (and all messages cascade)
    Returns: Number of sessions deleted
    """
    count = db.query(models.ChatSession)\
        .filter(models.ChatSession.user_id == user_id)\
        .delete()
    db.commit()
    return count


def check_session_ownership(db: Session, session_id: UUID, user_id: UUID) -> bool:
    """Check if session belongs to user"""
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == user_id
    ).first()
    return session is not None


# ============ MESSAGE CRUD ============

def create_message(db: Session, session_id: UUID, message_data: MessageCreate) -> models.Message:
    """Create new message"""
    db_message = models.Message(
        session_id=session_id,
        role=message_data.role,
        content=message_data.content,
        persona=message_data.persona,
        context_type=message_data.context_type,
        confidence=message_data.confidence,
        model_name=message_data.model_name,
        prompt_tokens=message_data.prompt_tokens,
        completion_tokens=message_data.completion_tokens
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


def get_session_messages(db: Session, session_id: UUID, limit: int = 100) -> List[models.Message]:
    """Get messages for a session"""
    return db.query(models.Message)\
        .filter(models.Message.session_id == session_id)\
        .order_by(models.Message.created_at.asc())\
        .limit(limit)\
        .all()


# ============ EVENT CRUD ============

def create_event(db: Session, session_id: UUID, event_type: str, payload: dict) -> models.Event:
    """Create new event"""
    db_event = models.Event(
        session_id=session_id,
        type=event_type,
        payload=payload
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


def get_session_events(db: Session, session_id: UUID) -> List[models.Event]:
    """Get events for a session"""
    return db.query(models.Event)\
        .filter(models.Event.session_id == session_id)\
        .order_by(models.Event.created_at.asc())\
        .all()
