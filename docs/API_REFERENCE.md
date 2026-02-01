# API Reference

Complete API documentation for AI Chat v2 Backend.

**Base URL:** `http://localhost:3000/api`

---

## Table of Contents

- [Authentication](#authentication)
- [Sessions](#sessions)
- [Chat](#chat)
- [Analytics](#analytics)
- [Messages](#messages)
- [Health Check](#health-check)
- [Debug](#debug)

---

## Authentication

### Register User

Create a new user account.

```http
POST /api/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your_password",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2025-01-28T10:00:00Z"
  },
  "message": "Registration successful"
}
```

**Errors:**
- `400` - Email already registered
- `422` - Validation error (invalid email format, password too short)

---

### Login

Authenticate user and get access token.

```http
POST /api/auth/login
Content-Type: application/x-www-form-urlencoded
```

**Request Body:**
```
username=user@example.com&password=your_password
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Errors:**
- `401` - Invalid credentials

---

### Get Current User

Get the authenticated user's profile.

```http
GET /api/auth/me
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "created_at": "2025-01-28T10:00:00Z"
  }
}
```

**Errors:**
- `401` - Not authenticated or token expired

---

### Logout

Invalidate the current session.

```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Sessions

### Create Session

Create a new chat session.

```http
POST /api/sessions/
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "My Chat Session"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "My Chat Session",
    "user_id": "uuid",
    "created_at": "2025-01-28T10:00:00Z",
    "updated_at": "2025-01-28T10:00:00Z"
  }
}
```

---

### List Sessions

Get all sessions for the current user.

```http
GET /api/sessions/
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | int | 0 | Number of sessions to skip |
| `limit` | int | 100 | Maximum sessions to return |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Session 1",
      "user_id": "uuid",
      "created_at": "2025-01-28T10:00:00Z",
      "updated_at": "2025-01-28T10:00:00Z"
    }
  ]
}
```

---

### Get Session

Get a specific session by ID.

```http
GET /api/sessions/{session_id}
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Session Title",
    "user_id": "uuid",
    "created_at": "2025-01-28T10:00:00Z",
    "updated_at": "2025-01-28T10:00:00Z"
  }
}
```

**Errors:**
- `404` - Session not found

---

### Update Session

Rename a session (update session title).

```http
PUT /api/session/{session_id}
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Updated Title"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "ai_session_id": "ai_session_xyz",
  "title": "Updated Title",
  "created_at": "2025-01-28T10:00:00Z",
  "last_active_at": "2025-01-28T11:00:00Z"
}
```

**Errors:**
- `403` - Not authorized to update this session
- `404` - Session not found
    "title": "Updated Title",
    "user_id": "uuid",
    "created_at": "2025-01-28T10:00:00Z",
    "updated_at": "2025-01-28T11:00:00Z"
  }
}
```

---

### Delete Session

Delete a session and all its messages.

```http
DELETE /api/sessions/{session_id}
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

---

### Session Replay

Get session replay data with timing information for playback.

```http
GET /api/session/{session_id}/replay
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "session_id": "uuid",
  "title": "Session Title",
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "Hello",
      "persona": null,
      "confidence": null,
      "model_name": null,
      "created_at": "2026-01-31T10:00:00Z",
      "delay_ms": 0
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "Hi! How can I help?",
      "persona": "casual",
      "confidence": 0.95,
      "model_name": "gpt-4",
      "created_at": "2026-01-31T10:00:02Z",
      "delay_ms": 2000
    }
  ],
  "total_duration_ms": 15000,
  "message_count": 10
}
```

**Errors:**
- `403` - Not authorized to access this session
- `404` - Session not found

---

## Analytics

### Get Token Analytics

Get token usage analytics for current user.

```http
GET /api/analytics/tokens
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "overall": {
    "total_prompt_tokens": 5000,
    "total_completion_tokens": 3000,
    "total_tokens": 8000,
    "message_count": 50,
    "avg_tokens_per_message": 160.0
  },
  "by_session": [
    {
      "session_id": "uuid",
      "session_title": "Python Help",
      "prompt_tokens": 1000,
      "completion_tokens": 600,
      "total_tokens": 1600,
      "message_count": 10,
      "created_at": "2026-01-31T10:00:00Z"
    }
  ],
  "by_day": [
    {
      "date": "2026-01-31",
      "prompt_tokens": 2000,
      "completion_tokens": 1200,
      "total_tokens": 3200,
      "message_count": 20
    }
  ]
}
```

---

### Compare Sessions

Compare two sessions side by side.

```http
POST /api/analytics/compare
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "session_id_1": "uuid-1",
  "session_id_2": "uuid-2"
}
```

**Response (200 OK):**
```json
{
  "session_1": {
    "session_id": "uuid-1",
    "title": "Session 1",
    "message_count": 10,
    "total_tokens": 1500,
    "avg_confidence": 0.92,
    "persona_distribution": { "casual": 5, "technical": 3 },
    "model_used": "gpt-4",
    "created_at": "2026-01-30T10:00:00Z",
    "duration_minutes": 15.5
  },
  "session_2": {
    "session_id": "uuid-2",
    "title": "Session 2",
    "message_count": 8,
    "total_tokens": 1200,
    "avg_confidence": 0.88,
    "persona_distribution": { "casual": 6, "cautious": 2 },
    "model_used": "gpt-4",
    "created_at": "2026-01-31T10:00:00Z",
    "duration_minutes": 12.0
  }
}
```

**Errors:**
- `403` - Not authorized to access session
- `404` - Session not found

---

## Messages

### Mark Message as Mistake

Mark or unmark an AI message as a mistake.

```http
PUT /api/message/{message_id}/mistake
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "is_mistake": true,
  "note": "Incorrect information about Python syntax"
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "session_id": "uuid",
  "role": "assistant",
  "content": "...",
  "is_mistake": true,
  "mistake_note": "Incorrect information about Python syntax",
  "created_at": "2026-01-31T10:00:00Z"
}
```

**Errors:**
- `403` - Not authorized to modify this message
- `404` - Message not found

---

### Get User Mistakes

Get all messages marked as mistakes for current user.

```http
GET /api/message/mistakes?limit=50
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "mistakes": [
    {
      "id": "uuid",
      "session_id": "uuid",
      "role": "assistant",
      "content": "...",
      "persona": "technical",
      "confidence": 0.85,
      "is_mistake": true,
      "mistake_note": "Incorrect info",
      "created_at": "2026-01-31T10:00:00Z"
    }
  ],
  "total": 5
}
```

---

## Chat

### Send Message

Send a message to the AI and receive a response.

```http
POST /api/chat/
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "content": "Hello, how are you?",
  "session_id": "uuid",
  "model_name": "gpt-4"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "I'm doing well, thank you for asking! How can I help you today?",
    "role": "assistant",
    "session_id": "uuid",
    "model_name": "gpt-4",
    "created_at": "2025-01-28T10:00:00Z"
  }
}
```

---

### Get Session Messages

Get all messages in a session.

```http
GET /api/chat/history/{session_id}
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `skip` | int | 0 | Number of messages to skip |
| `limit` | int | 100 | Maximum messages to return |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "Hello",
      "role": "user",
      "session_id": "uuid",
      "model_name": "gpt-4",
      "created_at": "2025-01-28T10:00:00Z"
    },
    {
      "id": "uuid",
      "content": "Hi there! How can I help?",
      "role": "assistant",
      "session_id": "uuid",
      "model_name": "gpt-4",
      "created_at": "2025-01-28T10:00:01Z"
    }
  ]
}
```

---

### Delete Message

Delete a specific message.

```http
DELETE /api/chat/{message_id}
Authorization: Bearer <access_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Message deleted successfully"
}
```

---

## Health Check

### Health Status

Check if the API server is running.

```http
GET /api/health
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-28T10:00:00Z"
}
```

---

### Database Health

Check database connectivity.

```http
GET /api/health/db
```

**Response (200 OK):**
```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

## Debug

> ⚠️ **Debug endpoints are for development only**

### Debug Info

Get debug information about the current request.

```http
GET /api/debug
Authorization: Bearer <access_token> (optional)
```

**Response (200 OK):**
```json
{
  "request_id": "uuid",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "timestamp": "2025-01-28T10:00:00Z"
}
```

---

## Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Request body validation failed |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Authentication Header

All protected endpoints require the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

The token is obtained from the `/api/auth/login` endpoint and has a default expiration of 30 minutes.

---

## Rate Limiting

Currently, no rate limiting is implemented. This will be added in a future version.

---

## CORS

CORS is enabled for development:
- Allowed origins: `http://localhost:5173`
- Allowed methods: `GET, POST, PUT, DELETE, OPTIONS`
- Allowed headers: `Authorization, Content-Type`
