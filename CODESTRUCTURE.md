# 📋 AI Chat V2 - Code Structure

**Complete codebase reference** - Updated 2026-01-31

---

## 📁 Complete File Structure

```
AI_Chat_2/
│
├── backend/                          # FastAPI Backend (Python 3.11)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app entry point
│   │   │
│   │   ├── api/                      # REST API Endpoints
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # POST /auth/register, /auth/login
│   │   │   │                        # GET /auth/me, PUT /auth/me
│   │   │   ├── chat.py              # POST /chat, GET /chat/history/{id}
│   │   │   ├── session.py           # CRUD /session, /sessions
│   │   │   ├── health.py            # GET /, /health
│   │   │   └── debug.py             # GET /debug/message/{id}, /debug/session/{id}/events
│   │   │
│   │   ├── core/                     # Core Utilities
│   │   │   ├── __init__.py
│   │   │   ├── config.py            # Settings class (env-based config)
│   │   │   ├── auth.py              # hash_password(), verify_password()
│   │   │   │                        # create_access_token(), decode_access_token()
│   │   │   └── logging.py           # Structlog setup, get_logger()
│   │   │
│   │   ├── db/                       # Database Layer
│   │   │   ├── __init__.py
│   │   │   ├── base.py              # SQLAlchemy engine, SessionLocal, get_db()
│   │   │   ├── models.py            # User, ChatSession, Message, Event models
│   │   │   └── crud.py              # All CRUD operations
│   │   │
│   │   ├── middlewares/             # FastAPI Middlewares
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # get_current_user() - JWT validation
│   │   │   └── request_id.py        # RequestIDMiddleware - X-Request-ID header
│   │   │
│   │   ├── schemas/                  # Pydantic Schemas (DTOs)
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # RegisterRequest, LoginRequest, TokenResponse, UserResponse
│   │   │   ├── chat.py              # ChatRequest, ChatResponse, MessageCreate, MessageResponse
│   │   │   ├── session.py           # SessionCreate, SessionResponse, SessionListResponse
│   │   │   └── common.py            # MetadataSchema
│   │   │
│   │   └── services/                 # Business Logic
│   │       ├── __init__.py
│   │       ├── ai_core.py           # AICoreClient - HTTP client for AI Core
│   │       ├── chat_service.py      # ChatService - process_message(), get_history()
│   │       └── session_service.py   # SessionService - create, list, delete sessions
│   │
│   ├── migrations/                   # Alembic Migrations
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/
│   │       └── 2026_01_28_*.py      # Auth & session features migration
│   │
│   ├── alembic.ini                  # Alembic configuration
│   ├── requirements.txt             # Python dependencies
│   ├── main.py                      # Entry point (imports app.main)
│   └── .env                         # Environment variables
│
├── web/                              # React Frontend (TypeScript + Vite)
│   ├── src/
│   │   ├── main.tsx                 # React entry point
│   │   ├── App.tsx                  # Router configuration
│   │   ├── App.css                  # Global styles
│   │   ├── index.css                # Reset styles
│   │   │
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── ProtectedRoute.tsx    # Auth guard - redirects to /login
│   │   │   │
│   │   │   ├── chat/
│   │   │   │   ├── ChatWindow.tsx        # Main chat container
│   │   │   │   ├── ChatInput.tsx         # Message input with send button
│   │   │   │   ├── MessageList.tsx       # Renders all messages
│   │   │   │   ├── MessageBubble.tsx     # Single message with persona colors
│   │   │   │   └── DebugPanel.tsx        # AI metadata display
│   │   │   │
│   │   │   └── layout/
│   │   │       ├── Sidebar.tsx           # Session list, new chat, delete all, delete single (3-dot menu)
│   │   │       ├── Sidebar.css
│   │   │       ├── TopBar.tsx            # User menu, logout
│   │   │       └── TopBar.css
│   │   │
│   │   ├── pages/
│   │   │   ├── ChatPage.tsx         # Main chat page (protected)
│   │   │   ├── ChatPage.css
│   │   │   ├── LoginPage.tsx        # Login form
│   │   │   └── RegisterPage.tsx     # Registration form
│   │   │
│   │   ├── services/
│   │   │   ├── auth.api.ts          # authApi - login, register, getMe, updateMe
│   │   │   └── chat.api.ts          # chatApi - sendMessage, createSession, etc.
│   │   │
│   │   ├── store/
│   │   │   ├── auth.store.ts        # AuthStore (Zustand) - user, token, login/logout
│   │   │   └── chat.store.ts        # ChatStore (Zustand) - messages, sessions, send
│   │   │
│   │   ├── types/
│   │   │   ├── auth.ts              # User, LoginRequest, RegisterRequest
│   │   │   ├── chat.ts              # Message, Session, ChatMetadata
│   │   │   └── api.ts               # API response types
│   │   │
│   │   ├── styles/
│   │   │   └── auth.css             # Login/Register page styles
│   │   │
│   │   └── config/
│   │       └── env.ts               # API_URL from environment
│   │
│   ├── public/
│   ├── index.html
│   ├── package.json                 # NPM dependencies
│   ├── tsconfig.json
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts               # Vite configuration
│   └── eslint.config.js
│
├── docs/                             # Documentation
│   ├── API_REFERENCE.md             # API documentation
│   ├── DATABASE_SCHEMA.md           # Database schema
│   ├── CODEBASE_GUIDE.md            # Developer guide
│   └── COMPLETED_TASKS.md           # Archived completed tasks
│
├── docker-compose.yml               # PostgreSQL container
├── README.md                        # Project overview
├── CODESTRUCTURE.md                 # This file
└── CHANGELOG.md                     # Version history
```

