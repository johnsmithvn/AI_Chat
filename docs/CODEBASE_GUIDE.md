# Codebase Guide

Developer guide for understanding and contributing to AI Chat v2.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Backend Deep Dive](#backend-deep-dive)
- [Frontend Deep Dive](#frontend-deep-dive)
- [Development Workflow](#development-workflow)
- [Common Patterns](#common-patterns)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

AI Chat v2 is a full-stack web application that provides an AI-powered chat interface. It features user authentication, session management, and real-time AI conversations.

### Tech Stack Summary

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React + TypeScript | 19.2.0 |
| Build Tool | Vite | 6.3.1 |
| State Management | Zustand | 5.0.10 |
| Backend | FastAPI | 0.109.0 |
| Database | PostgreSQL | 14 |
| ORM | SQLAlchemy | 2.0.25 |
| Authentication | JWT (python-jose) | 3.3.0 |
| Password Hashing | bcrypt | 4.0.1 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  Pages   │  │Components│  │  Store   │  │   Services   │ │
│  │ (Routes) │──│  (UI)    │──│ (Zustand)│──│ (API Client) │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                        Backend                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │   API    │  │Middleware│  │ Services │  │     Core     │ │
│  │ (Routes) │──│ (Auth)   │──│ (Logic)  │──│ (Config/JWT) │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘ │
│                      │                                       │
│                      ▼                                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    Database Layer                     │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │  Models  │  │   CRUD   │  │    SQLAlchemy    │   │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   PostgreSQL 14  │
                    └──────────────────┘
```

---

## Backend Deep Dive

### Directory Structure

```
backend/
├── main.py                    # Entry point (python main.py)
├── requirements.txt           # Python dependencies
├── alembic.ini               # Alembic configuration
├── app/
│   ├── main.py               # FastAPI app creation
│   ├── api/                  # Route handlers
│   │   ├── auth.py          # /api/auth/* endpoints
│   │   ├── chat.py          # /api/chat/* endpoints
│   │   ├── session.py       # /api/sessions/* endpoints
│   │   ├── health.py        # /api/health endpoints
│   │   └── debug.py         # /api/debug endpoints
│   ├── core/                 # Core utilities
│   │   ├── auth.py          # JWT & password utilities
│   │   ├── config.py        # Settings & environment
│   │   └── logging.py       # Logging configuration
│   ├── db/                   # Database layer
│   │   ├── base.py          # SQLAlchemy setup
│   │   ├── models.py        # ORM models
│   │   └── crud.py          # Database operations
│   ├── middlewares/          # Request middleware
│   │   ├── auth.py          # Authentication middleware
│   │   └── request_id.py    # Request ID tracking
│   ├── schemas/              # Pydantic models
│   │   ├── auth.py          # Auth DTOs
│   │   ├── chat.py          # Chat DTOs
│   │   ├── session.py       # Session DTOs
│   │   └── common.py        # Shared DTOs
│   └── services/             # Business logic
│       ├── ai_core.py       # AI integration
│       ├── chat_service.py  # Chat operations
│       └── session_service.py # Session operations
└── migrations/               # Alembic migrations
    └── versions/            # Migration files
```

### Key Files Explained

#### `app/main.py` - Application Factory

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, chat, session, health, debug

def create_app() -> FastAPI:
    app = FastAPI(title="AI Chat API", version="2.0.0")
    
    # CORS for frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Register routers
    app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    app.include_router(session.router, prefix="/api/sessions", tags=["sessions"])
    app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
    app.include_router(health.router, prefix="/api/health", tags=["health"])
    app.include_router(debug.router, prefix="/api/debug", tags=["debug"])
    
    return app
```

#### `app/core/auth.py` - Authentication Utilities

Handles JWT token creation/verification and password hashing:

```python
from passlib.context import CryptContext
from jose import jwt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Truncate to 72 bytes for bcrypt compatibility
    truncated = plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.verify(truncated, hashed_password)

def get_password_hash(password: str) -> str:
    truncated = password.encode('utf-8')[:72].decode('utf-8', errors='ignore')
    return pwd_context.hash(truncated)
```

> ⚠️ **Important:** bcrypt has a 72-byte password limit. Passwords are truncated to prevent errors.

#### `app/db/crud.py` - Database Operations

CRUD (Create, Read, Update, Delete) operations for all models:

```python
def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, user: UserCreate) -> User:
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, name=user.name, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
```

---

## Frontend Deep Dive

### Directory Structure

```
web/
├── index.html              # Entry HTML
├── package.json            # Dependencies
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript config
└── src/
    ├── main.tsx           # React entry point
    ├── App.tsx            # Root component
    ├── components/        # Reusable UI components
    │   ├── auth/          # Auth components
    │   │   └── ProtectedRoute.tsx
    │   ├── chat/          # Chat components
    │   │   ├── ChatInput.tsx
    │   │   ├── ChatWindow.tsx
    │   │   ├── MessageBubble.tsx
    │   │   ├── MessageList.tsx
    │   │   └── DebugPanel.tsx
    │   └── layout/        # Layout components
    │       ├── Sidebar.tsx
    │       └── TopBar.tsx
    ├── pages/             # Page components
    │   ├── ChatPage.tsx
    │   ├── LoginPage.tsx
    │   └── RegisterPage.tsx
    ├── services/          # API clients
    │   ├── auth.api.ts
    │   └── chat.api.ts
    ├── store/             # Zustand stores
    │   ├── auth.store.ts
    │   └── chat.store.ts
    ├── types/             # TypeScript types
    │   ├── api.ts
    │   ├── auth.ts
    │   └── chat.ts
    └── config/
        └── env.ts         # Environment config
```

### State Management with Zustand

#### Auth Store (`store/auth.store.ts`)

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  
  login: async (email, password) => {
    const response = await authApi.login(email, password);
    localStorage.setItem('token', response.access_token);
    set({ token: response.access_token, isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  }
}));
```

#### Chat Store (`store/chat.store.ts`)

```typescript
interface ChatState {
  sessions: Session[];
  currentSession: Session | null;
  messages: Message[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  createSession: (title: string) => Promise<void>;
  loadMessages: (sessionId: string) => Promise<void>;
}
```

### Protected Routes

```typescript
// components/auth/ProtectedRoute.tsx
export const ProtectedRoute: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Usage in App.tsx
<Route path="/chat" element={
  <ProtectedRoute>
    <ChatPage />
  </ProtectedRoute>
} />
```

---

## Development Workflow

### Starting Development

```bash
# Terminal 1: Database
docker-compose up -d postgres

# Terminal 2: Backend
cd backend
.venv\Scripts\activate  # Windows
python main.py

# Terminal 3: Frontend
cd web
npm run dev
```

### Adding a New API Endpoint

1. **Create/Update Schema** (`backend/app/schemas/`)
   ```python
   class NewFeatureRequest(BaseModel):
       field: str
   ```

2. **Add CRUD Operation** (`backend/app/db/crud.py`)
   ```python
   def create_feature(db: Session, data: NewFeatureRequest):
       ...
   ```

3. **Create Route Handler** (`backend/app/api/`)
   ```python
   @router.post("/", response_model=ApiResponse)
   async def create(request: NewFeatureRequest, db: Session = Depends(get_db)):
       ...
   ```

4. **Register Router** (`backend/app/main.py`)
   ```python
   app.include_router(new_feature.router, prefix="/api/feature")
   ```

### Adding a New Frontend Feature

1. **Define Types** (`web/src/types/`)
2. **Create API Service** (`web/src/services/`)
3. **Update Store** (`web/src/store/`)
4. **Create Components** (`web/src/components/`)
5. **Add Route if needed** (`web/src/App.tsx`)

---

## Common Patterns

### API Response Pattern

All API responses follow a consistent structure:

```python
# Success
{
    "success": true,
    "data": { ... },
    "message": "Optional message"
}

# Error
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Human readable message"
    }
}
```

### Dependency Injection

FastAPI dependencies for common needs:

```python
# Get current user
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    # Validate token and return user
    ...

# Usage
@router.get("/me")
async def get_me(user: User = Depends(get_current_user)):
    return user
```

### React Component Pattern

```typescript
interface Props {
  // Typed props
}

export const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  const { state, action } = useStore();
  
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

---

## Troubleshooting

### Common Issues

#### "bcrypt.checkpw() takes exactly 2 positional arguments"

**Cause:** bcrypt 5.x is incompatible with passlib  
**Fix:** Downgrade bcrypt
```bash
pip install bcrypt==4.0.1
```

#### "model_name" protected namespace warning

**Cause:** Pydantic v2 reserves `model_` prefix  
**Fix:** Add to schema class
```python
model_config = ConfigDict(protected_namespaces=())
```

#### CORS errors in browser

**Cause:** Frontend origin not in allowed list  
**Fix:** Check CORS config in `backend/app/main.py`
```python
allow_origins=["http://localhost:5173"]
```

#### Database connection refused

**Cause:** PostgreSQL not running  
**Fix:**
```bash
docker-compose up -d postgres
docker ps  # Verify it's running
```

#### Module not found errors

**Cause:** Virtual environment not activated or dependencies missing  
**Fix:**
```bash
cd backend
.venv\Scripts\activate
pip install -r requirements.txt
```

---

## Environment Variables

### Backend (.env)

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ai_chat

# JWT
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI (if using)
OPENAI_API_KEY=sk-...
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
```

---

## Git Workflow

```bash
# Feature branch
git checkout -b feat/feature-name

# After changes
git add .
git commit -m "feat: add feature description"
git push origin feat/feature-name

# Merge to main via PR
```

Current branch: `feat/add-auth`
