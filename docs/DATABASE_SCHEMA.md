# Database Schema

PostgreSQL database schema for AI Chat v2.

**Database:** `ai_chat`  
**Port:** `5432`

---

## Table of Contents

- [Entity Relationship Diagram](#entity-relationship-diagram)
- [Tables](#tables)
  - [users](#users)
  - [sessions](#sessions)
  - [messages](#messages)
- [Indexes](#indexes)
- [Migrations](#migrations)

---

## Entity Relationship Diagram

```
┌──────────────────┐
│      users       │
├──────────────────┤
│ id (PK)          │──────┐
│ email            │      │
│ name             │      │
│ hashed_password  │      │
│ is_active        │      │
│ created_at       │      │
│ updated_at       │      │
└──────────────────┘      │
                          │
                          │ 1:N
                          ▼
┌──────────────────┐      │
│    sessions      │      │
├──────────────────┤      │
│ id (PK)          │──────┼──┐
│ title            │      │  │
│ user_id (FK)     │◄─────┘  │
│ created_at       │         │
│ updated_at       │         │
└──────────────────┘         │
                             │
                             │ 1:N
                             ▼
┌──────────────────┐         │
│    messages      │         │
├──────────────────┤         │
│ id (PK)          │         │
│ content          │         │
│ role             │         │
│ model_name       │         │
│ session_id (FK)  │◄────────┘
│ created_at       │
└──────────────────┘
```

---

## Tables

### users

Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | User email address |
| `name` | VARCHAR(255) | NOT NULL | Display name |
| `hashed_password` | VARCHAR(255) | NOT NULL | bcrypt hashed password |
| `is_active` | BOOLEAN | DEFAULT true | Account status |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Account creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update time |

**SQLAlchemy Model:** `backend/app/db/models.py`

```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    sessions = relationship("Session", back_populates="user", cascade="all, delete-orphan")
```

---

### sessions

Stores chat sessions (conversations).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| `title` | VARCHAR(255) | NOT NULL | Session title |
| `user_id` | UUID | FK → users.id, NOT NULL | Owner of the session |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Last update time |

**SQLAlchemy Model:**

```python
class Session(Base):
    __tablename__ = "sessions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    user = relationship("User", back_populates="sessions")
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
```

---

### messages

Stores individual chat messages with AI Core metadata.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| `session_id` | UUID | FK → sessions.id, NOT NULL | Parent session |
| `role` | TEXT | NOT NULL, CHECK IN ('user', 'assistant') | Message sender |
| `content` | TEXT | NOT NULL | Message content |
| `persona` | TEXT | NULLABLE | Legacy persona or persona_used |
| `tone` | TEXT | NULLABLE | v2.0: casual, technical |
| `behavior` | TEXT | NULLABLE | v2.0: normal, cautious |
| `context_type` | TEXT | NULLABLE | Context classification |
| `confidence` | FLOAT | NULLABLE, CHECK 0-1 | Legacy confidence score |
| `signal_strength` | FLOAT | NULLABLE, CHECK 0-1 | v2.1: replaces confidence |
| `context_clarity` | INTEGER | NULLABLE, CHECK IN (0,1) | v2.1: was context clear? |
| `needs_knowledge` | INTEGER | DEFAULT 0, CHECK IN (0,1) | v2.1: needs RAG? |
| `model_name` | TEXT | NULLABLE | AI model used (e.g., 'gpt-4') |
| `prompt_tokens` | INTEGER | NULLABLE | Token usage (prompt) |
| `completion_tokens` | INTEGER | NULLABLE | Token usage (completion) |
| `is_mistake` | INTEGER | DEFAULT 0 | 0=normal, 1=marked as mistake |
| `mistake_note` | TEXT | NULLABLE | Note about the mistake |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Message timestamp |

**AI Core Version Support:**
- v1.x: `persona`, `confidence`
- v2.0: `tone`, `behavior` (replaces single persona)
- v2.1: `signal_strength`, `context_clarity`, `needs_knowledge`

**SQLAlchemy Model:**

```python
class Message(Base):
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    role = Column(Text, CheckConstraint("role IN ('user', 'assistant')"), nullable=False)
    content = Column(Text, nullable=False)
    
    # AI Metadata
    persona = Column(Text, nullable=True)  # Legacy or persona_used
    tone = Column(Text, nullable=True)  # v2.0
    behavior = Column(Text, nullable=True)  # v2.0
    context_type = Column(Text, nullable=True)
    confidence = Column(Float, nullable=True)  # Legacy
    signal_strength = Column(Float, nullable=True)  # v2.1
    context_clarity = Column(Integer, nullable=True)  # v2.1: 0=false, 1=true
    needs_knowledge = Column(Integer, default=0)  # v2.1: 0=false, 1=true
    
    model_name = Column(Text, nullable=True)
    prompt_tokens = Column(Integer, nullable=True)
    completion_tokens = Column(Integer, nullable=True)
    is_mistake = Column(Integer, default=0)
    mistake_note = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    
    session = relationship("ChatSession", back_populates="messages")
```

---

## Indexes

| Table | Index Name | Columns | Type |
|-------|------------|---------|------|
| users | `ix_users_email` | email | UNIQUE |
| sessions | `ix_sessions_user_id` | user_id | BTREE |
| messages | `ix_messages_session_id` | session_id | BTREE |

---

## Migrations

Migrations are managed with **Alembic**.

### Migration Files

```
backend/migrations/
├── env.py                 # Migration environment config
├── script.py.mako         # Migration template
└── versions/
    ├── 2026_01_28_2132-a6f3e1c568cf_add_auth_and_session_features.py
    ├── 2026_01_31_1000-b7c4d2e8f9a1_add_is_mistake_column.py
    ├── 2026_02_01_2116-a0c619e00a9e_add_tone_behavior_columns.py
    └── 2026_02_01_2230-c8d5e3f7a2b4_add_signal_strength_columns.py
```

### Common Commands

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply all migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history
```

### Initial Setup

If starting fresh, stamp the current state:

```bash
alembic stamp head
```

---

## Database Connection

Connection is configured in `backend/app/core/config.py`:

```python
DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/ai_chat"
```

Environment variables:
- `POSTGRES_HOST` - Database host (default: localhost)
- `POSTGRES_PORT` - Database port (default: 5432)
- `POSTGRES_USER` - Database user (default: postgres)
- `POSTGRES_PASSWORD` - Database password (default: postgres)
- `POSTGRES_DB` - Database name (default: ai_chat)

---

## Docker PostgreSQL

The database runs in Docker via `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:14
    container_name: ai_chat_postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: ai_chat
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```

Start the database:

```bash
docker-compose up -d postgres
```
