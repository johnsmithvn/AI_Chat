"""
Message management endpoints (mistakes, etc.)
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from app.db.base import get_db
from app.db import crud
from app.middlewares.auth import get_current_user
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/message", tags=["message"])


class MarkMistakeRequest(BaseModel):
    """Request to mark/unmark a message as mistake"""
    is_mistake: bool = True
    note: Optional[str] = Field(None, max_length=500)


class MessageResponse(BaseModel):
    """Message response with mistake info"""
    id: UUID
    session_id: UUID
    role: str
    content: str
    persona: Optional[str] = None
    context_type: Optional[str] = None
    confidence: Optional[float] = None
    model_name: Optional[str] = None
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    is_mistake: bool
    mistake_note: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class MistakesListResponse(BaseModel):
    """List of mistakes"""
    mistakes: List[MessageResponse]
    total: int


@router.put("/{message_id}/mistake", response_model=MessageResponse)
def mark_message_mistake(
    message_id: UUID,
    request: MarkMistakeRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Mark or unmark a message as an AI mistake
    """
    try:
        user_id = UUID(current_user["user_id"])
        
        # Check ownership
        if not crud.check_message_ownership(db, message_id, user_id):
            raise HTTPException(status_code=403, detail="Not authorized to modify this message")
        
        message = crud.mark_message_mistake(
            db, 
            message_id, 
            is_mistake=request.is_mistake,
            note=request.note
        )
        
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        return MessageResponse(
            id=message.id,
            session_id=message.session_id,
            role=message.role,
            content=message.content,
            persona=message.persona,
            context_type=message.context_type,
            confidence=message.confidence,
            model_name=message.model_name,
            prompt_tokens=message.prompt_tokens,
            completion_tokens=message.completion_tokens,
            is_mistake=bool(message.is_mistake),
            mistake_note=message.mistake_note,
            created_at=message.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("mark_mistake_error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to mark message")


@router.get("/mistakes", response_model=MistakesListResponse)
def get_user_mistakes(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get all messages marked as mistakes for current user
    """
    try:
        user_id = UUID(current_user["user_id"])
        
        mistakes = crud.get_user_mistakes(db, user_id, limit)
        
        return MistakesListResponse(
            mistakes=[
                MessageResponse(
                    id=m.id,
                    session_id=m.session_id,
                    role=m.role,
                    content=m.content,
                    persona=m.persona,
                    context_type=m.context_type,
                    confidence=m.confidence,
                    model_name=m.model_name,
                    prompt_tokens=m.prompt_tokens,
                    completion_tokens=m.completion_tokens,
                    is_mistake=bool(m.is_mistake),
                    mistake_note=m.mistake_note,
                    created_at=m.created_at
                )
                for m in mistakes
            ],
            total=len(mistakes)
        )
        
    except Exception as e:
        logger.error("get_mistakes_error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get mistakes")
