# 📚 CODEBASE GUIDE - AI Chat 2

Hướng dẫn toàn bộ codebase + data flow + extend code.

---

## 📂 PROJECT STRUCTURE

```
AI_Chat_2/
├── backend/                   # Backend (FastAPI)
│   ├── app/
│   │   ├── core/              # Core configuration
│   │   │   ├── config.py      # Settings, env vars
│   │   │   └── logging.py     # Structured logging
│   │   ├── db/                # Database layer
│   │   │   ├── base.py        # Engine, SessionLocal, init_db()
│   │   │   ├── models.py      # SQLAlchemy models
│   │   │   └── crud.py        # CRUD operations
│   │   ├── schemas/           # Pydantic schemas
│   │   │   ├── common.py      # MetadataSchema, ContextSchema, UsageSchema
│   │   │   ├── chat.py        # Chat request/response
│   │   │   └── session.py     # Session schemas
│   │   ├── services/          # Business logic
│   │   │   ├── ai_core.py     # AI Core client
│   │   │   ├── chat_service.py    # Chat orchestration
│   │   │   └── session_service.py # Session management
│   │   ├── api/               # API endpoints
│   │   │   ├── health.py      # Health check
│   │   │   ├── chat.py        # Chat endpoints
│   │   │   ├── session.py     # Session CRUD
│   │   │   └── debug.py       # Debug endpoints
│   │   └── middlewares/       # Middlewares
│   │       └── request_id.py  # Request ID tracking
│   ├── main.py                # App entry point
│   ├── requirements.txt       # Dependencies
│   └── .env                   # Environment variables
├── web/                       # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── types/             # TypeScript types
│   │   │   ├── chat.ts        # Message, Context, Usage, etc.
│   │   │   └── api.ts         # API request/response
│   │   ├── services/          # API client
│   │   │   └── chat.api.ts    # Axios client
│   │   ├── store/             # State management
│   │   │   └── chat.store.ts  # Zustand store
│   │   ├── components/        # React components
│   │   │   └── chat/
│   │   │       ├── SessionHeader.tsx  # Session info + persona
│   │   │       ├── MessageBubble.tsx  # Single message
│   │   │       ├── MessageList.tsx    # Message list + scroll
│   │   │       ├── ChatInput.tsx      # Input box
│   │   │       ├── DebugPanel.tsx     # AI metadata observer
│   │   │       └── ChatWindow.tsx     # MessageList + ChatInput
│   │   └── pages/
│   │       └── ChatPage.tsx   # Main page layout
│   ├── package.json           # Dependencies
│   └── .env                   # Environment variables
└── docs/                      # Documentation
    ├── TODO.md                # Task tracking
    ├── STRUCTURE.md           # Architecture design
    ├── API_REFERENCE.md       # API documentation
    ├── DATABASE_SCHEMA.md     # Database schema
    └── CODEBASE_GUIDE.md      # This file
```

---

## 🏗️ ARCHITECTURE LAYERS

```
┌─────────────────────────────────────┐
│          WEB (React)                │
│  - Components (UI)                  │
│  - Store (State)                    │
│  - API Client (HTTP)                │
└──────────────┬──────────────────────┘
               │ REST API
┌──────────────▼──────────────────────┐
│      BACKEND (FastAPI)              │
│  ┌───────────────────────────────┐  │
│  │  API Layer                    │  │  - Routing
│  └──────────┬────────────────────┘  │  - Validation
│  ┌──────────▼────────────────────┐  │
│  │  Services Layer               │  │  - Business logic
│  │  - chat_service.py            │  │  - Orchestration
│  │  - session_service.py         │  │
│  │  - ai_core.py (client)        │  │
│  └──────┬─────────────────┬──────┘  │
│         │                 │         │
│  ┌──────▼──────┐   ┌──────▼──────┐  │
│  │  Database   │   │  AI Core    │  │  - Data persistence
│  │  (CRUD)     │   │  (HTTP)     │  │  - AI integration
│  └─────────────┘   └─────────────┘  │
└─────────────────────────────────────┘
```

### Separation of Concerns

1. **Web (Presentation)**:
   - User interaction
   - State management
   - UI rendering

2. **API (Interface)**:
   - Request validation
   - Response formatting
   - Error handling

3. **Services (Business Logic)**:
   - Chat orchestration
   - AI Core communication
   - Session management

4. **DB (Data Access)**:
   - CRUD operations
   - Query optimization
   - Model definitions

---

