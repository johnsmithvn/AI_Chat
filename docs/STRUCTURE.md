# 🏗️ AI CHAT 2 - PROJECT STRUCTURE & ARCHITECTURE

**Version**: 1.0.0  
**Last Updated**: 2026-01-26  
**Purpose**: AI Core testing interface với conversation management

---

## 🎯 TỔNG QUAN KIẾN TRÚC

### Mục tiêu dự án
Xây dựng **backend** + **web frontend** để:
- ✅ Test AI Core thông qua giao diện UI thân thiện
- ✅ Lưu conversation history vào PostgreSQL
- ✅ Quan sát AI metadata (persona, confidence, context)
- ✅ Cung cấp AI LAB để debug và phân tích behavior

### Vai trò từng thành phần

```
┌──────────────────────────────────────────────────────────┐
│                    USER (Browser)                        │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │ HTTP/REST
                     ▼
┌──────────────────────────────────────────────────────────┐
│              WEB FRONTEND (React + Vite)                 │
│  - ChatPage: UI chat với debug panel                    │
│  - API Client: Gọi backend                 │
│  - State: Quản lý session + messages                    │
└────────────────────┬─────────────────────────────────────┘
                     │
                     │ POST /chat
                     │ GET /session
                     ▼
┌──────────────────────────────────────────────────────────┐
│       backend (FastAPI Backend)             │
│  - Proxy AI Core API                                     │
│  - Lưu messages + metadata vào DB                       │
│  - Quản lý sessions                                      │
└────────────────────┬─────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
┌─────────────────┐   ┌─────────────────────┐
│   AI CORE       │   │   PostgreSQL DB     │
│   (External)    │   │   - users           │
│   - /chat       │   │   - chat_sessions   │
│   - /history    │   │   - messages        │
│   Port: 8000    │   │   - events          │
└─────────────────┘   └─────────────────────┘
```

### Nguyên tắc thiết kế
1. **Separation of Concerns**
   - AI Core = não (xử lý AI logic)
   - backend = hệ thần kinh (proxy + persistence)
   - web = giác quan (UI + observation)

2. **Không biết nhau**
   - Web KHÔNG biết AI Core tồn tại
   - Web chỉ nói chuyện với backend
   - AI Core KHÔNG biết về DB

3. **Metadata passthrough**
   - backend KHÔNG sửa AI metadata
   - Chỉ lưu và forward metadata từ AI Core

---

## 📁 CẤU TRÚC THỦ MỤC CHI TIẾT

### Tổng quan project (monorepo)

```
AI_Chat_2/
├── backend/    # Backend FastAPI
├── web/                     # Frontend React
├── docs/                    # Documentation
│   ├── TODO.md
│   ├── STRUCTURE.md         # ← File này
│   ├── API_REFERENCE.md
│   ├── DATABASE_SCHEMA.md
│   └── CODEBASE_GUIDE.md
├── instructions/            # AI Core instructions
└── README.md               # Root documentation
```

---

## 1️⃣ backend (Backend)

### 📁 Folder Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI entry point
│   │
│   ├── api/                    # REST API routes
│   │   ├── __init__.py
│   │   ├── health.py           # Health check endpoints
│   │   ├── chat.py             # Chat endpoints
│   │   ├── session.py          # Session management
│   │   └── debug.py            # Debug endpoints (AI metadata)
│   │
│   ├── services/               # Business logic layer
│   │   ├── __init__.py
│   │   ├── ai_core.py          # AI Core HTTP client
│   │   ├── chat_service.py     # Chat processing logic
│   │   └── session_service.py  # Session management logic
│   │
│   ├── schemas/                # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── chat.py             # ChatRequest, ChatResponse
│   │   ├── session.py          # SessionCreate, SessionResponse
│   │   └── common.py           # Shared schemas (Metadata, Context)
│   │
│   ├── db/                     # Database layer
│   │   ├── __init__.py
│   │   ├── base.py             # SQLAlchemy engine + session
│   │   ├── models.py           # ORM models (User, ChatSession, Message)
│   │   └── crud.py             # CRUD operations
│   │
│   ├── core/                   # Core configuration
│   │   ├── __init__.py
│   │   ├── config.py           # Settings (env vars)
│   │   └── logging.py          # Logging setup
│   │
│   └── middlewares/            # Middleware
│       ├── __init__.py
│       └── request_id.py       # Request ID tracking
│
├── migrations/                 # Alembic migrations
│   ├── versions/
│   └── env.py
│
├── tests/                      # Tests
│   ├── test_api/
│   ├── test_services/
│   └── conftest.py
│
├── .env.example                # Environment template
├── requirements.txt            # Python dependencies
├── alembic.ini                 # Alembic config
└── README.md                   # Backend documentation
```

### 🧠 Component Responsibilities

#### `main.py` - Entry Point
```python
"""
FastAPI application setup
- Create FastAPI app
- Register routers (health, chat, session, debug)
- Setup CORS
- Database initialization on startup
- Graceful shutdown
"""
```

#### `api/` - REST API Layer
**Trách nhiệm**: Nhận HTTP requests, validate input, call services, return response

**Endpoints**:
```
GET  /                          # Root health check
GET  /health                    # Detailed health check

