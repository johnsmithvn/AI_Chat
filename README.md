# AI Chat 2

**AI Core Testing Interface** - Conversation-service + Web Frontend

Full-stack application để test và quan sát AI Core behavior thông qua giao diện AI LAB.

---

## 🎯 MỤC TIÊU

- ✅ Test AI Core qua UI thân thiện
- ✅ Lưu conversation history vào PostgreSQL
- ✅ Quan sát AI metadata real-time (persona, confidence, context)
- ✅ Debug panel để phân tích AI behavior

---

## 🏗️ KIẾN TRÚC

```
┌──────────────────┐
│   Web (React)    │  Port 5173
│   - ChatPage     │
│   - DebugPanel   │
└────────┬─────────┘
         │ HTTP/REST
         ▼
┌──────────────────┐
│  Backend         │  Port 3000
│  (FastAPI)       │
│ - Proxy AI Core  │
│ - DB Persistence │
└────────┬─────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌─────────┐ ┌──────────┐
│ AI Core │ │PostgreSQL│
│Port 8000│ │  5432    │
└─────────┘ └──────────┘
```

---

## 📁 STRUCTURE

```
AI_Chat_2/
├── backend/                 # Backend (FastAPI)
│   ├── app/
│   │   ├── api/            # REST endpoints
│   │   ├── services/       # Business logic
│   │   ├── db/             # Database models + CRUD
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── core/           # Config + logging
│   │   └── middlewares/    # Request ID middleware
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── web/                     # Frontend (React + TS)
│   ├── src/
│   │   ├── pages/          # ChatPage
│   │   ├── components/     # UI components
│   │   ├── store/          # Zustand state
│   │   ├── services/       # API client
│   │   ├── types/          # TypeScript types
│   │   └── config/         # Environment
│   ├── package.json
│   └── README.md
│
├── docs/                    # Documentation
│   ├── TODO.md             # Task tracking
│   ├── STRUCTURE.md        # Architecture design
│   ├── API_REFERENCE.md    # API docs
│   ├── DATABASE_SCHEMA.md  # DB schema
│   └── CODEBASE_GUIDE.md   # Code guide
│
└── README.md               # ← This file
```

---

## 🚀 QUICK START

### Prerequisites

- Python 3.10+
- Node.js 18+
- Docker & Docker Compose (recommended) **OR** PostgreSQL 14+
- AI Core running on port 8000

### 1. Setup Database

**Option A: Docker (Recommended)** 🐳

```bash
# Start PostgreSQL container
docker-compose up -d

# Check container status
docker ps

# View logs
docker-compose logs postgres

# Stop database
docker-compose down

# Stop and remove data
docker-compose down -v
```

**Option B: Manual PostgreSQL Installation**

```bash
# Create PostgreSQL database
createdb ai_chat

# Or using psql
psql -U postgres
CREATE DATABASE ai_chat;
```

**Database Connection String:**
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_chat
```

### 2. Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env với database URL và AI Core URL

# Run
python main.py
# → http://localhost:3000
```

### 3. Setup Web Frontend

```bash
cd web

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Default: http://localhost:3000

# Run
npm run dev
# → http://localhost:5173
```

### 4. Test

1. Open http://localhost:5173
2. Start chatting!
3. Quan sát Debug Panel để xem AI metadata

---

## 📡 API ENDPOINTS

### Backend API (Port 3000)

```
GET  /                          # Health check
POST /chat                      # Send message
GET  /chat/history/{id}         # Get history
POST /session                   # Create session
GET  /session/{id}              # Get session
GET  /sessions                  # List sessions
DELETE /session/{id}            # Delete session
GET  /debug/metadata/{msg_id}   # Debug metadata
GET  /debug/events/{session_id} # Debug events
```

Xem [docs/API_REFERENCE.md](docs/API_REFERENCE.md) để biết chi tiết.

---

## 🗄️ DATABASE SCHEMA

### Tables

