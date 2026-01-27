"""
Pydantic Settings for configuration management
Loads from .env file
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Database
    database_url: str
    
    # AI Core
    ai_core_url: str
    ai_core_timeout: float
    
    # Server
    port: int = 3000
    host: str = "0.0.0.0"
    
    # CORS
    cors_origins: List[str] = ["http://localhost:5173"]
    
    # Logging
    log_level: str = "INFO"
    
    # Default user (for testing without auth)
    default_user_id: str = "00000000-0000-0000-0000-000000000001"
    default_user_name: str = "Test User"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )


# Global settings instance
settings = Settings()
