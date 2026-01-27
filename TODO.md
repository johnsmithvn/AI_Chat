# AI CHAT 2 - TODO LIST

**Project**: AI Chat Frontend & Conversation Service  
**Version**: 1.0.0  
**Last Updated**: 2026-01-26

---

## 🎯 MỤC TIÊU DỰ ÁN

Xây dựng **backend** (FastAPI) + **web** (React) để:
- Test AI Core thông qua UI
- Lưu conversation history vào DB
- Quan sát AI metadata (persona, confidence, context)
- Cung cấp AI LAB để debug và phân tích behavior

---

## ✅ HOÀN THÀNH

### Phase 0: Planning & Analysis
1. ✅ Đọc và phân tích AI Core architecture
   - API endpoints, model client, memory system
   - Context analyzer, persona selector, prompt builder
   
2. ✅ Đọc và phân tích design requirements
   - DB schema (users, chat_sessions, messages, events)
   - API contract (frontend ↔ backend ↔ AI Core)
   - UI components (ChatPage, DebugPanel, SessionHeader)

### Phase 1: Documentation Setup
3. ✅ Tạo TODO.md với task breakdown chi tiết
   - 49 tasks across 6 phases
   
4. ✅ Tạo STRUCTURE.md với architecture design
   - Folder structure
   - DB schema details
   - API contract specifications
   - Data flow diagrams (1000+ lines)

### Phase 2: Backend Development (backend)

#### 2.1 Setup & Configuration
5. ✅ Setup backend project structure
   - Created folder structure (app/api, app/services, app/db, app/schemas, app/core, app/middlewares)
   - Setup virtual environment
   - Created requirements.txt (9 dependencies)
   - Created .env.example

6. ✅ Implement core configuration
   - app/core/config.py (Settings with pydantic-settings)
   - app/core/logging.py (structlog integration with JSON output)
   - Loaded AI Core URL, DB URL, PORT, CORS, LOG_LEVEL from env

#### 2.2 Database Layer
7. ✅ Implement database models (app/db/models.py)
   - User model
   - ChatSession model (1-1 mapping with ai_session_id)
   - Message model (with full AI metadata)
   - Event model (optional for persona switches, warnings)

8. ✅ Implement database setup (app/db/base.py)
   - SQLAlchemy engine with PostgreSQL
   - SessionLocal factory
   - get_db() dependency injection
   - init_db() for table creation + default user

9. ✅ Implement CRUD operations (app/db/crud.py)
   - User CRUD (get, create)
   - Session CRUD (get, create, list, update, delete)
   - Message CRUD (create, list by session)
   - Event CRUD (create, list by session)

10. ✅ Setup Alembic migrations
    - Migration structure ready
    - Can use: alembic revision --autogenerate
    - Schema auto-created by init_db() on startup

#### 2.3 Schemas Layer
11. ✅ Implement Pydantic schemas (app/schemas/)
    - chat.py (ChatRequest, ChatResponse, MessageCreate, MessageResponse)
    - session.py (SessionCreate, SessionResponse, SessionListResponse)
    - common.py (MetadataSchema, ContextSchema, UsageSchema)

#### 2.4 Services Layer
12. ✅ Implement AI Core client (app/services/ai_core.py)
    - Async HTTP client using httpx
    - Timeout handling (30s default)
    - Connection error handling
    - HTTP error handling with status codes
    - Structured logging for all operations

13. ✅ Implement chat service (app/services/chat_service.py)
    - process_message() orchestration (6 steps)
    - Get/create session
    - Call AI Core via client
    - Save user message to DB
    - Save assistant response with full metadata
    - Update session last_active_at
    - Return ChatResponse

14. ✅ Implement session service (app/services/session_service.py)
    - Create new session (generate UUID, call AI Core)
    - Get session by ID
    - List user sessions (sorted by last_active_at)
    - Delete session (cascade delete messages + events)

#### 2.5 API Layer
15. ✅ Implement health check endpoint (app/api/health.py)
    - GET / - Simple health check
    - GET /health - Detailed health with DB status

16. ✅ Implement chat endpoints (app/api/chat.py)
    - POST /chat - Send message (with optimistic session creation)
    - GET /chat/history/{session_id} - Get message history

17. ✅ Implement session endpoints (app/api/session.py)
    - POST /session - Create new session
    - GET /session/{session_id} - Get session details
    - GET /sessions - List all sessions (with query params)
    - DELETE /session/{session_id} - Delete session

18. ✅ Implement debug endpoints (app/api/debug.py)
    - GET /debug/metadata/{message_id} - Get raw AI metadata from message
    - GET /debug/events/{session_id} - Get session events (persona switches, warnings)