---

## 🔧 Backend Components

### API Endpoints (15 total)

| File | Method | Endpoint | Auth | Description |
|------|--------|----------|------|-------------|
| health.py | GET | `/` | ❌ | Root check |
| health.py | GET | `/health` | ❌ | Health check |
| auth.py | POST | `/auth/register` | ❌ | Register user |
| auth.py | POST | `/auth/login` | ❌ | Login user |
| auth.py | GET | `/auth/me` | ✅ | Get current user |
| auth.py | PUT | `/auth/me` | ✅ | Update profile |
| auth.py | POST | `/auth/logout` | ❌ | Logout (no-op) |
| chat.py | POST | `/chat` | ✅ | Send message |
| chat.py | GET | `/chat/history/{id}` | ✅ | Get history |
| session.py | POST | `/session` | ✅ | Create session |
| session.py | GET | `/session/{id}` | ✅ | Get session |
| session.py | PUT | `/session/{id}` | ✅ | Rename session |
| session.py | GET | `/sessions` | ✅ | List sessions |
| session.py | DELETE | `/session/{id}` | ✅ | Delete session |
| session.py | DELETE | `/sessions` | ✅ | Delete all |
| debug.py | GET | `/debug/message/{id}` | ❌ | Get message metadata |
| debug.py | GET | `/debug/session/{id}/events` | ❌ | Get session events |

### Database Models (4 tables)

| Model | Table | Key Fields |
|-------|-------|------------|
| User | users | id, email, password_hash, name |
| ChatSession | chat_sessions | id, user_id, ai_session_id, title |
| Message | messages | id, session_id, role, content, persona |
| Event | events | id, session_id, type, payload |

### Services

| Service | File | Methods |
|---------|------|---------|
| AICoreClient | ai_core.py | chat(), get_history(), cleanup() |
| ChatService | chat_service.py | process_message(), get_history() |
| SessionService | session_service.py | create(), get(), list(), delete() |

### CRUD Operations (crud.py)

| Category | Functions |
|----------|-----------|
| User | create_user, get_user, get_user_by_email, update_user, update_user_last_login |
| Session | create_session, get_session, get_session_by_ai_id, list_user_sessions, update_session_title, delete_session, delete_all_user_sessions |
| Message | create_message, get_messages_by_session, get_message |
| Event | create_event, get_events_by_session |

---

## 🎨 Frontend Components

### Pages (3)

| Page | Route | Description |
|------|-------|-------------|
| LoginPage | `/login` | Login form |
| RegisterPage | `/register` | Registration form |
| ChatPage | `/` | Main chat (protected) |

### Components (11)

| Category | Component | Description |
|----------|-----------|-------------|
| auth | ProtectedRoute | Route guard, redirects to login |
| common | ConfirmDialog | Reusable confirmation popup |
| common | InputDialog | Reusable input popup for rename |
| layout | Sidebar | Session list, new chat button |
| layout | TopBar | User menu, logout button |
| chat | ChatWindow | Main chat container |
| chat | ChatInput | Text input with send |
| chat | MessageList | Renders messages |
| chat | MessageBubble | Single message display |
| chat | DebugPanel | AI metadata viewer |

### Stores (Zustand)

#### AuthStore (auth.store.ts)
```typescript
State: { user, token, isLoading, error }
Actions: login(), register(), logout(), loadUser(), clearError()
```

