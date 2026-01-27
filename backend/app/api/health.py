"""
Health check endpoints
"""
from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: datetime
    service: str


@router.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - simple health check"""
    return HealthResponse(
        status="ok",
        timestamp=datetime.utcnow(),
        service="conversation-service"
    )


@router.get("/health", response_model=HealthResponse)
async def health():
    """Detailed health check"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow(),
        service="conversation-service"
    )