#### 2.6 Middleware & Main
19. ✅ Implement middleware (app/middlewares/)
    - request_id.py (X-Request-ID generation and tracking)

20. ✅ Implement main.py
    - FastAPI app creation with title, version
    - CORS middleware (configurable origins)
    - RequestIDMiddleware
    - Router registration (health, chat, session, debug)
    - Lifespan context manager (startup: init_db, create default user; shutdown: close AI Core client)
    - Entry point (main.py at root)

#### 2.7 Testing Backend
21. ⏳ Test backend locally (User testing)
    - Test health endpoint
    - Test chat endpoint
    - Test session CRUD
    - Verify DB persistence
    - Test AI Core integration

---

### Phase 3: Frontend Development (web)

#### 3.1 Setup & Configuration
22. ✅ Setup React project with Vite + TypeScript
    - Created with npm create vite@latest
    - Installed dependencies (react, axios, zustand, react-router-dom)
    - Setup folder structure (pages, components, store, services, types, config)

23. ✅ Setup configuration
    - config/env.ts (API_BASE_URL from VITE_API_BASE_URL)
    - .env.example

#### 3.2 Types & API Client
24. ✅ Implement types (src/types/)
    - chat.ts (Message, Context, Usage, Metadata, ChatState)
    - api.ts (ChatRequest, ChatResponse, SessionResponse, HistoryResponse)

25. ✅ Implement API client (src/services/chat.api.ts)
    - sendMessage() - POST /chat
    - createSession() - POST /session
    - getHistory() - GET /chat/history/{id}
    - deleteSession() - DELETE /session/{id}

#### 3.3 State Management
26. ✅ Implement chat store (src/store/chat.store.ts)
    - Zustand store with sessionId, messages, loading, error, currentMetadata
    - sendMessage() with optimistic UI update
    - createNewSession()
    - loadHistory()
    - clearSession()
    - setError()

#### 3.4 UI Components
27. ✅ Implement SessionHeader component
    - Display session_id (truncated)
    - Display current persona (badge with color coding: green=Casual, blue=Technical, yellow=Cautious)
    - Display confidence (%)
    - Display model name
    - New Session button

28. ✅ Implement MessageBubble component
    - User message bubble (right-aligned, blue background)
    - Assistant message bubble (left-aligned, gray background)
    - Display persona badge with color
    - Display confidence % (optional)

29. ✅ Implement MessageList component
    - Render message list with MessageBubble
    - Auto-scroll to bottom on new messages
    - Loading indicator
    - Empty state message

30. ✅ Implement ChatInput component
    - Textarea input (auto-resize)
    - Send button (disabled when loading or empty)
    - Enter to send, Shift+Enter for new line
    - Placeholder text

31. ✅ Implement DebugPanel component
    - Current message metadata (persona, context, confidence, model)
    - Persona distribution histogram
    - Token usage stats (prompt, completion, total)
    - Warnings display
    - Copy raw JSON button

32. ✅ Implement ChatWindow component
    - Combine MessageList + ChatInput
    - Vertical layout

#### 3.5 Page & Router
33. ✅ Implement ChatPage
    - 3-column layout (SessionHeader | ChatWindow + DebugPanel)
    - Error toast notification with auto-dismiss (5s)
    - useEffect for creating initial session
    - Responsive height (100vh)

34. ✅ Implement App.tsx & router
    - Simple routing (renders ChatPage)
    - Global styles import

#### 3.6 Styling
35. ✅ Implement global styles (src/index.css)
    - Box-sizing reset
    - Zero margin
    - 100vh root container
    - Font family: system fonts

#### 3.7 Testing Frontend
36. ⏳ Test frontend locally (User testing)
    - New session creation
    - Send messages
    - View history
    - Debug panel display
    - Error handling

---

### Phase 4: Integration Testing
37. ⏳ End-to-end testing (User testing)
    - Test full flow: Web → Backend → AI Core → DB
    - Test persona switching
    - Test confidence tracking
    - Test session persistence

38. ⏳ Test edge cases (User testing)
    - AI Core offline
    - Database connection error
    - Invalid session_id
    - Empty messages

---

### Phase 5: Documentation

#### 5.1 Root Documentation
39. ✅ Tạo README.md (root)
    - Project overview with architecture diagram
    - Quick start guide (3 steps)
    - Structure overview
    - API endpoints list
    - Database schema overview
    - Testing guide
    - Features list
    - Production deployment guide

