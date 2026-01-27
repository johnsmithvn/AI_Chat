"""
AI Core HTTP client
Điểm DUY NHẤT gọi AI Core API
"""
import httpx
from typing import Optional, Dict, Any
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class AICoreClient:
    """
    Client for AI Core API
    Handles all communication with AI Core service
    """
    
    def __init__(self, base_url: str = None, timeout: float = None):
        self.base_url = base_url or settings.ai_core_url
        self.timeout = timeout or settings.ai_core_timeout
        self.client = httpx.AsyncClient(timeout=self.timeout)
    
    async def send_message(
        self, 
        message: str, 
        ai_session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send message to AI Core /chat endpoint
        
        Args:
            message: User message
            ai_session_id: Optional AI Core session ID
            
        Returns:
            Dict with response, session_id, and metadata
            
        Raises:
            httpx.HTTPStatusError: If API returns error
            httpx.TimeoutException: If request times out
            httpx.ConnectError: If cannot connect to AI Core
        """
        url = f"{self.base_url}/chat"
        payload = {"message": message}
        
        if ai_session_id:
            payload["session_id"] = ai_session_id
        
        logger.info(
            "calling_ai_core",
            url=url,
            has_session=bool(ai_session_id),
            message_length=len(message)
        )
        
        try:
            response = await self.client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            
            logger.info(
                "ai_core_response_received",
                session_id=data.get("session_id"),
                persona=data.get("metadata", {}).get("persona"),
                response_length=len(data.get("response", ""))
            )
            
            return data
            
        except httpx.TimeoutException as e:
            logger.error(
                "ai_core_timeout",
                timeout=self.timeout,
                error=str(e)
            )
            raise
            
        except httpx.ConnectError as e:
            logger.error(
                "ai_core_connection_error",
                url=self.base_url,
                error=str(e)
            )
            raise
            
        except httpx.HTTPStatusError as e:
            logger.error(
                "ai_core_http_error",
                status_code=e.response.status_code,
                error=e.response.text
            )
            raise
    
    async def get_history(self, ai_session_id: str, limit: int = 20) -> Dict[str, Any]:
        """
        Get conversation history from AI Core
        
        Args:
            ai_session_id: AI Core session ID
            limit: Max number of messages to retrieve
            
        Returns:
            Dict with session_id and messages
        """
        url = f"{self.base_url}/chat/history/{ai_session_id}"
        params = {"limit": limit}
        
        try:
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            logger.error(
                "ai_core_history_error",
                session_id=ai_session_id,
                error=str(e)
            )
            raise
    
    async def close(self):
        """Close HTTP client"""
        await self.client.aclose()


# Global client instance (reuse connection pool)
ai_core_client = AICoreClient()