POST /chat                      # Send message
GET  /chat/history/{session_id} # Get chat history

POST /session                   # Create new session
GET  /session/{session_id}      # Get session details
GET  /sessions                  # List user sessions
DELETE /session/{session_id}    # Delete session

GET  /debug/metadata/{msg_id}   # Get raw AI metadata
GET  /debug/events/{session_id} # Get session events
```

#### `services/` - Business Logic Layer
**Trách nhiệm**: Core logic, không phụ thuộc HTTP

##### `ai_core.py` - AI Core Client
```python
"""
Điểm DUY NHẤT gọi AI Core API
- Async HTTP client (httpx)
- POST /chat
- GET /chat/history
- Error handling (timeout, connection error)
- Retry logic
"""

class AICoreClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def send_message(
        self, 
        message: str, 
        ai_session_id: Optional[str]
    ) -> Dict:
        """Call AI Core /chat endpoint"""
        pass
```

##### `chat_service.py` - Chat Processing
```python
"""
Xử lý 1 lượt chat hoàn chỉnh
1. Get or create session
2. Call AI Core
3. Save user message to DB
4. Save assistant response to DB
5. Return response với metadata
"""

class ChatService:
    async def process_message(
        self,
        user_id: str,
        session_id: Optional[str],
        message: str
    ) -> ChatResponse:
        pass
```

##### `session_service.py` - Session Management
```python
"""
Quản lý sessions
- Create new session (tạo cả ai_session_id)
- Get session by ID
- List user sessions
- Delete session + messages
"""
```

#### `schemas/` - Data Validation
**Trách nhiệm**: Pydantic schemas cho validation

```python
# chat.py
class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class MetadataSchema(BaseModel):
    persona: str
    context: ContextSchema
    model: str
    usage: UsageSchema

class ChatResponse(BaseModel):
    session_id: str
    response: str
    metadata: MetadataSchema
```

#### `db/` - Database Layer
**Trách nhiệm**: ORM models, CRUD operations

##### `models.py` - ORM Models
```python
"""
SQLAlchemy ORM models
- User
- ChatSession (mapping 1-1 với ai_session_id)
- Message (lưu AI metadata)
- Event (optional: warnings, refusals)
"""
```

##### `crud.py` - CRUD Operations
```python
"""
Database operations
- create_user()
- create_session()
- add_message()
- get_session_history()
- delete_session()
"""
```

#### `core/` - Configuration
##### `config.py` - Settings
```python
"""
Pydantic Settings từ .env
- DATABASE_URL
- AI_CORE_URL
- LOG_LEVEL
- CORS_ORIGINS
"""

class Settings(BaseSettings):
    database_url: str
    ai_core_url: str = "http://localhost:8000"
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"
```

---

## 2️⃣ WEB FRONTEND (React + Vite)

### 📁 Folder Structure

```
web/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── app/
│   │   ├── App.tsx              # Main app component
│   │   └── router.tsx           # React Router setup
│   │
│   ├── pages/
│   │   └── ChatPage.tsx         # Main chat page (only page for now)
│   │
│   ├── components/
│   │   └── chat/
│   │       ├── SessionHeader.tsx    # Session info + AI status
│   │       ├── ChatWindow.tsx       # Messages + input container
│   │       ├── MessageList.tsx      # Render all messages
│   │       ├── MessageBubble.tsx    # Single message component
│   │       ├── ChatInput.tsx        # Input + send button
│   │       └── DebugPanel.tsx       # AI metadata observer
│   │
│   ├── store/
│   │   └── chat.store.ts        # State management (Zustand/Context)
│   │
│   ├── services/
│   │   └── chat.api.ts          # API client (axios/fetch)
│   │
│   ├── types/
│   │   ├── chat.ts              # Message, ChatState, Metadata types
│   │   └── api.ts               # API request/response types
│   │
│   ├── config/
│   │   └── env.ts               # Environment config
│   │
│   ├── styles/
│   │   └── globals.css          # Global styles
│   │
│   └── main.tsx                 # Entry point
│
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example
└── README.md
```

### 🧠 Component Responsibilities

#### `pages/ChatPage.tsx` - Main Page
```tsx
/**
 * Layout:
 * ┌─────────────────────────────────────┐
 * │ SessionHeader                       │
 * ├──────────────────┬──────────────────┤
 * │ ChatWindow       │ DebugPanel       │
 * │ (70%)            │ (30%)            │
 * └──────────────────┴──────────────────┘
 * 
 * State:
 * - sessionId
 * - messages
 * - loading
 * - error
 */
