"""
Main entry point - run with: python main.py
"""
if __name__ == "__main__":
    import uvicorn
    from app.main import app
    from app.core.config import settings
    
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_level=settings.log_level.lower()
    )
