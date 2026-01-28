# API Reference

Complete API documentation for AI Chat v2 Backend.

**Base URL:** `http://localhost:3000/api`

---

## Table of Contents

- [Authentication](#authentication)
- [Sessions](#sessions)
- [Chat](#chat)
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

Update session details.

```http
PUT /api/sessions/{session_id}
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
  "success": true,
  "data": {
    "id": "uuid",
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