```

#### `components/chat/SessionHeader.tsx`
```tsx
/**
 * Display:
 * - Session ID (short)
 * - Current Persona (badge with color)
 * - Confidence (%)
 * - Model name
 * - New Session button
 * 
 * Persona colors:
 * - Casual: 🟢 green
 * - Technical: 🔵 blue
 * - Cautious: 🟡 yellow
 */
```

#### `components/chat/MessageBubble.tsx`
```tsx
/**
 * Props:
 * - role: "user" | "assistant"
 * - content: string
 * - persona?: string
 * - confidence?: number
 * 
 * Display:
 * - User: right-aligned, gray background
 * - Assistant: left-aligned, colored by persona
 * - Show persona icon + confidence (small text)
 */
```

#### `components/chat/DebugPanel.tsx` ⭐ CỰC QUAN TRỌNG
```tsx
/**
 * AI Metadata Observer
 * 
 * Sections:
 * 1. Current Message Info
 *    - Persona
 *    - Context type
 *    - Confidence
 * 
 * 2. Persona History (Timeline)
 *    - Show persona switches
 * 
 * 3. Token Usage
 *    - Prompt tokens
 *    - Completion tokens
 * 
 * 4. Warnings/Refusals
 *    - Display if any
 * 
 * Features:
 * - Copy raw metadata JSON
 * - Toggle panel visibility
 */
```

#### `services/chat.api.ts` - API Client
```typescript
/**
 * HTTP client to backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const chatApi = {
  // POST /chat
  sendMessage: async (
    message: string, 
    sessionId?: string
  ): Promise<ChatResponse> => {
    // Implementation
  },
  
  // POST /session
  createSession: async (): Promise<SessionResponse> => {
    // Implementation
  },
  
  // GET /chat/history/{sessionId}
  getHistory: async (sessionId: string): Promise<Message[]> => {
    // Implementation
  },
  
  // DELETE /session/{sessionId}
  deleteSession: async (sessionId: string): Promise<void> => {
    // Implementation
  }
};
```

#### `store/chat.store.ts` - State Management
```typescript
/**
 * Global chat state (Zustand/Context)
 */

interface ChatState {
  sessionId: string | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
  
  // Actions
  sendMessage: (message: string) => Promise<void>;
  createNewSession: () => Promise<void>;
  loadHistory: (sessionId: string) => Promise<void>;
  clearSession: () => Promise<void>;
}
```

---

## 3️⃣ DATABASE SCHEMA CHI TIẾT

### Entity Relationship Diagram

```
┌──────────────┐
│    users     │
│──────────────│
│ id (PK)      │──┐
│ name         │  │
│ created_at   │  │
└──────────────┘  │
                  │ 1:N
                  │
┌─────────────────▼──────┐
│   chat_sessions        │
│────────────────────────│
│ id (PK)                │──┐
│ user_id (FK)           │  │
│ ai_session_id (UNIQUE) │  │
│ title                  │  │
│ created_at             │  │
│ last_active_at         │  │
└────────────────────────┘  │ 1:N
                            │
┌───────────────────────────▼─────┐
│         messages                │
│─────────────────────────────────│
│ id (PK)                         │
│ session_id (FK)                 │
│ role (user/assistant)           │
│ content                         │
│ persona (casual/technical/...)  │
│ context_type                    │
│ confidence (0.0-1.0)            │
│ model_name                      │
│ prompt_tokens                   │
│ completion_tokens               │
│ created_at                      │
└─────────────────────────────────┘

┌───────────────────────────┐
│        events             │
│───────────────────────────│
│ id (PK)                   │
│ session_id (FK)           │
│ type                      │
│ payload (JSONB)           │
│ created_at                │
└───────────────────────────┘
```

### Table Definitions

#### `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**Purpose**: Tối giản, sau này thêm auth

