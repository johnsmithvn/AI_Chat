# Conversation Service

FastAPI backend for AI Chat - manages conversations and proxies AI Core.

## Setup

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your database URL and AI Core URL

# Initialize database (auto-creates tables on startup)
# Make sure PostgreSQL is running first
```

## Run

```bash
# Development (with auto-reload)
python main.py

# Production
uvicorn app.main:app --host 0.0.0.0 --port 3000
```

Server runs on `http://localhost:3000`

## API Endpoints

- `GET /` - Health check
- `POST /chat` - Send message
- `GET /chat/history/{session_id}` - Get history
- `POST /session` - Create new session
- `GET /session/{session_id}` - Get session
- `GET /sessions` - List sessions
- `DELETE /session/{session_id}` - Delete session
- `GET /debug/metadata/{message_id}` - Debug AI metadata
- `GET /debug/events/{session_id}` - Debug events

## Environment Variables

See `.env.example` for all available options.

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `AI_CORE_URL` - AI Core service URL (default: http://localhost:8000)

## Architecture

```
FastAPI App
├── api/ (routes)
├── services/ (business logic)
├── db/ (database + models)
├── schemas/ (pydantic)
└── core/ (config + logging)
```

## Testing

```bash
# Health check
curl http://localhost:3000/

# Send message
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

See [../docs/API_REFERENCE.md](../docs/API_REFERENCE.md) for full API documentation.