- **users** - User accounts
- **chat_sessions** - Chat sessions (1-1 mapping với AI Core)
- **messages** - Messages với AI metadata
- **events** - Event log (persona switches, warnings)

Xem [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) để biết chi tiết.

---

## 🧪 TESTING

### Test Backend

```bash
# Health check
curl http://localhost:3000/

# Send message
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello AI"}'
```

### Test Frontend

1. Open http://localhost:5173
2. Click "New Session"
3. Send message
4. Check Debug Panel for metadata

---

## 📚 DOCUMENTATION

| File | Description |
|------|-------------|
| [TODO.md](docs/TODO.md) | Task tracking (49 tasks) |
| [STRUCTURE.md](docs/STRUCTURE.md) | Architecture design |
| [API_REFERENCE.md](docs/API_REFERENCE.md) | API documentation |
| [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | DB schema |
| [CODEBASE_GUIDE.md](docs/CODEBASE_GUIDE.md) | Code guide |

---

## 🔧 DEVELOPMENT

### Backend

```bash
cd backend
python main.py  # Auto-reload enabled
```

### Frontend

```bash
cd web
npm run dev  # Hot Module Replacement
```

### Database Migrations

```bash
cd backend

# Init alembic (if not done)
alembic init migrations

# Create migration
alembic revision --autogenerate -m "description"

# Apply migration
alembic upgrade head
```

---

## 🐛 TROUBLESHOOTING

### "Cannot connect to AI Core"

- Đảm bảo AI Core đang chạy: `http://localhost:8000`
- Check `.env` trong backend

### "Database connection failed"

- Đảm bảo PostgreSQL đang chạy
- Check `DATABASE_URL` trong `.env`
- Test connection: `psql -U postgres -d ai_chat`

### Web không kết nối backend

- Đảm bảo backend đang chạy
- Check `VITE_API_BASE_URL` trong web/.env
- Check CORS settings trong backend

---

## 🎨 FEATURES

### Chat Interface
- ✅ Clean UI
- ✅ Real-time messaging
- ✅ Auto-scroll
- ✅ Loading indicators

### Debug Panel ⭐
- ✅ Current persona display
- ✅ Confidence tracking
- ✅ Token usage statistics
- ✅ Persona distribution
- ✅ Warning display
- ✅ Copy metadata JSON

### Session Management
- ✅ Create new sessions
- ✅ Persistent history
- ✅ Session listing
- ✅ Delete sessions

---

## 🚀 PRODUCTION DEPLOYMENT

### Backend

```bash
# Install dependencies
pip install -r requirements.txt

# Run with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:3000
```

### Frontend

```bash
# Build
npm run build

# Serve dist/ với nginx/Apache
```

### Environment Variables

**Backend (.env)**:
```bash
DATABASE_URL=postgresql://user:pass@localhost/ai_chat
AI_CORE_URL=http://localhost:8000
PORT=3000
CORS_ORIGINS=https://yourdomain.com
```

**Frontend (.env)**:
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
```

---

## 📊 PROJECT STATUS

- ✅ **Backend**: Complete (FastAPI + PostgreSQL)
- ✅ **Frontend**: Complete (React + TypeScript)
- ✅ **Documentation**: Complete
- ⏳ **Testing**: Manual testing by user
- ⏳ **Deployment**: Ready for production

---

## 🤝 CONTRIBUTING

1. Read [docs/STRUCTURE.md](docs/STRUCTURE.md) để hiểu architecture
2. Read [docs/CODEBASE_GUIDE.md](docs/CODEBASE_GUIDE.md) để hiểu code
3. Follow existing code style
4. Test trước khi commit

---

## 📝 LICENSE

MIT

---

## 🙏 ACKNOWLEDGMENTS

- **AI Core**: External AI service
- **FastAPI**: Modern Python web framework
- **React**: UI framework
- **Zustand**: State management
- **PostgreSQL**: Database

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: 2026-01-26