#### `chat_sessions`
```sql
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ai_session_id TEXT UNIQUE NOT NULL,
    title TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_sessions_ai_session ON chat_sessions(ai_session_id);
```

**Purpose**: 
- Mapping 1-1 với AI Core session
- `ai_session_id` = session ID từ AI Core
- `title` = auto-generate từ first message (optional)

#### `messages`
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    
    -- AI Metadata (chỉ có khi role = 'assistant')
    persona TEXT,
    context_type TEXT,
    confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
    
    model_name TEXT,
    prompt_tokens INT,
    completion_tokens INT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_persona ON messages(persona) WHERE role = 'assistant';
CREATE INDEX idx_messages_confidence ON messages(confidence) WHERE role = 'assistant';
```

**Purpose**: TRUNG TÂM DEBUG AI
- Lưu đầy đủ AI metadata
- Query để tìm case AI sai persona
- Thống kê confidence
- Replay conversation

#### `events` (Optional)
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    type TEXT NOT NULL,  -- 'persona_switch', 'warning', 'refusal'
    payload JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_type ON events(type);
```

**Purpose**: Event log cho debugging
- Persona switches
- AI warnings
- Refusals

---

## 4️⃣ API CONTRACT CHI TIẾT

### Frontend → Backend

#### POST `/chat`
**Request**:
```json
{
  "message": "Giải thích async/await trong Python",
  "session_id": "optional-uuid"
}
```

**Response**:
```json
{
  "session_id": "4b8af747-4357-44f3-9473-ebf69a1bf269",
  "response": "Async/await là syntax để viết asynchronous code...",
  "metadata": {
    "persona": "Technical",
    "context": {
      "context_type": "technical_question",
      "confidence": 0.85
    },
    "model": "gpt-3.5-turbo",
    "usage": {
      "prompt_tokens": 120,
      "completion_tokens": 250
    }
  }
}
```

#### POST `/session`
**Response**:
```json
{
  "session_id": "new-uuid",
  "ai_session_id": "ai-session-uuid",
  "created_at": "2026-01-26T10:30:00Z"
}
```

#### GET `/chat/history/{session_id}`
**Response**:
```json
{
  "session_id": "...",
  "messages": [
    {
      "role": "user",
      "content": "Hello",
      "created_at": "..."
    },
    {
      "role": "assistant",
      "content": "Hi there!",
      "persona": "Casual",
      "confidence": 0.7,
      "created_at": "..."
    }
  ]
}
```

### Backend → AI Core

#### POST `http://localhost:8000/chat` (AI Core)
**Request**:
```json
{
  "message": "User message",
  "session_id": "ai-session-id"
}
```

**Response** (từ AI Core):
```json
{
  "response": "AI response",
  "session_id": "ai-session-id",
  "metadata": {
    "persona": "Casual",
    "context": {
      "context_type": "casual_chat",
      "confidence": 0.6,
      "should_refuse": false
    },
    "valid": true,
    "warnings": [],
    "model": "mock",
    "usage": {
      "prompt_tokens": 50,
      "completion_tokens": 100
    }
  }
}
```

👉 **backend chỉ forward metadata, KHÔNG sửa**

---

## 5️⃣ DATA FLOW CHI TIẾT

### Flow 1: Send Message (Happy Path)

```
1. User nhập "Xin chào" trong ChatInput
   ↓
2. ChatInput.onSend() → chatStore.sendMessage("Xin chào")
   ↓
3. chatStore calls chatApi.sendMessage("Xin chào", currentSessionId)
   ↓
4. chatApi → POST http://localhost:3000/chat
   Request: { message: "Xin chào", session_id: "abc-123" }
   ↓
5. backend /chat endpoint:
   - Validate request
   - Call ChatService.process_message()
   ↓
6. ChatService:
   - Get session from DB (hoặc create nếu không có)
   - Call AICoreClient.send_message()
   ↓
7. AICoreClient → POST http://localhost:8000/chat (AI Core)
   Request: { message: "Xin chào", session_id: "ai-session-id" }
   ↓
8. AI Core xử lý:
   - Context analysis
   - Persona selection
   - Generate response
   Return: { response: "Chào bạn!", metadata: {...} }
   ↓
9. ChatService:
   - Save user message to DB
   - Save assistant response + metadata to DB
   - Return response
   ↓
10. backend trả response về frontend
    ↓
11. chatStore update messages state
    ↓
12. UI re-render:
    - MessageList shows new messages
    - SessionHeader updates persona/confidence
    - DebugPanel updates metadata
```