#### ChatStore (chat.store.ts)
```typescript
State: { messages, sessions, currentSessionId, loading, error, currentMetadata }
Actions: sendMessage(), createSession(), loadHistory(), loadSessions(), 
         selectSession(), deleteSession(), deleteAllSessions(), clearSession()
```

### API Services

#### authApi (auth.api.ts)
- login(email, password)
- register(email, password, name)
- getMe()
- updateMe(data)
- logout()

#### chatApi (chat.api.ts)
- sendMessage(message, sessionId)
- createSession()
- getHistory(sessionId)
- deleteSession(sessionId)
- listSessions()
- deleteAllSessions()
- renameSession(sessionId, title)

---

## 🔐 Authentication Flow

```
1. User visits /login or /register
2. Submit credentials → POST /auth/login or /auth/register
3. Backend validates, returns { access_token, user }
4. Frontend stores token in localStorage
5. authStore.login() updates state
6. Navigate to / (ChatPage)
7. ProtectedRoute checks token → loads user info
8. All API calls include: Authorization: Bearer <token>
9. Token expires in 24 hours
```

---

## 🗄️ Database Schema

### users
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| email | TEXT | UNIQUE, NOT NULL |
| password_hash | TEXT | NOT NULL |
| name | TEXT | NOT NULL |
| avatar_url | TEXT | NULLABLE |
| created_at | TIMESTAMP | DEFAULT NOW() |
| last_login_at | TIMESTAMP | NULLABLE |

### chat_sessions
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| user_id | UUID | FK(users.id) CASCADE |
| ai_session_id | TEXT | UNIQUE, NOT NULL |
| title | TEXT | NULLABLE |
| message_count | INTEGER | DEFAULT 0 |
| is_archived | INTEGER | DEFAULT 0 |
| created_at | TIMESTAMP | DEFAULT NOW() |
| last_active_at | TIMESTAMP | DEFAULT NOW() |

### messages
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| session_id | UUID | FK(chat_sessions.id) CASCADE |
| role | TEXT | CHECK('user','assistant') |
| content | TEXT | NOT NULL |
| persona | TEXT | NULLABLE |
| context_type | TEXT | NULLABLE |
| confidence | FLOAT | NULLABLE |
| model_name | TEXT | NULLABLE |
| prompt_tokens | INTEGER | NULLABLE |
| completion_tokens | INTEGER | NULLABLE |
| created_at | TIMESTAMP | DEFAULT NOW() |

### events
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PRIMARY KEY |
| session_id | UUID | FK(chat_sessions.id) CASCADE |
| type | TEXT | NOT NULL |
| payload | JSONB | NULLABLE |
| created_at | TIMESTAMP | DEFAULT NOW() |

---

## 📦 Dependencies

### Backend (requirements.txt)
| Package | Version | Purpose |
|---------|---------|---------|
| fastapi | 0.109.0 | Web framework |
| uvicorn[standard] | 0.27.0 | ASGI server |
| pydantic | 2.5.3 | Validation |
| pydantic-settings | 2.1.0 | Settings |
| sqlalchemy | 2.0.25 | ORM |
| psycopg2-binary | 2.9.9 | PostgreSQL driver |
| alembic | 1.13.1 | Migrations |
| httpx | 0.26.0 | HTTP client |
| structlog | 24.1.0 | Logging |
| python-jose[cryptography] | 3.3.0 | JWT |
| passlib[bcrypt] | 1.7.4 | Password hashing |
| bcrypt | 4.0.1 | Bcrypt backend |
| python-multipart | 0.0.6 | Form data |
| python-dotenv | 1.0.0 | Env loading |
| email-validator | 2.x | Email validation |

### Frontend (package.json)
| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.2.0 | UI framework |
| react-dom | 19.2.0 | DOM rendering |
| react-router-dom | 7.13.0 | Routing |
| zustand | 5.0.10 | State management |
| axios | 1.13.3 | HTTP client |
| jwt-decode | 4.0.0 | JWT parsing |
| typescript | 5.8.3 | Type safety |
| vite | 6.3.3 | Build tool |

---

## ✅ Status

| Component | Status |
|-----------|--------|
| Backend API | ✅ Complete |
| Database Models | ✅ Complete |
| JWT Authentication | ✅ Complete |
| Session Management | ✅ Complete |
| Frontend Pages | ✅ Complete |
| State Management | ✅ Complete |
| Chat Integration | ✅ Complete |
| Debug Panel | ✅ Complete |

---

**Last Updated**: 2026-01-31