## 🔄 DATA FLOW

### Chat Message Flow

```
User input
    │
    ▼
┌─────────────────┐
│  ChatInput.tsx  │
└────────┬────────┘
         │ dispatch sendMessage()
┌────────▼────────┐
│ chat.store.ts   │ (Zustand)
└────────┬────────┘
         │ call chatApi.sendMessage()
┌────────▼────────┐
│ chat.api.ts     │ (Axios)
└────────┬────────┘
         │ POST /chat
┌────────▼────────┐
│ api/chat.py     │ (FastAPI)
└────────┬────────┘
         │ call chat_service.process_message()
┌────────▼────────┐
│chat_service.py  │
└─┬──────────────┬┘
  │              │
  │ save to DB   │ call AI Core
  │              │
┌─▼──────┐  ┌───▼─────────┐
│ crud.py│  │ ai_core.py  │
└────────┘  └─────────────┘
     │              │
     │              │ HTTP POST
     │              │
     ▼              ▼
[Database]    [AI Core API]
     │              │
     │ AI response  │
     ◄──────────────┘
     │
     │ save response
     │
     ▼
[Database]
     │
     └───────────► Return to API
                        │
                        ▼
                   ChatResponse
                        │
                        ▼
                  chat.store.ts
                        │
                        ▼
                  MessageList.tsx
                        │
                        ▼
                    USER sees
```

---

## 📦 KEY COMPONENTS

### Backend Components

#### 1. **config.py** - Configuration Management

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    AI_CORE_URL: str
    PORT: int = 8000
    # ...
```

**Responsibility**:
- Load environment variables
- Validate configuration
- Provide default values

**Used by**: All modules

---

#### 2. **models.py** - Database Models

```python
class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    ai_session_id = Column(String, unique=True, nullable=False)
    # ...
```

**Responsibility**:
- Define database schema
- Relationships between tables
- Constraints and validation

**Used by**: crud.py, chat_service.py

---

#### 3. **crud.py** - Database Operations

```python
def create_message(db: Session, session_id: str, message: MessageCreate) -> Message:
    # ...

def get_session_messages(db: Session, session_id: str) -> List[Message]:
    # ...
```

**Responsibility**:
- Database queries
- Transaction management
- Data transformation (ORM ↔ Python)

**Used by**: chat_service.py, session_service.py

---

#### 4. **ai_core.py** - AI Core Client

```python
class AICoreClient:
    async def send_message(self, request: ChatRequest) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat",
                json=request.dict(),
                timeout=self.timeout
            )
            return response.json()
```

**Responsibility**:
- Single point of contact với AI Core
- Error handling (timeout, connection, HTTP errors)
- Request/response logging

**Used by**: chat_service.py

---

#### 5. **chat_service.py** - Chat Orchestration

```python
class ChatService:
    async def process_message(self, user_id: str, request: ChatRequest, db: Session):
        # 1. Get/create session
        # 2. Call AI Core
        # 3. Save user message
        # 4. Save AI response
        # 5. Update session
        # 6. Return response
```

**Responsibility**:
- Orchestrate chat flow
- Coordinate between DB and AI Core
- Business logic (session management, message storage)

**Used by**: api/chat.py

---

#### 6. **api/chat.py** - Chat Endpoints

```python
@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Session = Depends(get_db)):
    return await chat_service.process_message(user_id, request, db)
