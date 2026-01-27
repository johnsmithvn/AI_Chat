"""
Debug endpoints - để quan sát AI metadata
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.base import get_db
from app.db import crud
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/debug", tags=["debug"])


@router.get("/metadata/{message_id}")
def get_message_metadata(
    message_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get raw metadata for a message
    Useful for debugging AI behavior
    """
    try:
        message = db.query(crud.models.Message).filter(
            crud.models.Message.id == message_id
        ).first()
        
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Return full metadata
        return {
            "id": str(message.id),
            "session_id": str(message.session_id),
            "role": message.role,
            "content": message.content,
            "metadata": {
                "persona": message.persona,
                "context_type": message.context_type,
                "confidence": message.confidence,
                "model_name": message.model_name,
                "prompt_tokens": message.prompt_tokens,
                "completion_tokens": message.completion_tokens
            },
            "created_at": message.created_at
        }
        
    except HTTPException:
        raise
    
    except Exception as e:
        logger.error("get_metadata_error", error=str(e))
        raise HTTPException(status_code=500, detail="Internal error")


@router.get("/events/{session_id}")
def get_session_events(
    session_id: UUID,
    db: Session = Depends(get_db)
):
    """
    Get events for a session
    Shows persona switches, warnings, refusals
    """
    try:
        events = crud.get_session_events(db, session_id)
        
        return {
            "session_id": str(session_id),
            "events": [
                {
                    "id": str(event.id),
                    "type": event.type,
                    "payload": event.payload,
                    "created_at": event.created_at
                }
                for event in events
            ]
        }
        
    except Exception as e:
        logger.error("get_events_error", error=str(e))
        raise HTTPException(status_code=500, detail="Internal error")
