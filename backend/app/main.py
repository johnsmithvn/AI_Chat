"""
FastAPI application entry point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.logging import setup_logging, get_logger
from app.db.base import init_db
from app.db import crud
from app.services.ai_core import ai_core_client
from app.middlewares.request_id import RequestIDMiddleware

# Import routers
from app.api import health, chat, session, debug, auth

# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events - startup and shutdown
    """
    # Startup
    logger.info("app_startup", service="conversation-service")
    
    # Initialize database
    try:
        init_db()
        logger.info("database_initialized")
        
        # Create default user if not exists
        from app.db.base import SessionLocal
        from uuid import UUID
        db = SessionLocal()
        try:
            crud.get_or_create_user(
                db,
                UUID(settings.default_user_id),
                settings.default_user_name
            )
            logger.info("default_user_ready", user_id=settings.default_user_id)
        finally:
            db.close()
            
    except Exception as e:
        logger.error("database_init_error", error=str(e))
        raise
    
    yield
    
    # Shutdown
    logger.info("app_shutdown")
    await ai_core_client.close()


# Create FastAPI app
app = FastAPI(
    title="Conversation Service",
    description="Backend service for AI Chat - manages conversations and proxies AI Core",
    version="1.0.0",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(RequestIDMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(session.router)
app.include_router(debug.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )
