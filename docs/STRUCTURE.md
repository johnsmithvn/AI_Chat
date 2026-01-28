# Project Structure

Complete file structure reference for AI Chat v2.

---

## Root Directory

```
AI_Chat_2/
├── 📄 docker-compose.yml      # Docker services (PostgreSQL)
├── 📄 README.md               # Project overview & quick start
├── 📄 CODESTRUCTURE.md        # Complete code reference
├── 📄 CHANGELOG.md            # Version history
├── 📄 TODO.md                 # Task tracking
├── 📄 TODO_V2.md              # V2 specific tasks
├── 📁 backend/                # FastAPI backend
├── 📁 web/                    # React frontend
├── 📁 docs/                   # Documentation
└── 📁 instructions/           # Development instructions
```

---

## Backend Structure

```
backend/
├── 📄 main.py                 # Entry point: python main.py
├── 📄 requirements.txt        # Python dependencies
├── 📄 alembic.ini            # Database migrations config
├── 📄 README.md              # Backend-specific docs
│
├── 📁 app/                    # Application package
│   ├── 📄 __init__.py
│   ├── 📄 main.py            # FastAPI app factory
│   │
│   ├── 📁 api/               # Route handlers (controllers)
│   │   ├── 📄 __init__.py
│   │   ├── 📄 auth.py        # POST /register, /login, /logout
│   │   ├── 📄 chat.py        # POST /chat, GET /history
│   │   ├── 📄 session.py     # CRUD /sessions
│   │   ├── 📄 health.py      # GET /health, /health/db
│   │   └── 📄 debug.py       # GET /debug (dev only)
│   │
│   ├── 📁 core/              # Core utilities
│   │   ├── 📄 __init__.py
│   │   ├── 📄 auth.py        # JWT tokens, password hashing
│   │   ├── 📄 config.py      # Settings, environment vars
│   │   └── 📄 logging.py     # Logging configuration
│   │
│   ├── 📁 db/                # Database layer
│   │   ├── 📄 __init__.py
│   │   ├── 📄 base.py        # SQLAlchemy engine, session
│   │   ├── 📄 models.py      # ORM models (User, Session, Message)
│   │   └── 📄 crud.py        # Database operations
│   │
│   ├── 📁 middlewares/       # Request middleware
│   │   ├── 📄 __init__.py
│   │   ├── 📄 auth.py        # JWT authentication
│   │   └── 📄 request_id.py  # Request ID tracking
│   │
│   ├── 📁 schemas/           # Pydantic DTOs
│   │   ├── 📄 __init__.py
│   │   ├── 📄 auth.py        # RegisterRequest, LoginRequest, etc.
│   │   ├── 📄 chat.py        # MessageCreate, MessageResponse
│   │   ├── 📄 session.py     # SessionCreate, SessionResponse
│   │   └── 📄 common.py      # ApiResponse wrapper
│   │
│   └── 📁 services/          # Business logic
│       ├── 📄 __init__.py
│       ├── 📄 ai_core.py     # AI model integration
│       ├── 📄 chat_service.py    # Chat processing
│       └── 📄 session_service.py # Session management
│
├── 📁 migrations/             # Alembic migrations
│   ├── 📄 env.py             # Migration environment
│   ├── 📄 README
│   ├── 📄 script.py.mako     # Migration template
│   └── 📁 versions/          # Migration files
│       └── 📄 ...            # Individual migrations
│
└── 📁 tests/                  # Backend tests
```

---

## Frontend Structure

```
web/
├── 📄 index.html              # HTML entry point
├── 📄 package.json            # NPM dependencies
├── 📄 vite.config.ts          # Vite build config
├── 📄 tsconfig.json           # TypeScript config
├── 📄 tsconfig.app.json       # App-specific TS config
├── 📄 tsconfig.node.json      # Node-specific TS config
├── 📄 eslint.config.js        # ESLint rules
├── 📄 README.md               # Frontend-specific docs
│
├── 📁 public/                 # Static assets
│
└── 📁 src/                    # Source code
    ├── 📄 main.tsx           # React entry point
    ├── 📄 App.tsx            # Root component & routes
    ├── 📄 App.css            # Global styles
    ├── 📄 index.css          # Base styles
    │
    ├── 📁 assets/            # Images, fonts, etc.
    │
    ├── 📁 components/        # Reusable UI components
    │   ├── 📁 auth/          # Authentication
    │   │   └── 📄 ProtectedRoute.tsx
    │   ├── 📁 chat/          # Chat UI
    │   │   ├── 📄 ChatInput.tsx      # Message input
    │   │   ├── 📄 ChatWindow.tsx     # Main chat area
    │   │   ├── 📄 MessageBubble.tsx  # Single message
    │   │   ├── 📄 MessageList.tsx    # Message container
    │   │   └── 📄 DebugPanel.tsx     # Debug info
    │   └── 📁 layout/        # Layout components
    │       ├── 📄 Sidebar.tsx        # Session list
    │       ├── 📄 Sidebar.css
    │       ├── 📄 TopBar.tsx         # Header
    │       └── 📄 TopBar.css
    │
    ├── 📁 pages/             # Page components (routes)
    │   ├── 📄 ChatPage.tsx   # Main chat page
    │   ├── 📄 ChatPage.css
    │   ├── 📄 LoginPage.tsx  # Login form
    │   └── 📄 RegisterPage.tsx # Registration form
    │
    ├── 📁 services/          # API clients
    │   ├── 📄 auth.api.ts    # Auth API calls
    │   └── 📄 chat.api.ts    # Chat/Session API calls
    │
    ├── 📁 store/             # Zustand state stores
    │   ├── 📄 auth.store.ts  # Authentication state
    │   └── 📄 chat.store.ts  # Chat/session state
    │
    ├── 📁 types/             # TypeScript type definitions
    │   ├── 📄 api.ts         # API response types
    │   ├── 📄 auth.ts        # User, token types
    │   └── 📄 chat.ts        # Message, session types
    │
    ├── 📁 config/            # Configuration
    │   └── 📄 env.ts         # Environment variables
    │
    └── 📁 styles/            # Additional styles
        └── 📄 auth.css       # Auth page styles
```

---

## Documentation Structure

```
docs/
├── 📄 API_REFERENCE.md        # Complete API documentation
├── 📄 DATABASE_SCHEMA.md      # Database tables & relationships
├── 📄 CODEBASE_GUIDE.md       # Developer guide
└── 📄 STRUCTURE.md            # This file
```

---

## Key File Descriptions

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Defines PostgreSQL container |
| `backend/main.py` | Runs uvicorn server on port 3000 |
| `backend/app/main.py` | Creates FastAPI app, configures CORS |
| `backend/app/core/config.py` | All settings and environment vars |
| `backend/app/db/models.py` | User, Session, Message ORM models |
| `backend/requirements.txt` | Python dependencies |
| `web/src/App.tsx` | React Router, app structure |
| `web/src/store/*.ts` | Zustand state management |
| `web/package.json` | NPM dependencies |

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│   web/src/pages/         web/src/components/                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     State Layer                              │
│   web/src/store/         web/src/services/                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTP
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│   backend/app/api/       backend/app/middlewares/           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Business Layer                             │
│   backend/app/services/  backend/app/core/                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│   backend/app/db/        backend/migrations/                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   PostgreSQL     │
                    └──────────────────┘
```
