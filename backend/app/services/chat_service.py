"""
Chat service - xử lý logic chat
"""
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID, uuid4

from app.services.ai_core import ai_core_client
from app.db import crud
from app.schemas.chat import ChatResponse, MessageCreate, MessageResponse, HistoryResponse
from app.schemas.common import MetadataSchema, ContextSchema, UsageSchema
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class ChatService:
    """
    Chat processing service
    Orchestrates: get/create session → call AI Core → save to DB
    """
    
    async def process_message(
        self,
        db: Session,
        user_id: UUID,
        message: str,
        session_id: Optional[str] = None
    ) -> ChatResponse:
        """
        Process a chat message
        
        Steps:
        1. Get or create session
        2. Call AI Core
        3. Save user message to DB
        4. Save assistant response to DB
        5. Return response with metadata
        
        Args:
            db: Database session
            user_id: User ID
            message: User message
            session_id: Optional session ID
            
        Returns:
            ChatResponse with AI response and metadata
        """
        logger.info(
            "process_message_start",
            user_id=str(user_id),
            has_session=bool(session_id),
            message_length=len(message)
        )
        
        # 1. Get or create session
        if session_id:
            db_session = crud.get_session(db, UUID(session_id))
            if not db_session:
                logger.warning("session_not_found", session_id=session_id)
                raise ValueError(f"Session {session_id} not found")
            ai_session_id = db_session.ai_session_id
        else:
            # Create new session
            ai_session_id = None  # AI Core will create new session
            db_session = None
        
        # 2. Call AI Core
        try:
            ai_response = await ai_core_client.send_message(message, ai_session_id)
        except Exception as e:
            logger.error("ai_core_call_failed", error=str(e))
            raise
        
        # 3. Create session in DB if new
        if not db_session:
            from app.schemas.session import SessionCreate
            session_data = SessionCreate(
                ai_session_id=ai_response["session_id"],
                title=None  # Could auto-generate from first message
            )
            db_session = crud.create_session(db, user_id, session_data)
            logger.info("session_created", session_id=str(db_session.id))
        
        # 4. Save user message
        user_msg_data = MessageCreate(
            role="user",
            content=message
        )
        crud.create_message(db, db_session.id, user_msg_data)
        
        # 5. Save assistant response with metadata
        metadata = ai_response.get("metadata", {})
        context = metadata.get("context", {})
        model_info = metadata.get("model_info", {})
        
        # Extract model name - try multiple locations
        model_name = None
        if model_info:
            model_name = model_info.get("model_name") or model_info.get("model")
        if not model_name:
            model_name = metadata.get("model")
        
        # Extract usage - could be in model_info or at metadata level
        usage = {}
        if model_info:
            usage = model_info.get("usage", {})
        if not usage:
            usage = metadata.get("usage", {})
        
        assistant_msg_data = MessageCreate(
            role="assistant",
            content=ai_response.get("response", ""),
            persona=metadata.get("persona"),
            tone=metadata.get("tone"),
            behavior=metadata.get("behavior"),
            context_type=context.get("context_type"),
            confidence=context.get("confidence"),
            model_name=model_name,
            prompt_tokens=usage.get("prompt_tokens"),
            completion_tokens=usage.get("completion_tokens")
        )
        crud.create_message(db, db_session.id, assistant_msg_data)
        
        logger.info(
            "process_message_complete",
            session_id=str(db_session.id),
            persona=metadata.get("persona"),
            tone=metadata.get("tone"),
            behavior=metadata.get("behavior"),
            confidence=context.get("confidence")
        )
        
        # 6. Return response
        # Build metadata safely with nested objects
        metadata_response = MetadataSchema(
            persona=metadata.get("persona"),
            context=ContextSchema(**context) if context else None,
            model=model_name,
            usage=UsageSchema(**usage) if usage else None,
            valid=metadata.get("valid", True),
            warnings=metadata.get("warnings", [])
        )
        
        return ChatResponse(
            session_id=str(db_session.id),
            response=ai_response.get("response", ""),
            metadata=metadata_response
        )
    
    async def get_history(
        self,
        db: Session,
        session_id: UUID
    ) -> HistoryResponse:
        """
        Get conversation history
        
        Args:
            db: Database session
            session_id: Session ID
            
        Returns:
            HistoryResponse with messages
        """
        db_session = crud.get_session(db, session_id)
        if not db_session:
            raise ValueError(f"Session {session_id} not found")
        
        messages = crud.get_session_messages(db, session_id)
        
        return HistoryResponse(
            session_id=session_id,
            messages=[MessageResponse.model_validate(msg) for msg in messages]
        )


# Global service instance
chat_service = ChatService()
