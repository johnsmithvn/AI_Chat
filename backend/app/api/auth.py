"""
Authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.base import get_db
from app.db import crud
from app.core.auth import hash_password, verify_password, create_access_token
from app.schemas.auth import (
    RegisterRequest, 
    LoginRequest, 
    TokenResponse, 
    UserResponse, 
    UpdateProfileRequest
)
from app.middlewares.auth import get_current_user
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register new user"""
    try:
        # Check email exists
        existing_user = crud.get_user_by_email(db, request.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        password_hash = hash_password(request.password)
        
        # Create user
        user = crud.create_user(db, request.email, password_hash, request.name)
        
        # Generate token
        access_token = create_access_token(data={
            "sub": str(user.id),
            "email": user.email
        })
        
        logger.info("user_registered", user_id=str(user.id), email=user.email)
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse.model_validate(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("register_error", error=str(e))
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login user"""
    try:
        # Get user
        user = crud.get_user_by_email(db, request.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(request.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Update last login
        crud.update_user_last_login(db, user.id)
        
        # Generate token
        access_token = create_access_token(data={
            "sub": str(user.id),
            "email": user.email
        })
        
        logger.info("user_logged_in", user_id=str(user.id), email=user.email)
        
        return TokenResponse(
            access_token=access_token,
            user=UserResponse.model_validate(user)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("login_error", error=str(e))
        raise HTTPException(status_code=500, detail="Login failed")


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user info"""
    try:
        user = crud.get_user(db, UUID(current_user["user_id"]))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse.model_validate(user)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("get_user_info_error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get user info")


@router.put("/me", response_model=UserResponse)
def update_profile(
    request: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    try:
        user = crud.update_user_profile(
            db, 
            UUID(current_user["user_id"]),
            name=request.name,
            avatar_url=request.avatar_url
        )
        
        logger.info("profile_updated", user_id=str(user.id))
        
        return UserResponse.model_validate(user)
        
    except Exception as e:
        logger.error("update_profile_error", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update profile")


@router.post("/logout")
def logout():
    """Logout (client-side only - clear token)"""
    return {"status": "logged_out"}