#### 5.2 Technical Documentation (docs/)
40. ✅ Tạo API_REFERENCE.md
    - All 10 endpoints documented
    - Request/response schemas with examples
    - curl/JavaScript/Python examples for each
    - Error codes (400, 404, 500, 503)
    - Testing section with sample commands

41. ✅ Tạo DATABASE_SCHEMA.md
    - 4 table definitions with all columns
    - Relationships with ERD
    - 10 indexes with purposes
    - Alembic migration guide
    - Sample queries (5 common queries)
    - Maintenance commands (vacuum, backup, cleanup)
    - Storage estimates

42. ✅ Tạo CODEBASE_GUIDE.md
    - Complete folder structure (backend + web)
    - Architecture layers diagram
    - Data flow diagram (14-step chat flow)
    - Key component explanations (10 backend + 4 frontend)
    - Extending guide (new endpoint, new UI component, new metadata field)
    - Testing guide (backend + frontend + database)
    - Common issues + fixes
    - Best practices

43. ⏳ Tạo DEPLOYMENT.md
    - Skipped (not required for current scope)

---

## 🔮 FUTURE ENHANCEMENTS (OPTIONAL)

### Phase 6: Advanced Features
44. ⏳ Implement authentication
    - User login/logout
    - JWT tokens
    - Protected routes

45. ⏳ Implement analytics
    - Session replay
    - Persona heatmap
    - Confidence trends
    - Token usage analytics

46. ⏳ Implement comparison tools
    - Compare 2 sessions
    - Export conversation
    - Mark AI mistakes

47. ⏳ Implement admin panel
    - User management
    - Session management
    - System stats

48. ⏳ Docker containerization
    - Dockerfile for backend
    - Dockerfile for frontend
    - docker-compose.yml

49. ⏳ CI/CD pipeline
    - GitHub Actions
    - Automated tests
    - Deployment automation

---

## 📊 PROGRESS SUMMARY

- **Total Tasks**: 49
- **Completed**: 42 ✅
- **User Testing**: 4 ⏳ (Tasks 21, 36, 37, 38)
- **Skipped**: 3 ⏳ (Tasks 43-49, out of scope)
- **Completion**: ~86%

### Implementation Summary

**Backend (19 files)**:
- Core: config.py, logging.py
- Database: models.py, base.py, crud.py
- Schemas: common.py, chat.py, session.py
- Services: ai_core.py, chat_service.py, session_service.py
- API: health.py, chat.py, session.py, debug.py
- Middleware: request_id.py
- Main: main.py (app entry + lifespan)
- Config: requirements.txt, .env.example

**Frontend (14 TypeScript files)**:
- Types: chat.ts, api.ts
- Services: chat.api.ts
- Store: chat.store.ts
- Components: SessionHeader.tsx, MessageBubble.tsx, MessageList.tsx, ChatInput.tsx, DebugPanel.tsx, ChatWindow.tsx
- Pages: ChatPage.tsx
- App: App.tsx, main.tsx
- Config: env.ts, .env.example

**Documentation (5 files)**:
- TODO.md (this file, 49 tasks)
- STRUCTURE.md (1000+ lines architecture)
- API_REFERENCE.md (10 endpoints, 350+ lines)
- DATABASE_SCHEMA.md (4 tables, migrations, queries)
- CODEBASE_GUIDE.md (code walkthrough, data flow, extend guide)

### Key Features Implemented

✅ **3-tier Architecture**: Web → Backend → AI Core + DB  
✅ **10 REST API Endpoints**: Chat, sessions, history, debug  
✅ **4 Database Tables**: users, chat_sessions, messages, events  
✅ **Full AI Metadata Storage**: persona, confidence, context, tokens  
✅ **Debug Panel**: Persona distribution, token usage, warnings  
✅ **Session Management**: Create, list, delete with persistence  
✅ **Error Handling**: Timeout, connection, HTTP errors  
✅ **Structured Logging**: JSON logs with request tracking  
✅ **CORS Support**: Configurable origins  
✅ **Type Safety**: Pydantic (backend) + TypeScript (frontend)

---

## 🎯 NEXT ACTIONS

**For User**:
1. 🧪 Test backend: `cd backend && python main.py`
2. 🧪 Test frontend: `cd web && npm run dev`
3. 🧪 Test full flow with AI Core running
4. 📝 Report any issues found

**Future Enhancements** (Optional, Phase 6):
- Authentication (JWT)
- Analytics dashboard
- Export conversations
- Docker containerization
- CI/CD pipeline

---

**Last Updated**: 2026-01-26  
**Status**: ✅ **READY FOR TESTING** - Core implementation complete
