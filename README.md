# 🤖 AI Chat V2

**Full-stack AI Chat Application** với Authentication, Session Management và AI Core Integration.

---

## 🎯 Features

- ✅ **User Authentication** - JWT-based login/register
- ✅ **Session Management** - Create, switch, delete conversations
- ✅ **AI Chat Integration** - Connect to AI Core LLM service
- ✅ **Real-time Metadata** - Persona, confidence, context tracking
- ✅ **Debug Panel** - AI behavior analysis
- ✅ **Responsive UI** - Modern React interface

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              React 19 + TypeScript + Vite               │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │ │
│  │  │LoginPage │ │RegisterPg│ │ ChatPage │ │DebugPanel  │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │     Zustand (AuthStore + ChatStore)              │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            Port 5173                         │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼ REST API + JWT
┌──────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                 FastAPI + Python 3.11                   │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │ │
│  │  │ /auth/*  │ │ /chat/*  │ │/session/*│ │ /debug/*   │  │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘  │ │
│  │  ┌──────────────────────────────────────────────────┐   │ │
│  │  │    Services (Chat, Session, AICore Client)       │   │ │
│  │  └──────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                            Port 3000                         │
└──────────────────────────────────────────────────────────────┘
         │                                      │
         ▼                                      ▼
┌─────────────────┐                  ┌─────────────────────┐
│   PostgreSQL    │                  │      AI Core        │
│    Port 5432    │                  │     Port 8000       │
│  ┌───────────┐  │                  │  ┌───────────────┐  │
│  │  users    │  │                  │  │  LLM Service  │  │
│  │  sessions │  │                  │  │  Personas     │  │
│  │  messages │  │                  │  │  Context      │  │
│  │  events   │  │                  │  └───────────────┘  │
│  └───────────┘  │                  └─────────────────────┘
└─────────────────┘
```

---

## 📁 Project Structure

```
AI_Chat_2/
│
├── backend/                          # FastAPI Backend
│   ├── app/
│   │   ├── api/                      # REST API Endpoints
│   │   │   ├── auth.py              # JWT authentication
│   │   │   ├── chat.py              # Chat messaging
│   │   │   ├── session.py           # Session CRUD
│   │   │   ├── health.py            # Health checks
│   │   │   └── debug.py             # Debug utilities
│   │   ├── core/                     # Core utilities
│   │   │   ├── config.py            # Settings (env-based)
│   │   │   ├── auth.py              # JWT + bcrypt
│   │   │   └── logging.py           # Structured logging
│   │   ├── db/                       # Database layer
│   │   │   ├── base.py              # SQLAlchemy setup
│   │   │   ├── models.py            # ORM models
│   │   │   └── crud.py              # CRUD operations
│   │   ├── middlewares/             # FastAPI middlewares
│   │   ├── schemas/                  # Pydantic schemas
│   │   ├── services/                 # Business logic
│   │   └── main.py                   # FastAPI app entry
│   ├── migrations/                   # Alembic migrations
│   └── requirements.txt              # Python dependencies
│
├── web/                              # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/                # ProtectedRoute
│   │   │   ├── chat/                # ChatWindow, MessageList, etc.
│   │   │   └── layout/              # Sidebar, TopBar
│   │   ├── pages/                   # ChatPage, LoginPage, RegisterPage
│   │   ├── services/                # API clients
│   │   ├── store/                   # Zustand stores
│   │   └── types/                   # TypeScript types
│   └── package.json
│
├── docs/                             # Documentation
├── docker-compose.yml                # PostgreSQL container
└── README.md                         # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose
- AI Core running on port 8000

### 1. Start Database

```bash
docker-compose up -d
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv ../.venv
..\.venv\Scripts\activate  # Windows
# source ../.venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run migrations
python -m alembic upgrade head

# Start server
python main.py
```

Backend runs at: **http://localhost:3000**

### 3. Setup Frontend

```bash
cd web
npm install
npm run dev
```

Frontend runs at: **http://localhost:5173**

---

## 🔐 API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login user |
| GET | `/auth/me` | ✅ | Get current user |
| PUT | `/auth/me` | ✅ | Update profile |

### Chat
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/chat` | ✅ | Send message |
| GET | `/chat/history/{id}` | ✅ | Get history |

### Session
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/session` | ✅ | Create session |
| GET | `/session/{id}` | ✅ | Get session |
| GET | `/sessions` | ✅ | List sessions |
| DELETE | `/session/{id}` | ✅ | Delete session |
| DELETE | `/sessions` | ✅ | Delete all |

---

## 🗄️ Database Schema

```sql
-- Users
users (id, email, password_hash, name, avatar_url, created_at, last_login_at)

-- Sessions  
chat_sessions (id, user_id, ai_session_id, title, message_count, is_archived, created_at, last_active_at)

-- Messages
messages (id, session_id, role, content, persona, context_type, confidence, model_name, prompt_tokens, completion_tokens, created_at)

-- Events
events (id, session_id, type, payload, created_at)
```

---

## 🛠️ Tech Stack

### Backend
- FastAPI 0.109.0
- SQLAlchemy 2.0.25
- python-jose 3.3.0 (JWT)
- passlib + bcrypt 4.0.1
- PostgreSQL 14

### Frontend
- React 19.2.0
- TypeScript 5.8.3
- Vite 6.3.3
- Zustand 5.0.10
- Axios 1.13.3

---

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_chat
AI_CORE_URL=http://localhost:8000
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
```

---

## 🧪 API Testing

Swagger docs: **http://localhost:3000/docs**

---

**Last Updated**: 2026-01-28
