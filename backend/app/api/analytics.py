"""
Analytics endpoints - Token usage, Session comparison
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, Date
from uuid import UUID
from datetime import datetime
from typing import Optional

from app.db.base import get_db
from app.db import models, crud
from app.schemas.analytics import (
    TokenAnalyticsResponse, TokenStats, SessionTokenStats, DailyTokenStats,
    SessionCompareRequest, SessionCompareResponse, SessionCompareItem
)
from app.middlewares.auth import get_current_user
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/tokens", response_model=TokenAnalyticsResponse)
def get_token_analytics(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get token usage analytics for current user
    - Overall stats
    - By session
    - By day
    """
    try:
        user_id = UUID(current_user["user_id"])
        
        # Get all user's sessions
        user_sessions = db.query(models.ChatSession).filter(
            models.ChatSession.user_id == user_id
        ).all()
        session_ids = [s.id for s in user_sessions]
        
        if not session_ids:
            return TokenAnalyticsResponse(
                overall=TokenStats(),
                by_session=[],
                by_day=[]
            )
        
        # Overall stats
        overall_query = db.query(
            func.coalesce(func.sum(models.Message.prompt_tokens), 0).label("prompt"),
            func.coalesce(func.sum(models.Message.completion_tokens), 0).label("completion"),
            func.count(models.Message.id).label("count")
        ).filter(
            models.Message.session_id.in_(session_ids),
            models.Message.role == "assistant"
        ).first()
        
        total_prompt = overall_query.prompt or 0
        total_completion = overall_query.completion or 0
        total_count = overall_query.count or 0
        
        overall = TokenStats(
            total_prompt_tokens=total_prompt,
            total_completion_tokens=total_completion,
            total_tokens=total_prompt + total_completion,
            message_count=total_count,
            avg_tokens_per_message=round((total_prompt + total_completion) / total_count, 2) if total_count > 0 else 0
        )
        
        # By session stats
        by_session_query = db.query(
            models.Message.session_id,
            func.coalesce(func.sum(models.Message.prompt_tokens), 0).label("prompt"),
            func.coalesce(func.sum(models.Message.completion_tokens), 0).label("completion"),
            func.count(models.Message.id).label("count")
        ).filter(
            models.Message.session_id.in_(session_ids),
            models.Message.role == "assistant"
        ).group_by(models.Message.session_id).all()
        
        # Map session titles
        session_map = {s.id: s for s in user_sessions}
        
        by_session = []
        for row in by_session_query:
            session = session_map.get(row.session_id)
            by_session.append(SessionTokenStats(
                session_id=row.session_id,
                session_title=session.title if session else None,
                prompt_tokens=row.prompt,
                completion_tokens=row.completion,
                total_tokens=row.prompt + row.completion,
                message_count=row.count,
                created_at=session.created_at if session else datetime.utcnow()
            ))
        
        # Sort by total tokens desc
        by_session.sort(key=lambda x: x.total_tokens, reverse=True)
        
        # By day stats
        by_day_query = db.query(
            cast(models.Message.created_at, Date).label("date"),
            func.coalesce(func.sum(models.Message.prompt_tokens), 0).label("prompt"),
            func.coalesce(func.sum(models.Message.completion_tokens), 0).label("completion"),
            func.count(models.Message.id).label("count")
        ).filter(
            models.Message.session_id.in_(session_ids),
            models.Message.role == "assistant"
        ).group_by(cast(models.Message.created_at, Date)).order_by(
            cast(models.Message.created_at, Date).desc()
        ).limit(30).all()
        
        by_day = [
            DailyTokenStats(
                date=row.date,
                prompt_tokens=row.prompt,
                completion_tokens=row.completion,
                total_tokens=row.prompt + row.completion,
                message_count=row.count
            )
            for row in by_day_query
        ]
        
        return TokenAnalyticsResponse(
            overall=overall,
            by_session=by_session,
            by_day=by_day
        )
        
    except Exception as e:
        logger.error("get_token_analytics_error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get token analytics")


@router.post("/compare", response_model=SessionCompareResponse)
def compare_sessions(
    request: SessionCompareRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Compare two sessions side by side
    """
    try:
        user_id = UUID(current_user["user_id"])
        
        # Check ownership of both sessions
        if not crud.check_session_ownership(db, request.session_id_1, user_id):
            raise HTTPException(status_code=403, detail="Not authorized to access session 1")
        if not crud.check_session_ownership(db, request.session_id_2, user_id):
            raise HTTPException(status_code=403, detail="Not authorized to access session 2")
        
        def get_session_stats(session_id: UUID) -> SessionCompareItem:
            session = crud.get_session(db, session_id)
            if not session:
                raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
            
            messages = crud.get_session_messages(db, session_id)
            assistant_msgs = [m for m in messages if m.role == "assistant"]
            
            # Calculate stats
            total_tokens = sum((m.prompt_tokens or 0) + (m.completion_tokens or 0) for m in assistant_msgs)
            
            # Average confidence (legacy) and signal_strength (v2.1)
            confidences = [m.confidence for m in assistant_msgs if m.confidence is not None]
            avg_confidence = round(sum(confidences) / len(confidences), 3) if confidences else None
            
            signal_strengths = [m.signal_strength for m in assistant_msgs if hasattr(m, 'signal_strength') and m.signal_strength is not None]
            avg_signal_strength = round(sum(signal_strengths) / len(signal_strengths), 3) if signal_strengths else None
            
            # Persona distribution (legacy or persona_used from metadata)
            persona_dist = {}
            for m in assistant_msgs:
                if m.persona:
                    persona_dist[m.persona] = persona_dist.get(m.persona, 0) + 1
            
            # Tone distribution (v2.0+)
            tone_dist = {}
            for m in assistant_msgs:
                if hasattr(m, 'tone') and m.tone:
                    tone_dist[m.tone] = tone_dist.get(m.tone, 0) + 1
            
            # Behavior distribution (v2.0+)
            behavior_dist = {}
            for m in assistant_msgs:
                if hasattr(m, 'behavior') and m.behavior:
                    behavior_dist[m.behavior] = behavior_dist.get(m.behavior, 0) + 1
            
            # Model used (most common)
            models_used = [m.model_name for m in assistant_msgs if m.model_name]
            model_used = max(set(models_used), key=models_used.count) if models_used else None
            
            # Duration (first to last message)
            if messages:
                first_msg = min(messages, key=lambda m: m.created_at)
                last_msg = max(messages, key=lambda m: m.created_at)
                duration = (last_msg.created_at - first_msg.created_at).total_seconds() / 60
            else:
                duration = 0.0
            
            return SessionCompareItem(
                session_id=session_id,
                title=session.title,
                message_count=len(messages),
                total_tokens=total_tokens,
                avg_confidence=avg_confidence,
                avg_signal_strength=avg_signal_strength,
                persona_distribution=persona_dist,
                tone_distribution=tone_dist,
                behavior_distribution=behavior_dist,
                model_used=model_used,
                created_at=session.created_at,
                duration_minutes=round(duration, 2)
            )
        
        session_1_stats = get_session_stats(request.session_id_1)
        session_2_stats = get_session_stats(request.session_id_2)
        
        return SessionCompareResponse(
            session_1=session_1_stats,
            session_2=session_2_stats
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("compare_sessions_error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to compare sessions")
