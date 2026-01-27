"""
Session service - quản lý sessions
"""
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID, uuid4

from app.db import crud
from app.schemas.session import SessionCreate, SessionResponse, SessionListResponse
from app.core.logging import get_logger

logger = get_logger(__name__)


class SessionService:
    """Session management service"""
    
    def create_session(
        self,
        db: Session,
        user_id: UUID,
        title: str = None
    ) -> SessionResponse:
        """
        Create new session
        
        Args:
            db: Database session
            user_id: User ID
            title: Optional session title
            
        Returns:
            SessionResponse
        """
        # Generate AI session ID
        ai_session_id = str(uuid4())
        
        session_data = SessionCreate(
            ai_session_id=ai_session_id,
            title=title
        )
        
        db_session = crud.create_session(db, user_id, session_data)
        
        logger.info(
            "session_created",
            session_id=str(db_session.id),
            ai_session_id=ai_session_id,
            user_id=str(user_id)
        )
        
        return SessionResponse.model_validate(db_session)
    
    def get_session(
        self,
        db: Session,
        session_id: UUID
    ) -> SessionResponse:
        """
        Get session by ID
        
        Args:
            db: Database session
            session_id: Session ID
            
        Returns:
            SessionResponse
            
        Raises:
            ValueError: If session not found
        """
        db_session = crud.get_session(db, session_id)
        if not db_session:
            raise ValueError(f"Session {session_id} not found")
        
        return SessionResponse.model_validate(db_session)
    
    def list_user_sessions(
        self,
        db: Session,
        user_id: UUID,
        limit: int = 20
    ) -> SessionListResponse:
        """
        List user's sessions
        
        Args:
            db: Database session
            user_id: User ID
            limit: Max number of sessions
            
        Returns:
            SessionListResponse
        """
        sessions = crud.list_user_sessions(db, user_id, limit)
        
        return SessionListResponse(
            sessions=[SessionResponse.model_validate(s) for s in sessions]
        )
    
    def delete_session(
        self,
        db: Session,
        session_id: UUID
    ) -> bool:
        """
        Delete session and all messages
        
        Args:
            db: Database session
            session_id: Session ID
            
        Returns:
            True if deleted, False if not found
        """
        success = crud.delete_session(db, session_id)
        
        if success:
            logger.info("session_deleted", session_id=str(session_id))
        else:
            logger.warning("session_not_found_for_deletion", session_id=str(session_id))
        
        return success


# Global service instance
session_service = SessionService()