```

**Responsibility**:
- HTTP routing
- Request validation
- Response formatting
- Dependency injection (database session)

**Used by**: FastAPI app

---

### Frontend Components

#### 1. **chat.store.ts** - State Management

```typescript
interface ChatState {
  sessionId: string | null;
  messages: Message[];
  loading: boolean;
  currentMetadata: Metadata | null;
  sendMessage: (content: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  // ...
}));
```

**Responsibility**:
- Global state (session, messages, metadata)
- Actions (sendMessage, createNewSession, loadHistory)
- Optimistic updates

**Used by**: All React components

---

#### 2. **chat.api.ts** - API Client

```typescript
export const chatApi = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await axios.post(`${API_BASE_URL}/chat`, request);
    return response.data;
  },
  // ...
};
```

**Responsibility**:
- HTTP requests với conversation-service
- Error handling
- Response typing

**Used by**: chat.store.ts

---

#### 3. **ChatPage.tsx** - Main Layout

```tsx
export function ChatPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <SessionHeader />
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ flex: 2 }}>
          <ChatWindow />
        </div>
        <div style={{ flex: 1 }}>
          <DebugPanel />
        </div>
      </div>
    </div>
  );
}
```

**Responsibility**:
- Page layout (SessionHeader | ChatWindow | DebugPanel)
- Error notification
- Component orchestration

**Used by**: App.tsx

---

#### 4. **DebugPanel.tsx** - AI Metadata Observer

```tsx
export function DebugPanel() {
  const { currentMetadata } = useChatStore();
  
  return (
    <div>
      <h3>AI Metadata</h3>
      <div>Persona: {currentMetadata?.persona}</div>
      <div>Confidence: {currentMetadata?.confidence * 100}%</div>
      {/* Persona distribution, token usage, warnings */}
    </div>
  );
}
```

**Responsibility**:
- Display AI metadata
- Persona distribution histogram
- Token usage stats
- Warning display
- Copy raw JSON

**Used by**: ChatPage.tsx

---

## 🔧 EXTENDING THE CODEBASE

### Add New API Endpoint

**Example**: Add user profile endpoint

1. **Create schema** (`app/schemas/user.py`):
```python
class UserProfileResponse(BaseModel):
    id: str
    name: str
    total_sessions: int
    total_messages: int
```

2. **Create service** (`app/services/user_service.py`):
```python
class UserService:
    def get_profile(self, user_id: str, db: Session) -> UserProfileResponse:
        user = crud.get_user(db, user_id)
        sessions = crud.get_user_sessions(db, user_id)
        messages = crud.get_user_messages(db, user_id)
        return UserProfileResponse(
            id=user.id,
            name=user.name,
            total_sessions=len(sessions),
            total_messages=len(messages)
        )
```

3. **Create endpoint** (`app/api/user.py`):
```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/user/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(user_id: str, db: Session = Depends(get_db)):
    return user_service.get_profile(user_id, db)
```

4. **Register router** (`app/main.py`):
```python
from app.api import user

app.include_router(user.router)
```

---

### Add New UI Component

**Example**: Add session title editor

1. **Create component** (`web/src/components/chat/SessionTitleEditor.tsx`):
```tsx
interface Props {
  sessionId: string;
  currentTitle: string;
  onSave: (title: string) => void;
}

