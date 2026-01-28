"""
JWT authentication middleware
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

from app.core.auth import decode_access_token

security = HTTPBearer()


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """
    Extract and verify JWT token
    Returns: {"user_id": "...", "email": "..."}
    Raises 401 if invalid
    """
    token = credentials.credentials
    
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("sub")
    email = payload.get("email")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    return {"user_id": user_id, "email": email}


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[dict]:
    """Optional auth - returns None if no token (backwards compat)"""
    if credentials is None:
        return None
    
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None
