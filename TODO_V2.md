# 🚀 AI CHAT V2 - IMPLEMENTATION GUIDE

**Goal**: Authentication + Session Management (OpenAI-style)  
**Time**: 16-23 hours (3-5 days)

## 🎯 FEATURES

✅ JWT auth (email/password)  
✅ Multi-user (isolated sessions)  
✅ Sidebar session list  
✅ Click to switch sessions  
✅ Delete session (+ delete ALL user sessions)  
✅ Auto-generate titles

---

## 🎯 TASK BREAKDOWN

### ⏰ PHASE 1: BACKEND - DATABASE MIGRATION (Day 1)

#### Task 1.1: Update Database Models
**File**: `backend/app/db/models.py`

**Changes**:
```python
class User(Base):
    # ADD new columns
    email = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    avatar_url = Column(Text, nullable=True)
    last_login_at = Column(TIMESTAMP, nullable=True)
    
    # KEEP existing
    id = Column(UUID)
    name = Column(Text)
    created_at = Column(TIMESTAMP)

class ChatSession(Base):
    # ADD new columns
    message_count = Column(Integer, default=0)
    is_archived = Column(Boolean, default=False)
    
    # KEEP existing
    # ... all existing columns
```

**Checklist**:
- [ ] Add email column (unique, not null)
- [ ] Add password_hash column
- [ ] Add avatar_url column (nullable)
- [ ] Add last_login_at column
- [ ] Add message_count to ChatSession
- [ ] Add is_archived to ChatSession
- [ ] Add indexes (email, user_id + last_active_at)

---

#### Task 1.2: Create Alembic Migration
**Location**: `backend/migrations/versions/`

**Commands**:
```bash
cd backend
alembic revision -m "add_authentication_fields"
# Edit generated file
alembic upgrade head
```

**Migration Script**:
```python
def upgrade():
    # Add columns to users
    op.add_column('users', sa.Column('email', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('password_hash', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('last_login_at', sa.TIMESTAMP(), nullable=True))
    
    # Migrate default user
    op.execute("""
        UPDATE users 
        SET email = 'test@example.com',
            password_hash = '<bcrypt-hash-of-test123>'
        WHERE id = '00000000-0000-0000-0000-000000000001'
    """)
    
    # Make columns not null
    op.alter_column('users', 'email', nullable=False)
    op.alter_column('users', 'password_hash', nullable=False)
    
    # Add columns to chat_sessions
    op.add_column('chat_sessions', sa.Column('message_count', sa.Integer(), default=0))
    op.add_column('chat_sessions', sa.Column('is_archived', sa.Boolean(), default=False))
    
    # Create indexes
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_sessions_user_active', 'chat_sessions', 
                    ['user_id', 'last_active_at'], 
                    postgresql_where=sa.text('is_archived = FALSE'))
```

**Checklist**:
- [ ] Create migration file
- [ ] Add column additions
- [ ] Add data migration for default user
- [ ] Add indexes
- [ ] Test upgrade
- [ ] Test downgrade
- [ ] Backup database before applying

---

### ⏰ PHASE 2: BACKEND - AUTHENTICATION (Day 1-2)

#### Task 2.1: Install Dependencies
**File**: `backend/requirements.txt`

**Add**:
```txt
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
```

**Commands**:
```bash
cd backend
pip install -r requirements.txt
```

**Checklist**:
- [ ] Add dependencies to requirements.txt
- [ ] Install packages
- [ ] Verify imports work

---

#### Task 2.2: Add Auth Configuration
**File**: `backend/app/core/config.py`

**Add**:
```python
class Settings(BaseSettings):
    # ... existing settings
    
    # JWT Settings
    jwt_secret_key: str = Field(..., env="JWT_SECRET_KEY")
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    jwt_expiry_hours: int = Field(default=24, env="JWT_EXPIRY_HOURS")
    
    # Frontend URL
    frontend_url: str = Field(..., env="FRONTEND_URL")
```

**File**: `backend/.env`

**Add**:
```bash
# JWT Configuration
JWT_SECRET_KEY=your-super-secret-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24

# Frontend
FRONTEND_URL=http://localhost:5173
```

**Checklist**:
- [ ] Add JWT settings to config.py
- [ ] Add JWT variables to .env
- [ ] Add JWT variables to .env.example
- [ ] Generate secure JWT secret key
- [ ] Update CORS to use frontend_url

---

#### Task 2.3: Create Auth Utilities
**File**: `backend/app/core/auth.py` (NEW)

**Content**:
```python
"""
Authentication utilities
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=settings.jwt_expiry_hours))
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.jwt_secret_key, 
        algorithm=settings.jwt_algorithm
    )
    return encoded_jwt

def decode_access_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(
            token, 
            settings.jwt_secret_key, 
            algorithms=[settings.jwt_algorithm]
        )
        return payload
    except JWTError:
        return None
```

