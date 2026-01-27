# 📡 API REFERENCE - Backend

**Base URL**: `http://localhost:3000`  
**Format**: JSON  
**Version**: 1.0.0

---

## 📋 ENDPOINTS OVERVIEW

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/health` | Detailed health |
| POST | `/chat` | Send message |
| GET | `/chat/history/{session_id}` | Get history |
| POST | `/session` | Create session |
| GET | `/session/{session_id}` | Get session |
| GET | `/sessions` | List sessions |
| DELETE | `/session/{session_id}` | Delete session |
| GET | `/debug/metadata/{message_id}` | Get raw metadata |
| GET | `/debug/events/{session_id}` | Get events |

---

## 1. GET `/` - Health Check

Simple health check.

### Response

```json
{
  "status": "ok",
  "timestamp": "2026-01-26T10:00:00Z",
  "service": "backend"
}
```

### Example

```bash
curl http://localhost:3000/
```

---

## 2. POST `/chat` - Send Message

Gửi tin nhắn và nhận phản hồi từ AI Core.

### Request

```json
{
  "message": "Explain async/await in Python",
  "session_id": "optional-uuid"
}
```

**Fields**:
- `message` (string, required): User message
- `session_id` (string, optional): Session ID. Nếu null → tạo session mới

### Response

```json
{
  "session_id": "4b8af747-4357-44f3-9473-ebf69a1bf269",
  "response": "Async/await là syntax để viết asynchronous code...",
  "metadata": {
    "persona": "Technical",
    "context": {
      "context_type": "technical_question",
      "confidence": 0.85,
      "should_refuse": false
    },
    "model": "gpt-3.5-turbo",
    "usage": {
      "prompt_tokens": 120,
      "completion_tokens": 250
    },
    "valid": true,
    "warnings": []
  }
}
```

### Examples

**curl**:
```bash
# First message (creates new session)
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello AI!"}'

# Subsequent message (use session_id from previous response)
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me more", "session_id": "4b8af747-4357-44f3-9473-ebf69a1bf269"}'
```

**JavaScript**:
```javascript
const response = await fetch('http://localhost:3000/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello AI!' })
});

const data = await response.json();
console.log('AI:', data.response);
console.log('Persona:', data.metadata.persona);
```

**Python**:
```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        'http://localhost:3000/chat',
        json={'message': 'Hello AI!'}
    )
    data = response.json()
    print(f"AI: {data['response']}")
    print(f"Persona: {data['metadata']['persona']}")
```

### Status Codes

- `200` - Success
- `404` - Session not found
- `500` - Internal error
- `503` - AI Core unavailable

---

## 3. GET `/chat/history/{session_id}` - Get History

Lấy conversation history của session.

### Parameters

- `session_id` (path, required): UUID của session

### Response

```json
{
  "session_id": "4b8af747-4357-44f3-9473-ebf69a1bf269",
  "messages": [
    {
      "id": "msg-uuid-1",
      "session_id": "4b8af747-4357-44f3-9473-ebf69a1bf269",
      "role": "user",
      "content": "Hello AI!",
      "created_at": "2026-01-26T10:00:00Z"
    },
    {
      "id": "msg-uuid-2",
      "session_id": "4b8af747-4357-44f3-9473-ebf69a1bf269",
      "role": "assistant",
      "content": "Hi there!",
      "persona": "Casual",
      "context_type": "casual_chat",
      "confidence": 0.7,
      "model_name": "gpt-3.5-turbo",
      "prompt_tokens": 50,
      "completion_tokens": 20,
      "created_at": "2026-01-26T10:00:01Z"
    }
  ]
}
```

### Examples

```bash
curl http://localhost:3000/chat/history/4b8af747-4357-44f3-9473-ebf69a1bf269
```

### Status Codes

- `200` - Success
- `404` - Session not found

---

## 4. POST `/session` - Create Session

Tạo session mới.

### Response

```json
{
  "id": "new-session-uuid",
  "user_id": "default-user-uuid",
  "ai_session_id": "ai-session-uuid",
  "title": null,
  "created_at": "2026-01-26T10:00:00Z",
  "last_active_at": "2026-01-26T10:00:00Z"
}
```

### Examples

```bash
curl -X POST http://localhost:3000/session
```

---

## 5. GET `/session/{session_id}` - Get Session

Lấy thông tin session.

### Response

```json
{
  "id": "session-uuid",
  "user_id": "user-uuid",
  "ai_session_id": "ai-session-uuid",
  "title": "Chat about Python",
  "created_at": "2026-01-26T10:00:00Z",
  "last_active_at": "2026-01-26T10:30:00Z"
}
```

### Examples

```bash
curl http://localhost:3000/session/session-uuid
```

---

## 6. GET `/sessions` - List Sessions

Lấy danh sách sessions của user.

### Query Parameters

- `limit` (int, optional): Max số sessions. Default: 20

### Response

```json
{
  "sessions": [
    {
      "id": "session-uuid-1",
      "user_id": "user-uuid",
      "ai_session_id": "ai-session-uuid-1",
      "title": null,
      "created_at": "2026-01-26T10:00:00Z",
      "last_active_at": "2026-01-26T10:30:00Z"
    }
  ]
}
```

### Examples

```bash
# Default (20 sessions)
curl http://localhost:3000/sessions

