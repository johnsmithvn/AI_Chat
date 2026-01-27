"""
Chat endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.base import get_db
from app.schemas.chat import ChatRequest, ChatResponse, HistoryResponse
from app.services.chat_service import chat_service
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    """
    Send a chat message
    
    - Creates new session if session_id not provided
    - Calls AI Core
    - Saves to database
    - Returns response with AI metadata
    """
    try:
        # Use default user for now (no auth)
        user_id = UUID(settings.default_user_id)
        
        response = await chat_service.process_message(
            db=db,
            user_id=user_id,
            message=request.message,
            session_id=request.session_id
        )
        
        return response
        
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
    db: Session = Depends(get_db)
):
    """
    Get conversation history for a session
    """
    try:
        history = await chat_service.get_history(db, session_id)
        return history
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    
    except Exception as e:
        logger.error("get_history_error", error=str(e))
        raise HTTPException(status_code=500, detail="Internal error")