**Checklist**:
- [ ] Create auth.py file
- [ ] Implement hash_password()
- [ ] Implement verify_password()
- [ ] Implement create_access_token()
- [ ] Implement decode_access_token()
- [ ] Test all functions

---

#### Task 2.4: Create Auth Middleware
**File**: `backend/app/middlewares/auth.py` (NEW)

**Content**:
```python
"""
JWT authentication middleware
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from uuid import UUID
from app.core.auth import decode_access_token

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthCredentials = Depends(security)
) -> dict:
    """
    Extract and verify JWT token
    Returns user info dict: {"user_id": "...", "email": "..."}
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
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    return {
        "user_id": user_id,
        "email": email
    }

def get_optional_user(
    credentials: Optional[HTTPAuthCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[dict]:
    """
    Optional auth - returns None if no token
    Used for backwards compatibility
    """
    if credentials is None:
        return None
    
    try:
        return get_current_user(credentials)
    except HTTPException:
        return None
```

**Checklist**:
- [ ] Create auth middleware file
- [ ] Implement get_current_user()
- [ ] Implement get_optional_user() (for backwards compat)
- [ ] Test with valid token
- [ ] Test with invalid token
- [ ] Test with no token

---

#### Task 2.5: Create Auth Schemas
**File**: `backend/app/schemas/auth.py` (NEW)

**Content**:
```python
"""
Authentication schemas
"""
from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime
from typing import Optional

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    name: str = Field(..., min_length=1)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: UUID
    email: str
    name: str
    avatar_url: Optional[str] = None
    created_at: datetime
    last_login_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
```

**Checklist**:
- [ ] Create auth schemas file
- [ ] Add RegisterRequest
- [ ] Add LoginRequest
- [ ] Add TokenResponse
- [ ] Add UserResponse
- [ ] Add UpdateProfileRequest
- [ ] Test validation

---

#### Task 2.6: Update User CRUD
**File**: `backend/app/db/crud.py`

**Add**:
```python
# User operations (ADD these functions)

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get user by email"""
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, email: str, password_hash: str, name: str) -> User:
    """Create new user"""
    user = User(
        email=email,
        password_hash=password_hash,
        name=name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user_last_login(db: Session, user_id: UUID) -> None:
    """Update last login timestamp"""
    db.query(User).filter(User.id == user_id).update({
        "last_login_at": datetime.utcnow()
    })
    db.commit()

def update_user_profile(db: Session, user_id: UUID, name: str = None, avatar_url: str = None) -> User:
    """Update user profile"""
    updates = {}
    if name is not None:
        updates["name"] = name
    if avatar_url is not None:
        updates["avatar_url"] = avatar_url
    
    db.query(User).filter(User.id == user_id).update(updates)
    db.commit()
    
    return db.query(User).filter(User.id == user_id).first()
```

**Checklist**:
- [ ] Add get_user_by_email()
- [ ] Add create_user()
- [ ] Add update_user_last_login()
- [ ] Add update_user_profile()
- [ ] Test all functions

---

#### Task 2.7: Create Auth Endpoints
**File**: `backend/app/api/auth.py` (NEW)

**Content**:
```python
"""
Authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.base import get_db
from app.db.crud import get_user_by_email, create_user, update_user_last_login, update_user_profile, get_user
from app.core.auth import hash_password, verify_password, create_access_token
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse, UpdateProfileRequest
from app.middlewares.auth import get_current_user
from app.core.logging import get_logger

logger = get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(
    request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Register new user"""
    try:
        # Check if email exists
        existing_user = get_user_by_email(db, request.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        password_hash = hash_password(request.password)
        
        # Create user
        user = create_user(db, request.email, password_hash, request.name)
        
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
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login user"""
    try:
        # Get user
        user = get_user_by_email(db, request.email)
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
        update_user_last_login(db, user.id)
        
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
        user = get_user(db, UUID(current_user["user_id"]))
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
        user = update_user_profile(
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
    """
    Logout (client-side only - clear token)
    Server doesn't maintain session state
    """
    return {"status": "logged_out"}
```

**Checklist**:
- [ ] Create auth.py endpoint file
- [ ] Implement POST /auth/register
- [ ] Implement POST /auth/login
- [ ] Implement GET /auth/me
- [ ] Implement PUT /auth/me
- [ ] Implement POST /auth/logout (dummy)
- [ ] Add error handling
- [ ] Add logging
- [ ] Test all endpoints

---

#### Task 2.8: Update Existing Endpoints (Add Auth)
**Files**: 
- `backend/app/api/chat.py`
- `backend/app/api/session.py`

**Changes**:

