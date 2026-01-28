"""
Chat endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.base import get_db
from app.schemas.chat import ChatRequest, ChatResponse, HistoryResponse
from app.services.chat_service import chat_service
from app.middlewares.auth import get_current_user
from app.core.logging import get_logger
from app.db import crud

logger = get_logger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Send a chat message
    
    - Creates new session if session_id not provided
    - Calls AI Core
    - Saves to database
    - Returns response with AI metadata
    """
    try:
        user_id = UUID(current_user["user_id"])
        
        # If session_id provided, check ownership
        if request.session_id:
            if not crud.check_session_ownership(db, request.session_id, current_user["user_id"]):
                raise HTTPException(status_code=403, detail="Not authorized to access this session")
        
        response = await chat_service.process_message(
            db=db,
            user_id=user_id,
            message=request.message,
            session_id=request.session_id
        )
        
        return response
    
    except HTTPException:
        raise
        
    except ValueError as e:
        logger.error("chat_value_error", error=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        logger.error("chat_error", error=str(e), error_type=type(e).__name__)
        
        # Check if AI Core related error
        if "timeout" in str(e).lower():
            raise HTTPException(
                status_code=503,
                detail="AI Core timeout - please try again"
            )
        elif "connect" in str(e).lower():
            raise HTTPException(
                status_code=503,
                detail="Cannot connect to AI Core - is it running?"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Internal error: {str(e)}"
            )


@router.get("/history/{session_id}", response_model=HistoryResponse)
async def get_history(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get conversation history for a session
    """
    try:
        # Check ownership
        if not crud.check_session_ownership(db, session_id, current_user["user_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to access this session")
        
        history = await chat_service.get_history(db, session_id)
        return history
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        logger.error("get_history_error", error=str(e))
        raise HTTPException(status_code=500, detail="Internal error")
