# 🗄️ DATABASE SCHEMA - AI Chat 2

**Database**: PostgreSQL 14+  
**ORM**: SQLAlchemy 2.0  
**Version**: 1.0.0

---

## 📊 SCHEMA OVERVIEW

```
users (1) ──────┐
                │ 1:N
                ▼
         chat_sessions (1) ──────┬──────┐
                                 │ 1:N  │ 1:N
                                 ▼      ▼
                            messages  events
```

4 tables:
- `users` - User accounts
- `chat_sessions` - Chat sessions (1-1 mapping với AI Core)
- `messages` - Messages với AI metadata
- `events` - Event log (optional)

---

## 1️⃣ TABLE: `users`

User accounts - tối giản cho giai đoạn này.

### Schema

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | User ID |
| `name` | TEXT | NOT NULL | User name |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Created timestamp |

### Indexes

```sql
-- Primary key index (auto-created)
```

### Notes

- Giai đoạn này dùng 1 default user
- Sau này thêm authentication chỉ cần thêm cột (email, password_hash, etc.)
- KHÔNG đập lại bảng

---

## 2️⃣ TABLE: `chat_sessions`

Chat sessions - mapping 1-1 với AI Core session.

### Schema

```sql
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    ai_session_id TEXT UNIQUE NOT NULL,
    title TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_active_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_sessions_ai_session ON chat_sessions(ai_session_id);
CREATE INDEX idx_sessions_last_active ON chat_sessions(last_active_at DESC);
```

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Session ID (app-level) |
| `user_id` | UUID | FK → users.id | Owner user |
| `ai_session_id` | TEXT | UNIQUE NOT NULL | AI Core session ID |
| `title` | TEXT | NULL | Session title (optional) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Created timestamp |
| `last_active_at` | TIMESTAMP | DEFAULT NOW() | Last activity timestamp |

### Relationships

- **users** (N:1) - Mỗi session thuộc 1 user
- **messages** (1:N) - Mỗi session có nhiều messages
- **events** (1:N) - Mỗi session có nhiều events

### Indexes

```sql
idx_sessions_user            -- Query sessions by user
idx_sessions_ai_session      -- Lookup by AI Core session ID
idx_sessions_last_active     -- Sort by last active
```

### Notes

- `ai_session_id` là session ID từ AI Core (UNIQUE constraint)
- Mapping 1-1: 1 chat_session ↔ 1 AI Core session
- Nếu AI Core reset session → backend tạo chat_session mới
- `title` có thể auto-generate từ first message (future)

---

## 3️⃣ TABLE: `messages`

Messages - TRUNG TÂM DEBUG AI

### Schema

