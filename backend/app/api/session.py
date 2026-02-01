"""
Session management endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.base import get_db
from app.schemas.session import SessionResponse, SessionListResponse, SessionUpdate
from app.schemas.replay import SessionReplayResponse, ReplayMessage
from app.services.session_service import session_service
from app.middlewares.auth import get_current_user
from app.core.logging import get_logger
from app.db import crud

logger = get_logger(__name__)
router = APIRouter(prefix="/session", tags=["session"])


@router.post("", response_model=SessionResponse)
def create_session(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create new chat session
    """
    try:
        user_id = UUID(current_user["user_id"])
        
        session = session_service.create_session(db, user_id)
        return session
        
    except Exception as e:
        logger.error("create_session_error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create session")


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get session by ID
    """
    try:
        # Check ownership
        if not crud.check_session_ownership(db, session_id, current_user["user_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to access this session")
        
        session = session_service.get_session(db, session_id)
        return session
        
    except HTTPException:
        raise
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        logger.error("get_session_error", error=str(e))
        raise HTTPException(status_code=500, detail="Internal error")


@router.get("s", response_model=SessionListResponse)
def list_sessions(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List user's sessions
    """
    try:
        user_id = UUID(current_user["user_id"])
        
        sessions = session_service.list_user_sessions(db, user_id, limit)
        return sessions
        
    except Exception as e:
        logger.error("list_sessions_error", error=str(e))
        raise HTTPException(status_code=500, detail="Internal error")


@router.delete("/{session_id}")
def delete_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete session and all messages
    """
    try:
        # Check ownership
        if not crud.check_session_ownership(db, session_id, current_user["user_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to delete this session")
        
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


@router.put("/{session_id}", response_model=SessionResponse)
def update_session(
    session_id: UUID,
    request: SessionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update session (rename)
    """
    try:
        # Check ownership
        if not crud.check_session_ownership(db, session_id, current_user["user_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to update this session")
        
        updated_session = crud.update_session_title(db, session_id, request.title)
        
        if updated_session:
            return updated_session
        else:
            raise HTTPException(status_code=404, detail="Session not found")
        
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error("update_session_error", error=str(e))
        raise HTTPException(status_code=500, detail="Internal error")


@router.get("/{session_id}/replay", response_model=SessionReplayResponse)
def get_session_replay(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get session replay data with timing information
    """
    try:
        # Check ownership
        if not crud.check_session_ownership(db, session_id, current_user["user_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to access this session")
        
        session = crud.get_session(db, session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        messages = crud.get_session_messages(db, session_id)
        
        if not messages:
            return SessionReplayResponse(
                session_id=session_id,
                title=session.title,
                messages=[],
                total_duration_ms=0,
                message_count=0
            )
        
        # Calculate delays between messages
        replay_messages = []
        prev_time = messages[0].created_at
        total_duration = 0
        
        for msg in messages:
            delay_ms = int((msg.created_at - prev_time).total_seconds() * 1000)
            # Cap delay at 10 seconds for replay (real delays can be very long)
            delay_ms = min(delay_ms, 10000)
            total_duration += delay_ms
            
            replay_messages.append(ReplayMessage(
                id=msg.id,
                role=msg.role,
                content=msg.content,
                persona=msg.persona,
                context_type=msg.context_type,
                confidence=msg.confidence,
                model_name=msg.model_name,
                prompt_tokens=msg.prompt_tokens,
                completion_tokens=msg.completion_tokens,
                created_at=msg.created_at,
                delay_ms=delay_ms
            ))
            
            prev_time = msg.created_at
        
        return SessionReplayResponse(
            session_id=session_id,
            title=session.title,
            messages=replay_messages,
            total_duration_ms=total_duration,
            message_count=len(replay_messages)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_session_replay_error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get session replay")


@router.delete("s")
def delete_all_sessions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete ALL sessions for current user
    """
    try:
        deleted_count = crud.delete_all_user_sessions(db, current_user["user_id"])
        logger.info(f"Deleted {deleted_count} sessions for user {current_user['user_id']}")
        
        return {"deleted": deleted_count}
        
    except Exception as e:
        logger.error("delete_all_sessions_error", error=str(e))
        raise HTTPException(status_code=500, detail="Internal error")