**chat.py**:
```python
from app.middlewares.auth import get_current_user

# BEFORE
@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: Session = Depends(get_db)
):
    user_id = UUID(settings.default_user_id)  # Hard-coded
    ...

# AFTER
@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    current_user: dict = Depends(get_current_user),  # JWT auth
    db: Session = Depends(get_db)
):
    user_id = UUID(current_user["user_id"])  # From JWT
    ...
```

**session.py**:
```python
from app.middlewares.auth import get_current_user

# Update ALL endpoints to use get_current_user
# Example:
@router.post("", response_model=SessionResponse)
def create_session(
    current_user: dict = Depends(get_current_user),  # ADD
    db: Session = Depends(get_db)
):
    user_id = UUID(current_user["user_id"])  # From JWT
    ...
```

**Checklist**:
- [ ] Update POST /chat
- [ ] Update GET /chat/history/{id} (add ownership check)
- [ ] Update POST /session
- [ ] Update GET /sessions
- [ ] Update GET /session/{id} (add ownership check)
- [ ] Update PUT /session/{id} (add ownership check)
- [ ] Update DELETE /session/{id} (add ownership check)
- [ ] Test all endpoints with JWT
- [ ] Test all endpoints without JWT (should return 401)

---

#### Task 2.9: Update Main App (Register Router)
**File**: `backend/app/main.py`

**Add**:
```python
from app.api import auth  # ADD

app.include_router(auth.router)  # ADD after other routers
```

**Checklist**:
- [ ] Import auth router
- [ ] Register auth router
- [ ] Test /docs shows auth endpoints
- [ ] Verify auth endpoints work

---

#### Task 2.10: Add Ownership Checks
**File**: `backend/app/services/session_service.py`

**Add helper**:
```python
def check_session_ownership(db: Session, session_id: UUID, user_id: UUID) -> bool:
    """Check if session belongs to user"""
    session = db.query(ChatSession).filter(
        ChatSession.id == session_id,
        ChatSession.user_id == user_id
    ).first()
    return session is not None
```

**Use in endpoints**:
```python
# In chat.py: GET /chat/history/{session_id}
if not check_session_ownership(db, session_id, user_id):
    raise HTTPException(status_code=403, detail="Access denied")
```

**Checklist**:
- [ ] Add check_session_ownership()
- [ ] Use in GET /chat/history
- [ ] Use in GET /session/{id}
- [ ] Use in PUT /session/{id}
- [ ] Use in DELETE /session/{id}
- [ ] Test with different users

---

### ⏰ PHASE 3: FRONTEND - SETUP (Day 2)

#### Task 3.1: Install Dependencies
**File**: `web/package.json`

**Add**:
```json
{
  "dependencies": {
    "react-router-dom": "^6.20.0",
    "jwt-decode": "^4.0.0"
  }
}
```

**Commands**:
```bash
cd web
npm install
```

**Checklist**:
- [ ] Add react-router-dom
- [ ] Add jwt-decode
- [ ] Run npm install
- [ ] Verify imports work

---

#### Task 3.2: Update Environment Config
**File**: `web/.env`

**No changes needed** (API_BASE_URL already exists)

**File**: `web/src/config/env.ts`

**Content stays same**:
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
```

**Checklist**:
- [ ] Verify API_BASE_URL config exists
- [ ] Test API calls work

---

#### Task 3.3: Create Auth Types
**File**: `web/src/types/auth.ts` (NEW)

**Content**:
```typescript
/**
 * Authentication types
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  last_login_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
```

**Checklist**:
- [ ] Create auth.ts file
- [ ] Add User interface
- [ ] Add LoginRequest interface
- [ ] Add RegisterRequest interface
- [ ] Add TokenResponse interface
- [ ] Add AuthState interface

---

#### Task 3.4: Create Auth API Client
**File**: `web/src/services/auth.api.ts` (NEW)

**Content**:
```typescript
/**
 * Authentication API client
 */