```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
    
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

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Message ID |
| `session_id` | UUID | FK → chat_sessions.id | Parent session |
| `role` | TEXT | CHECK ('user'/'assistant') | Message role |
| `content` | TEXT | NOT NULL | Message content |
| `persona` | TEXT | NULL | AI persona (Casual/Technical/Cautious) |
| `context_type` | TEXT | NULL | Context type (casual_chat, etc.) |
| `confidence` | FLOAT | 0.0-1.0 | Confidence level |
| `model_name` | TEXT | NULL | Model used |
| `prompt_tokens` | INT | NULL | Prompt tokens used |
| `completion_tokens` | INT | NULL | Completion tokens used |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Created timestamp |

### Relationships

- **chat_sessions** (N:1) - Mỗi message thuộc 1 session

### Indexes

```sql
idx_messages_session      -- Query messages by session
idx_messages_created      -- Sort by timestamp
idx_messages_persona      -- Filter by persona (assistant only)
idx_messages_confidence   -- Filter by confidence (assistant only)
```

### Notes

- AI metadata chỉ có trong `role = 'assistant'`
- Dùng để:
  - Tìm case AI chọn sai persona
  - Thống kê confidence thấp
  - Replay conversation
  - Debug AI behavior
- Partial indexes cho persona/confidence để tiết kiệm space

---

## 4️⃣ TABLE: `events` (Optional)

Event log - để debug AI behavior.

### Schema

```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_session ON events(session_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_payload ON events USING GIN(payload);
```

### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Event ID |
| `session_id` | UUID | FK → chat_sessions.id | Parent session |
| `type` | TEXT | NOT NULL | Event type |
| `payload` | JSONB | NULL | Event data |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Created timestamp |

### Event Types

- `persona_switch` - AI đổi persona
- `warning` - AI warning
- `refusal` - AI từ chối trả lời
- `low_confidence` - Confidence < threshold

### Example Payloads

**persona_switch**:
```json
{
  "from": "Casual",
  "to": "Technical",
  "reason": "User asked technical question"
}
```

**warning**:
```json
{
  "warning": "Output exceeded max length",
  "original_length": 1500
}
```

**refusal**:
```json
{
  "reason": "Insufficient context",
  "confidence": 0.2
}
```

### Indexes

```sql
idx_events_session   -- Query events by session
idx_events_type      -- Filter by event type
idx_events_payload   -- JSONB GIN index for payload queries
```

### Notes

- OPTIONAL - không bắt buộc phải dùng
- Cực tốt khi debug AI behavior
- JSONB cho flexibility
- GIN index cho JSONB queries

---

## 🔄 RELATIONSHIPS

```
users
  ├── chat_sessions (CASCADE DELETE)
      ├── messages (CASCADE DELETE)
      └── events (CASCADE DELETE)
```

- Xóa user → xóa tất cả sessions, messages, events
- Xóa session → xóa tất cả messages, events
- CASCADE DELETE đảm bảo data consistency

---

## 📈 INDEXES SUMMARY

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| chat_sessions | idx_sessions_user | BTREE | Query by user |
| chat_sessions | idx_sessions_ai_session | BTREE | Lookup by AI session ID |
| chat_sessions | idx_sessions_last_active | BTREE | Sort by last active |
| messages | idx_messages_session | BTREE | Query by session |
| messages | idx_messages_created | BTREE | Sort by timestamp |
| messages | idx_messages_persona | PARTIAL | Filter by persona |
| messages | idx_messages_confidence | PARTIAL | Filter by confidence |
| events | idx_events_session | BTREE | Query by session |
| events | idx_events_type | BTREE | Filter by type |
| events | idx_events_payload | GIN | JSONB queries |

---

## 🛠️ MIGRATIONS

### Setup Alembic

```bash
cd backend
alembic init migrations
```

### Create Initial Migration

```bash
alembic revision --autogenerate -m "Initial schema"
```

### Apply Migration

```bash
alembic upgrade head
```

### Rollback

```bash
alembic downgrade -1
```

---

## 🧪 SAMPLE QUERIES

### Get user's sessions

```sql
SELECT * FROM chat_sessions
WHERE user_id = 'user-uuid'
ORDER BY last_active_at DESC
LIMIT 20;
```

### Get session history

```sql
SELECT * FROM messages
WHERE session_id = 'session-uuid'
ORDER BY created_at ASC;
```

### Find low confidence responses

```sql
SELECT session_id, content, confidence
FROM messages
WHERE role = 'assistant' AND confidence < 0.5
ORDER BY confidence ASC;
```

### Persona distribution

```sql
SELECT persona, COUNT(*) as count
FROM messages
WHERE role = 'assistant' AND persona IS NOT NULL
GROUP BY persona;
```

### Token usage stats

```sql
SELECT 
  SUM(prompt_tokens) as total_prompt_tokens,
  SUM(completion_tokens) as total_completion_tokens,
  AVG(confidence) as avg_confidence
FROM messages
WHERE role = 'assistant';
```

---

## 🔧 MAINTENANCE

### Vacuum

```bash
psql -U postgres -d ai_chat -c "VACUUM ANALYZE;"
```

### Backup

```bash
pg_dump -U postgres ai_chat > backup.sql
```

### Restore

```bash
psql -U postgres ai_chat < backup.sql
```

### Cleanup old data

```sql
-- Delete sessions older than 30 days
DELETE FROM chat_sessions
WHERE created_at < NOW() - INTERVAL '30 days';

-- CASCADE DELETE will remove messages + events
```

---

## 📊 STORAGE ESTIMATES

Giả sử:
- 1000 users
- 10 sessions/user = 10,000 sessions
- 50 messages/session = 500,000 messages

**Sizes**:
- users: ~1KB × 1000 = **1 MB**
- chat_sessions: ~0.5KB × 10,000 = **5 MB**
- messages: ~1KB × 500,000 = **500 MB**
- events: ~0.5KB × 100,000 = **50 MB**
- Indexes: ~20% overhead = **110 MB**

**Total**: ~**670 MB**

---

**Version**: 1.0.0  
**Last Updated**: 2026-01-26