### Flow 2: Create New Session

```
1. User click "New Session" button
   ↓
2. SessionHeader.onNewSession() → chatStore.createNewSession()
   ↓
3. chatStore calls chatApi.createSession()
   ↓
4. chatApi → POST http://localhost:3000/session
   ↓
5. backend:
   - Create new chat_session record
   - Generate ai_session_id (UUID)
   - Return session info
   ↓
6. chatStore:
   - Clear messages
   - Set new sessionId
   ↓
7. UI reset
```

### Flow 3: Load History

```
1. User opens page with sessionId in URL
   ↓
2. ChatPage.useEffect() → chatStore.loadHistory(sessionId)
   ↓
3. chatStore calls chatApi.getHistory(sessionId)
   ↓
4. chatApi → GET http://localhost:3000/chat/history/{sessionId}
   ↓
5. backend:
   - Query messages từ DB WHERE session_id = ?
   - Return messages với metadata
   ↓
6. chatStore update messages state
   ↓
7. UI render history
```

---

## 6️⃣ ERROR HANDLING

### Frontend Errors

```typescript
try {
  await chatApi.sendMessage(message);
} catch (error) {
  if (error.response?.status === 503) {
    // AI Core offline
    showError("AI Core is not responding. Please try again.");
  } else if (error.response?.status === 404) {
    // Session not found
    showError("Session not found. Creating new session...");
    await chatStore.createNewSession();
  } else {
    // Generic error
    showError("An error occurred. Please try again.");
  }
}
```

### Backend Errors

```python
# AI Core offline
try:
    response = await ai_core_client.send_message(...)
except httpx.TimeoutException:
    raise HTTPException(
        status_code=503,
        detail="AI Core timeout"
    )
except httpx.ConnectError:
    raise HTTPException(
        status_code=503,
        detail="Cannot connect to AI Core"
    )

# Database error
except SQLAlchemyError as e:
    logger.error(f"Database error: {e}")
    raise HTTPException(
        status_code=500,
        detail="Database error"
    )
```

---

## 7️⃣ ENVIRONMENT VARIABLES

### backend `.env`

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ai_chat

# AI Core
AI_CORE_URL=http://localhost:8000

# Server
PORT=3000
HOST=0.0.0.0

# CORS
CORS_ORIGINS=http://localhost:5173

# Logging
LOG_LEVEL=INFO

# Optional: Default user
DEFAULT_USER_ID=00000000-0000-0000-0000-000000000001
```

### web `.env`

```bash
# API
VITE_API_BASE_URL=http://localhost:3000
```

---

## 8️⃣ DEPENDENCIES

### backend `requirements.txt`

```txt
# FastAPI
fastapi==0.109.0
uvicorn==0.27.0
pydantic==2.5.3
pydantic-settings==2.1.0

# Database
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
alembic==1.13.1

# HTTP Client
httpx==0.26.0

# Logging
structlog==24.1.0

# Utils
python-multipart==0.0.6
python-dotenv==1.0.0
```

### web `package.json`

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "axios": "^1.6.5",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11"
  }
}
```

---

## 9️⃣ DEPLOYMENT CONSIDERATIONS

### Production Checklist

#### Backend
- ✅ Environment variables từ secrets
- ✅ Database migrations trước khi deploy
- ✅ CORS origins restrictive
- ✅ Add rate limiting
- ✅ Add authentication
- ✅ Database connection pooling
- ✅ Logging to file + monitoring service

#### Frontend
- ✅ Build production bundle
- ✅ API URL từ env
- ✅ Error boundaries
- ✅ Loading states
- ✅ Optimize bundle size

#### Database
- ✅ Regular backups
- ✅ Indexes on frequent queries
- ✅ Cleanup old sessions/messages
- ✅ Connection pooling

---

## 🎯 NEXT STEPS

1. ✅ Finish TODO.md
2. ✅ Finish STRUCTURE.md
3. ⏳ Start backend implementation
   - Setup project structure
   - Implement DB models
   - Implement API endpoints
4. ⏳ Start frontend implementation
   - Setup Vite + React
   - Implement components
   - Connect to backend
5. ⏳ Integration testing
6. ⏳ Documentation

---

**Status**: 🏗️ Architecture Design Complete  
**Ready for**: Implementation Phase  
**Last Updated**: 2026-01-26