import axios from "axios";
import { API_BASE_URL } from "../config/env";
import type { LoginRequest, RegisterRequest, TokenResponse, User } from "../types/auth";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authApi = {
  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>("/auth/register", data);
    return response.data;
  },

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<TokenResponse> {
    const response = await api.post<TokenResponse>("/auth/login", data);
    return response.data;
  },

  /**
   * Get current user info
   */
  async getCurrentUser(token: string): Promise<User> {
    const response = await api.get<User>("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  /**
   * Update user profile
   */
  async updateProfile(
    token: string,
    data: { name?: string; avatar_url?: string }
  ): Promise<User> {
    const response = await api.put<User>("/auth/me", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  /**
   * Logout (client-side)
   */
  logout(): void {
    // Just notify backend (optional)
    api.post("/auth/logout").catch(() => {
      // Ignore errors
    });
  },
};
```

**Checklist**:
- [ ] Create auth.api.ts file
- [ ] Implement register()
- [ ] Implement login()
- [ ] Implement getCurrentUser()
- [ ] Implement updateProfile()
- [ ] Implement logout()
- [ ] Test all methods

---

#### Task 3.5: Update Chat API Client (Add Auth Header)
**File**: `web/src/services/chat.api.ts`

**Add**:
```typescript
// ADD helper to get token
const getAuthHeader = () => {
  const token = localStorage.getItem("auth_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// UPDATE all methods to include auth header
export const chatApi = {
  async sendMessage(message: string, sessionId?: string): Promise<ChatResponse> {
    const response = await api.post<ChatResponse>("/chat", 
      { message, session_id: sessionId },
      { headers: getAuthHeader() }  // ADD
    );
    return response.data;
  },

  async getHistory(sessionId: string): Promise<HistoryResponse> {
    const response = await api.get<HistoryResponse>(`/chat/history/${sessionId}`, {
      headers: getAuthHeader()  // ADD
    });
    return response.data;
  },

  // ... update all methods similarly
};
```

**Checklist**:
- [ ] Add getAuthHeader() helper
- [ ] Update sendMessage()
- [ ] Update getHistory()
- [ ] Update createSession()
- [ ] Update listSessions()
- [ ] Update getSession()
- [ ] Update deleteSession()
- [ ] Test with token
- [ ] Test without token (should fail)

---

#### Task 3.6: Create Auth Store
**File**: `web/src/store/auth.store.ts` (NEW)

**Content**:
```typescript
/**
 * Authentication state management
 */
import { create } from "zustand";
import { authApi } from "../services/auth.api";
import type { User, LoginRequest, RegisterRequest } from "../types/auth";

interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  isAuthenticated: () => boolean;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: localStorage.getItem("auth_token"),
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });

    try {
      const data: LoginRequest = { email, password };
      const response = await authApi.login(data);

      // Save token
      localStorage.setItem("auth_token", response.access_token);

      set({
        user: response.user,
        token: response.access_token,
        loading: false,
      });
    } catch (error: unknown) {
      console.error("Login error:", error);
      let errorMessage = "Login failed";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        errorMessage = axiosError.response?.data?.detail || "Login failed";
      }
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  register: async (email: string, password: string, name: string) => {
    set({ loading: true, error: null });

    try {
      const data: RegisterRequest = { email, password, name };
      const response = await authApi.register(data);

      // Save token
      localStorage.setItem("auth_token", response.access_token);

      set({
        user: response.user,
        token: response.access_token,
        loading: false,
      });
    } catch (error: unknown) {
      console.error("Register error:", error);
      let errorMessage = "Registration failed";
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        errorMessage = axiosError.response?.data?.detail || "Registration failed";
      }
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  logout: () => {
    // Call backend
    authApi.logout();

    // Clear local storage
    localStorage.removeItem("auth_token");

    // Clear state
    set({
      user: null,
      token: null,
      error: null,
    });
  },

  loadUser: async () => {
    const { token } = get();
    if (!token) return;

    set({ loading: true });

    try {
      const user = await authApi.getCurrentUser(token);
      set({ user, loading: false });
    } catch (error) {
      console.error("Load user error:", error);
      // Token invalid - logout
      get().logout();
      set({ loading: false });
    }
  },

  isAuthenticated: () => {
    const { token } = get();
    return !!token;
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
```

**Checklist**:
- [ ] Create auth.store.ts file
- [ ] Implement login()
- [ ] Implement register()
- [ ] Implement logout()
- [ ] Implement loadUser()
- [ ] Implement isAuthenticated()
- [ ] Add token persistence (localStorage)
- [ ] Test all actions

---

### ⏰ PHASE 4: FRONTEND - AUTH PAGES (Day 2-3)

#### Task 4.1: Create Login Page
**File**: `web/src/pages/LoginPage.tsx` (NEW)

**Content**:
```typescript
/**
 * Login page
 */
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await login(email, password);
      navigate("/chat");
    } catch (error) {
      // Error handled by store
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "2rem",
          backgroundColor: "white",
          borderRadius: "0.5rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", textAlign: "center" }}>
          AI Chat Login
        </h1>

        {error && (
          <div
            style={{
              padding: "0.75rem",
              marginBottom: "1rem",
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              borderRadius: "0.25rem",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem",
                fontSize: "1rem",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem",
                fontSize: "1rem",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: loading ? "#9ca3af" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              fontSize: "1rem",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.875rem" }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "#3b82f6", textDecoration: "none" }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};
```

**Checklist**:
- [ ] Create LoginPage.tsx
- [ ] Add form with email + password
- [ ] Connect to auth store
- [ ] Add error display
- [ ] Add loading state
- [ ] Add link to register
- [ ] Test login flow
- [ ] Test error handling

---

#### Task 4.2: Create Register Page
**File**: `web/src/pages/RegisterPage.tsx` (NEW)

**Content**:
```typescript
/**
 * Register page
 */
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { register, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await register(email, password, name);
      navigate("/chat");
    } catch (error) {
      // Error handled by store
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f9fafb",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "2rem",
          backgroundColor: "white",
          borderRadius: "0.5rem",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem", textAlign: "center" }}>
          Create Account
        </h1>

        {error && (
          <div
            style={{
              padding: "0.75rem",
              marginBottom: "1rem",
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              borderRadius: "0.25rem",
              fontSize: "0.875rem",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="name"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem",
                fontSize: "1rem",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem",
                fontSize: "1rem",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: "1px solid #d1d5db",
                borderRadius: "0.25rem",
                fontSize: "1rem",
              }}
            />
            <p style={{ marginTop: "0.25rem", fontSize: "0.75rem", color: "#6b7280" }}>
              Minimum 8 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: loading ? "#9ca3af" : "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              fontSize: "1rem",
              fontWeight: "500",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.875rem" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#3b82f6", textDecoration: "none" }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};
```

**Checklist**:
- [ ] Create RegisterPage.tsx
- [ ] Add form with name + email + password
- [ ] Connect to auth store
- [ ] Add error display
- [ ] Add loading state
- [ ] Add link to login
- [ ] Test registration flow
- [ ] Test validation

---

#### Task 4.3: Create Protected Route Component
**File**: `web/src/components/auth/ProtectedRoute.tsx` (NEW)

**Content**:
```typescript
/**
 * Protected route - requires authentication
 */
import React, { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loadUser, token } = useAuthStore();

  useEffect(() => {
    // Load user info if token exists but user not loaded
    if (token && !isAuthenticated()) {
      loadUser();
    }
  }, [token, isAuthenticated, loadUser]);

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

**Checklist**:
- [ ] Create ProtectedRoute.tsx
- [ ] Check authentication
- [ ] Redirect to login if not authenticated
- [ ] Load user on mount
- [ ] Test with authenticated user
- [ ] Test with unauthenticated user

---

#### Task 4.4: Update App Router
**File**: `web/src/App.tsx`

**Update**:
```typescript
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ChatPage } from "./pages/ChatPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

**Checklist**:
- [ ] Add react-router-dom imports
- [ ] Add BrowserRouter
- [ ] Add public routes (/login, /register)
- [ ] Add protected route (/chat)
- [ ] Add default redirect
- [ ] Test navigation
- [ ] Test route protection

---

### ⏰ PHASE 5: FRONTEND - SESSION MANAGEMENT UI (Day 3-4)

#### Task 5.1: Update Chat Types (Add Session)
**File**: `web/src/types/chat.ts`

**Add**:
```typescript
export interface Session {
  id: string;
  user_id: string;
  ai_session_id: string;
  title: string | null;
  message_count: number;
  created_at: string;
  last_active_at: string;
  is_archived: boolean;
}

export interface SessionListResponse {
  sessions: Session[];
}
```

**Checklist**:
- [ ] Add Session interface
- [ ] Add SessionListResponse interface

---

#### Task 5.2: Update Chat Store (Add Session Management)
**File**: `web/src/store/chat.store.ts`

**Add**:
```typescript
interface ChatStore {
  // ... existing fields
  sessions: Session[];  // ADD

  // ... existing actions
  loadSessions: () => Promise<void>;        // ADD
  selectSession: (sessionId: string) => Promise<void>;  // ADD
  deleteSession: (sessionId: string) => Promise<void>;  // ADD
}

export const useChatStore = create<ChatStore>((set, get) => ({
  // ... existing state
  sessions: [],  // ADD

  // ... existing actions

  // ADD
  loadSessions: async () => {
    try {
      const response = await chatApi.listSessions();
      set({ sessions: response.sessions });
    } catch (error) {
      console.error("Load sessions error:", error);
    }
  },

  // ADD
  selectSession: async (sessionId: string) => {
    set({ loading: true, error: null });

    try {
      const response = await chatApi.getHistory(sessionId);
      set({
        sessionId: response.session_id,
        messages: response.messages,
        currentMetadata: null,
        loading: false,
      });
    } catch (error) {
      console.error("Select session error:", error);
      set({
        error: "Failed to load session",
        loading: false,
      });
    }
  },

  // ADD
  deleteSession: async (sessionId: string) => {
    try {
      await chatApi.deleteSession(sessionId);
      
      // Remove from list
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
      }));

      // If current session was deleted, clear
      if (get().sessionId === sessionId) {
        get().clearSession();
      }
    } catch (error) {
      console.error("Delete session error:", error);
      throw error;
    }
  },
}));
```

**Checklist**:
- [ ] Add sessions array to state
- [ ] Implement loadSessions()
- [ ] Implement selectSession()
- [ ] Implement deleteSession()
- [ ] Test all actions

---

#### Task 5.3: Create Sidebar Component
**File**: `web/src/components/layout/Sidebar.tsx` (NEW)

**Content**:
```typescript
/**
 * Sidebar with session list
 */
import React, { useEffect } from "react";
import { useChatStore } from "../../store/chat.store";
import { SessionItem } from "./SessionItem";

export const Sidebar: React.FC = () => {
  const { sessions, sessionId, loadSessions, createNewSession } = useChatStore();

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleNewChat = async () => {
    try {
      await createNewSession();
      await loadSessions(); // Refresh list
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  return (
    <div
      style={{
        width: "250px",
        backgroundColor: "#1f2937",
        color: "white",
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #374151",
      }}
    >
      {/* New Chat Button */}
      <div style={{ padding: "1rem" }}>
        <button
          onClick={handleNewChat}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "0.25rem",
            fontSize: "0.875rem",
            fontWeight: "500",
            cursor: "pointer",
          }}
        >
          + New Chat
        </button>
      </div>

      {/* Session List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 0.5rem",
        }}
      >
        {sessions.length === 0 ? (
          <p
            style={{
              padding: "1rem",
              textAlign: "center",
              fontSize: "0.875rem",
              color: "#9ca3af",
            }}
          >
            No conversations yet
          </p>
        ) : (
          sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === sessionId}
            />
          ))
        )}
      </div>
    </div>
  );
};
```

**Checklist**:
- [ ] Create Sidebar.tsx
- [ ] Add "New Chat" button
- [ ] Load sessions on mount
- [ ] Render session list
- [ ] Add scroll for long lists
- [ ] Style for dark theme

---

#### Task 5.4: Create SessionItem Component
**File**: `web/src/components/layout/SessionItem.tsx` (NEW)

**Content**:
```typescript
/**
 * Single session item in sidebar
 */
import React, { useState } from "react";
import { useChatStore } from "../../store/chat.store";
import type { Session } from "../../types/chat";

interface SessionItemProps {
  session: Session;
  isActive: boolean;
}

export const SessionItem: React.FC<SessionItemProps> = ({ session, isActive }) => {
  const { selectSession, deleteSession } = useChatStore();
  const [showDelete, setShowDelete] = useState(false);

  const handleClick = () => {
    selectSession(session.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this conversation?")) {
      try {
        await deleteSession(session.id);
      } catch (error) {
        alert("Failed to delete session");
      }
    }
  };

  const title = session.title || "New Conversation";

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
      style={{
        padding: "0.75rem",
        marginBottom: "0.5rem",
        backgroundColor: isActive ? "#374151" : "transparent",
        borderRadius: "0.25rem",
        cursor: "pointer",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        transition: "background-color 0.2s",
      }}
    >
      <div style={{ flex: 1, overflow: "hidden" }}>
        <div
          style={{
            fontSize: "0.875rem",
            fontWeight: isActive ? "500" : "normal",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: "0.75rem",
            color: "#9ca3af",
            marginTop: "0.25rem",
          }}
        >
          {new Date(session.last_active_at).toLocaleDateString()}
        </div>
      </div>

      {showDelete && (
        <button
          onClick={handleDelete}
          style={{
            marginLeft: "0.5rem",
            padding: "0.25rem 0.5rem",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "0.25rem",
            fontSize: "0.75rem",
            cursor: "pointer",
          }}
        >
          Delete
        </button>
      )}
    </div>
  );
};
```

**Checklist**:
- [ ] Create SessionItem.tsx
- [ ] Display session title (or "New Conversation")
- [ ] Display last active date
- [ ] Highlight active session
- [ ] Add click to select
- [ ] Add delete button (on hover)
- [ ] Add delete confirmation

---

#### Task 5.5: Create TopBar Component
**File**: `web/src/components/layout/TopBar.tsx` (NEW)

**Content**:
```typescript
/**
 * Top bar with user menu
 */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";

export const TopBar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      style={{
        height: "60px",
        backgroundColor: "white",
        borderBottom: "1px solid #e5e7eb",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 1rem",
      }}
    >
      <h1 style={{ fontSize: "1.25rem", fontWeight: "bold" }}>AI Chat</h1>

      <div style={{ position: "relative" }}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.5rem 1rem",
            backgroundColor: "#f3f4f6",
            border: "1px solid #d1d5db",
            borderRadius: "0.25rem",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#3b82f6",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.875rem",
              fontWeight: "bold",
            }}
          >
            {user?.name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: "0.875rem" }}>{user?.name}</span>
        </button>

        {showMenu && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "0.5rem",
              width: "200px",
              backgroundColor: "white",
              border: "1px solid #d1d5db",
              borderRadius: "0.25rem",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              zIndex: 10,
            }}
          >
            <div
              style={{
                padding: "0.75rem 1rem",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontSize: "0.875rem", fontWeight: "500" }}>
                {user?.name}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                {user?.email}
              </div>
            </div>

            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                backgroundColor: "transparent",
                border: "none",
                textAlign: "left",
                fontSize: "0.875rem",
                cursor: "pointer",
                color: "#ef4444",
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
```

**Checklist**:
- [ ] Create TopBar.tsx
- [ ] Display app title
- [ ] Display user avatar (first letter)
- [ ] Add user menu dropdown
- [ ] Display user name + email
- [ ] Add logout button
- [ ] Test menu toggle
- [ ] Test logout

---

#### Task 5.6: Update ChatPage Layout (Add Sidebar + TopBar)
**File**: `web/src/pages/ChatPage.tsx`

**Update**:
```typescript
import React, { useEffect } from "react";
import { useChatStore } from "../store/chat.store";
import { TopBar } from "../components/layout/TopBar";
import { Sidebar } from "../components/layout/Sidebar";
import { ChatWindow } from "../components/chat/ChatWindow";
import { DebugPanel } from "../components/chat/DebugPanel";

export const ChatPage: React.FC = () => {
  const { error, setError, loadSessions } = useChatStore();

  useEffect(() => {
    // Load sessions on mount
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    // Clear error after 5 seconds
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Bar */}
      <TopBar />

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Sidebar */}
        <Sidebar />

        {/* Chat Window */}
        <ChatWindow />

        {/* Debug Panel */}
        <DebugPanel />
      </div>

      {/* Error Toast */}
      {error && (
        <div
          style={{
            position: "fixed",
            bottom: "1rem",
            right: "1rem",
            padding: "1rem",
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            maxWidth: "20rem",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};
```

**Checklist**:
- [ ] Import TopBar and Sidebar
- [ ] Add TopBar at top
- [ ] Add Sidebar on left
- [ ] Adjust layout for 3 columns
- [ ] Load sessions on mount
- [ ] Test responsive layout

---

#### Task 5.7: Update SessionHeader (Remove "New Session" button)
**File**: `web/src/components/chat/SessionHeader.tsx`

**Remove**:
```typescript
// DELETE "New Session" button
// It's now in Sidebar
```

**Keep**:
- Session ID display
- Persona/confidence display

**Checklist**:
- [ ] Remove "New Session" button
- [ ] Keep session info display
- [ ] Adjust styling

---

### ⏰ PHASE 6: TESTING & FIXES (Day 4-5)

#### Task 6.1: Backend Testing

**Checklist**:
- [ ] Test registration flow
- [ ] Test login flow
- [ ] Test JWT token generation
- [ ] Test JWT token validation
- [ ] Test invalid credentials
- [ ] Test duplicate email registration
- [ ] Test password hashing
- [ ] Test protected endpoints with token
- [ ] Test protected endpoints without token
- [ ] Test session ownership checks
- [ ] Test chat with multiple users
- [ ] Test session list filtering by user
- [ ] Test logout

**Test Script**:
```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user1@example.com", "password": "test1234", "name": "User 1"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user1@example.com", "password": "test1234"}'

# Get current user (use token from login)
curl http://localhost:3000/auth/me \
  -H "Authorization: Bearer <token>"

# Send message (use token)
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"message": "Hello"}'
```

---

#### Task 6.2: Frontend Testing

**Checklist**:
- [ ] Test registration UI
- [ ] Test login UI
- [ ] Test logout
- [ ] Test protected route redirect
- [ ] Test session list loading
- [ ] Test "New Chat" button
- [ ] Test session selection
- [ ] Test session deletion
- [ ] Test message sending
- [ ] Test history loading
- [ ] Test token persistence (refresh page)
- [ ] Test token expiry handling
- [ ] Test error messages
- [ ] Test responsive layout

---

#### Task 6.3: Integration Testing

**Checklist**:
- [ ] Test full user journey: Register → Login → Chat → Logout
- [ ] Test multiple users with separate sessions
- [ ] Test session ownership (User A can't access User B's sessions)
- [ ] Test concurrent chats
- [ ] Test session switching
- [ ] Test session deletion while chatting
- [ ] Test token refresh
- [ ] Test backend restart (token persistence)

---

#### Task 6.4: Security Testing

**Checklist**:
- [ ] Test SQL injection in email/password
- [ ] Test XSS in message content
- [ ] Test CORS from different origin
- [ ] Test password strength validation
- [ ] Test rate limiting (if implemented)
- [ ] Test token tampering
- [ ] Test expired token
- [ ] Test session hijacking (CSRF)

---

#### Task 6.5: Bug Fixes & Polish

**Common Issues**:
- [ ] Fix token not included in API calls
- [ ] Fix session list not refreshing after new chat
- [ ] Fix session title not updating
- [ ] Fix UI jumping during session load
- [ ] Fix error messages not clearing
- [ ] Fix logout not clearing chat state
- [ ] Fix dark mode contrast issues
- [ ] Fix mobile responsive issues

---

### ⏰ PHASE 7: DOCUMENTATION & DEPLOYMENT (Day 5)

#### Task 7.1: Update Documentation

**Files to update**:
- [ ] README.md (add auth instructions)
- [ ] API_REFERENCE.md (add auth endpoints)
- [ ] DATABASE_SCHEMA.md (update users/sessions tables)
- [ ] STRUCTURE.md (update architecture diagrams)
- [ ] CHANGELOG.md (add v2.0.0 entry)

---

#### Task 7.2: Update .env.example

**Backend**:
```bash
# Add to backend/.env.example
JWT_SECRET_KEY=your-secret-key-here-min-32-chars
JWT_ALGORITHM=HS256
JWT_EXPIRY_HOURS=24
FRONTEND_URL=http://localhost:5173
```

**Checklist**:
- [ ] Add JWT variables
- [ ] Add comments
- [ ] Update README with setup instructions

---

#### Task 7.3: Migration Guide for Existing Users

**Create**: `docs/MIGRATION_V2.md`

**Content**:
- [ ] Explain breaking changes
- [ ] Provide database migration steps
- [ ] Explain how to migrate default user to real user
- [ ] Provide rollback instructions

---

#### Task 7.4: Deployment Preparation

**Checklist**:
- [ ] Set secure JWT_SECRET_KEY in production
- [ ] Update CORS_ORIGINS for production
- [ ] Enable HTTPS
- [ ] Add rate limiting
- [ ] Add logging
- [ ] Test production build
- [ ] Create deployment script
- [ ] Document deployment process

---

## 📊 PROGRESS TRACKING

### Day 1: Backend Database + Auth Setup
- [x] Update database models
- [ ] Create migrations
- [ ] Add auth dependencies
- [ ] Implement auth utilities
- [ ] Create auth middleware
- [ ] Create auth endpoints

### Day 2: Backend Integration + Frontend Setup
- [ ] Update existing endpoints with auth
- [ ] Add ownership checks
- [ ] Frontend dependencies
- [ ] Auth types & API client
- [ ] Auth store
- [ ] Auth pages

### Day 3: Frontend Session Management
- [ ] Update chat store
- [ ] Create Sidebar component
- [ ] Create SessionItem component
- [ ] Create TopBar component
- [ ] Update ChatPage layout
- [ ] Update SessionHeader

### Day 4: Testing & Fixes
- [ ] Backend testing
- [ ] Frontend testing
- [ ] Integration testing
- [ ] Security testing
- [ ] Bug fixes

### Day 5: Documentation & Deployment
- [ ] Update documentation
- [ ] Migration guide
- [ ] Deployment preparation
- [ ] Final testing

---

## 🚨 RISKS & MITIGATION

### Risk 1: Breaking Changes for Existing Users
**Mitigation**: 
- Keep backwards compatibility during migration
- Provide clear migration guide
- Test rollback procedure

### Risk 2: Token Security
**Mitigation**:
- Use strong secret key
- Implement token refresh
- Add expiry handling
- Enable HTTPS in production

### Risk 3: Database Migration Failure
**Mitigation**:
- Backup database before migration
- Test on staging first
- Provide rollback script
- Document failure recovery

### Risk 4: Performance Issues with Large Session Lists
**Mitigation**:
- Add pagination to session list
- Implement lazy loading
- Add database indexes
- Cache frequently accessed data

---

## ✅ DEFINITION OF DONE

### Backend
- [ ] All auth endpoints working
- [ ] All existing endpoints require JWT
- [ ] Ownership checks prevent unauthorized access
- [ ] Tests pass
- [ ] Documentation updated

### Frontend
- [ ] Login/register pages working
- [ ] Protected routes work
- [ ] Session list loads correctly
- [ ] Session switching works
- [ ] Chat functionality intact
- [ ] Token persistence works
- [ ] Error handling works

### Integration
- [ ] Full user flow works end-to-end
- [ ] Multiple users don't interfere
- [ ] Sessions isolated by user
- [ ] No security vulnerabilities
- [ ] Performance acceptable

---

**Total Tasks**: 95  
**Estimated Time**: 3-5 days  
**Priority**: High  
**Version**: 2.0.0
