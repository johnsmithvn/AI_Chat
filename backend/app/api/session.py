"""
Session management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.base import get_db
from app.schemas.session import SessionResponse, SessionListResponse
from app.services.session_service import session_service
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/session", tags=["session"])


@router.post("", response_model=SessionResponse)
def create_session(
    db: Session = Depends(get_db)
):
    """
    Create new chat session
    """
    try:
        # Use default user for now (no auth)
        user_id = UUID(settings.default_user_id)
        
        session = session_service.create_session(db, user_id)
        return session
        
    except Exception as e:
        logger.error("create_session_error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create session")


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get session by ID
    """
    try:
        session = session_service.get_session(db, session_id)
        return session
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        logger.error("get_session_error", error=str(e))
        raise HTTPException(status_code=500, detail="Internal error")


@router.get("s", response_model=SessionListResponse)
def list_sessions(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """
    List user's sessions
    """
    try:
        # Use default user for now (no auth)
        user_id = UUID(settings.default_user_id)
        
        sessions = session_service.list_user_sessions(db, user_id, limit)
        return sessions
        
    except Exception as e:
        logger.error("list_sessions_error", error=str(e))
        raise HTTPException(status_code=500, detail="Internal error")


@router.delete("/{session_id}")
def delete_session(
    session_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Delete session and all messages
    """
    try:
        success = session_service.delete_session(db, session_id)
        
        if success:
            return {"status": "deleted", "session_id": str(session_id)}
        else:
            raise HTTPException(status_code=404, detail="Session not found")
        
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error("delete_session_error", error=str(e))
        raise HTTPException(status_code=500, detail="Internal error")