# Custom limit
curl http://localhost:3000/sessions?limit=10
```

---

## 7. DELETE `/session/{session_id}` - Delete Session

Xóa session và tất cả messages.

### Response

```json
{
  "status": "deleted",
  "session_id": "session-uuid"
}
```

### Examples

```bash
curl -X DELETE http://localhost:3000/session/session-uuid
```

---

## 8. GET `/debug/metadata/{message_id}` - Debug Metadata

Lấy raw metadata của message (để debug AI).

### Response

```json
{
  "id": "message-uuid",
  "session_id": "session-uuid",
  "role": "assistant",
  "content": "AI response...",
  "metadata": {
    "persona": "Technical",
    "context_type": "technical_question",
    "confidence": 0.85,
    "model_name": "gpt-3.5-turbo",
    "prompt_tokens": 120,
    "completion_tokens": 250
  },
  "created_at": "2026-01-26T10:00:01Z"
}
```

### Examples

```bash
curl http://localhost:3000/debug/metadata/message-uuid
```

---

## 9. GET `/debug/events/{session_id}` - Debug Events

Lấy events của session (persona switches, warnings).

### Response

```json
{
  "session_id": "session-uuid",
  "events": [
    {
      "id": "event-uuid",
      "type": "persona_switch",
      "payload": {
        "from": "Casual",
        "to": "Technical"
      },
      "created_at": "2026-01-26T10:00:01Z"
    }
  ]
}
```

### Examples

```bash
curl http://localhost:3000/debug/events/session-uuid
```

---

## ⚠️ ERROR RESPONSES

Tất cả errors theo format:

```json
{
  "detail": "Error message here"
}
```

### Common Errors

#### 404 - Not Found

```json
{
  "detail": "Session 4b8af747-4357-44f3-9473-ebf69a1bf269 not found"
}
```

#### 503 - AI Core Unavailable

```json
{
  "detail": "Cannot connect to AI Core - is it running?"
}
```

```json
{
  "detail": "AI Core timeout - please try again"
}
```

#### 500 - Internal Error

```json
{
  "detail": "Internal error: Database connection failed"
}
```

---

## 🔐 AUTHENTICATION

**Hiện tại**: Không có authentication (development mode)

**Production**: Nên thêm:
- JWT tokens
- API key authentication
- Rate limiting
- IP whitelisting

---

## 🧪 TESTING

### Interactive API Docs

FastAPI tự động generate API docs tại:

```
http://localhost:3000/docs
```

### Postman Collection

Import collection từ file `postman_collection.json` (nếu có).

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-26