export function SessionTitleEditor({ sessionId, currentTitle, onSave }: Props) {
  const [title, setTitle] = useState(currentTitle);
  
  const handleSave = () => {
    onSave(title);
  };
  
  return (
    <div>
      <input value={title} onChange={(e) => setTitle(e.target.value)} />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

2. **Add API call** (`web/src/services/chat.api.ts`):
```typescript
updateSessionTitle: async (sessionId: string, title: string): Promise<void> => {
  await axios.patch(`${API_BASE_URL}/session/${sessionId}`, { title });
}
```

3. **Add store action** (`web/src/store/chat.store.ts`):
```typescript
updateSessionTitle: async (title: string) => {
  const { sessionId } = get();
  if (!sessionId) return;
  
  await chatApi.updateSessionTitle(sessionId, title);
  // Update local state if needed
}
```

4. **Use in page** (`web/src/pages/ChatPage.tsx`):
```tsx
import { SessionTitleEditor } from '../components/chat/SessionTitleEditor';

// Inside ChatPage:
<SessionTitleEditor 
  sessionId={sessionId} 
  currentTitle={currentTitle}
  onSave={updateSessionTitle}
/>
```

---

### Add New AI Metadata Field

**Example**: Track AI response time

1. **Update AI Core response** (if not already included):
```json
{
  "message": "...",
  "metadata": {
    "response_time_ms": 1250
  }
}
```

2. **Update schema** (`app/schemas/common.py`):
```python
class MetadataSchema(BaseModel):
    persona: str
    context: ContextSchema
    confidence: float
    usage: UsageSchema
    model: str
    response_time_ms: int  # NEW
    warnings: Optional[List[str]] = []
```

3. **Update database model** (`app/db/models.py`):
```python
class Message(Base):
    # ... existing fields
    response_time_ms = Column(Integer, nullable=True)  # NEW
```

4. **Create migration**:
```bash
cd conversation-service
alembic revision --autogenerate -m "Add response_time_ms to messages"
alembic upgrade head
```

5. **Update CRUD** (`app/db/crud.py`):
```python
def create_message(db: Session, session_id: str, message: MessageCreate) -> Message:
    db_message = Message(
        # ... existing fields
        response_time_ms=message.metadata.response_time_ms if message.metadata else None,
    )
```

6. **Update frontend types** (`web/src/types/chat.ts`):
```typescript
export interface Metadata {
  // ... existing fields
  response_time_ms?: number;  // NEW
}
```

7. **Display in DebugPanel** (`web/src/components/chat/DebugPanel.tsx`):
```tsx
{metadata?.response_time_ms && (
  <div>
    <strong>Response Time:</strong> {metadata.response_time_ms}ms
  </div>
)}
```

---

## 🧪 TESTING GUIDE

### Backend Testing

#### 1. Manual API Testing

```bash
# Health check
curl http://localhost:3000/health

# Create session
curl -X POST http://localhost:8000/session \
  -H "Content-Type: application/json" \
  -d '{"user_id": "default-user"}'

# Send chat
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello AI",
    "session_id": "session-uuid",
    "user_id": "default-user"
  }'
```

#### 2. Database Testing

```bash
# Enter PostgreSQL
psql -U postgres -d ai_chat

# Check tables
\dt

# Check data
SELECT * FROM chat_sessions LIMIT 5;
SELECT * FROM messages LIMIT 5;

# Check persona distribution
SELECT persona, COUNT(*) 
FROM messages 
WHERE role = 'assistant' 
GROUP BY persona;
```

#### 3. AI Core Integration Testing

```bash
# Check AI Core health
curl http://localhost:5000/

# Test AI Core directly
curl -X POST http://localhost:5000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test",
    "session_id": "test-session",
    "user_id": "test-user"
  }'
```

---

### Frontend Testing

#### 1. Component Testing

Open browser DevTools → Console

```javascript
// Check store state
useChatStore.getState()

// Check current session
useChatStore.getState().sessionId

// Check messages
useChatStore.getState().messages
```

#### 2. API Testing

```javascript
// Test API client
import { chatApi } from './services/chat.api';

// Create session
chatApi.createSession('default-user').then(console.log);

// Send message
chatApi.sendMessage({
  message: 'Test',
  session_id: 'session-uuid',
  user_id: 'default-user'
}).then(console.log);
```

---

## 🚨 COMMON ISSUES

### Backend Issues

#### Database Connection Error

```
sqlalchemy.exc.OperationalError: could not connect to server
```

**Fix**:
1. Check PostgreSQL is running: `pg_ctl status`
2. Check DATABASE_URL in .env
3. Check database exists: `psql -U postgres -c "\l"`

---

#### AI Core Timeout

```
httpx.ReadTimeout: timed out
```

**Fix**:
1. Check AI Core is running: `curl http://localhost:5000/`
2. Increase timeout in config.py: `AI_CORE_TIMEOUT = 60`
3. Check AI Core logs

---

### Frontend Issues

#### Cannot connect to backend

```
Error: Network Error
```

**Fix**:
1. Check backend is running: `curl http://localhost:8000/health`
2. Check VITE_API_BASE_URL in .env
3. Check CORS settings in backend

---

#### State not updating

**Fix**:
1. Check Zustand store actions are called
2. Check API response format matches types
3. Use React DevTools to inspect state

---

## 📚 BEST PRACTICES

### Backend

1. **Always use dependency injection**:
```python
@router.get("/")
async def endpoint(db: Session = Depends(get_db)):
    # Use db here
```

2. **Always log errors**:
```python
try:
    result = await ai_core.send_message(request)
except Exception as e:
    logger.error("ai_core_error", error=str(e))
    raise
```

3. **Always validate input**:
```python
class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=5000)
```

### Frontend

1. **Always type props**:
```tsx
interface Props {
  sessionId: string;
  onSave: (title: string) => void;
}
```

2. **Always handle loading/error states**:
```tsx
{loading && <div>Loading...</div>}
{error && <div>Error: {error}</div>}
{!loading && !error && <MessageList />}
```

3. **Always cleanup effects**:
```tsx
useEffect(() => {
  const interval = setInterval(() => {}, 1000);
  return () => clearInterval(interval);
}, []);
```

---

## 🎯 NEXT STEPS

### Immediate

1. Run backend: `cd conversation-service && python main.py`
2. Run frontend: `cd web && npm run dev`
3. Test chat flow
4. Check DebugPanel for AI metadata

### Short-term

1. Add authentication (JWT)
2. Add session title auto-generation
3. Add message search
4. Add export conversation

### Long-term

1. Add user preferences
2. Add conversation analytics
3. Add AI behavior dashboard
4. Add A/B testing framework

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-26
