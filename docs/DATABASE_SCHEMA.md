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

Stores individual chat messages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| `content` | TEXT | NOT NULL | Message content |
| `role` | VARCHAR(20) | NOT NULL | 'user' or 'assistant' |
| `model_name` | VARCHAR(50) | NULLABLE | AI model used (e.g., 'gpt-4') |
| `session_id` | UUID | FK → sessions.id, NOT NULL | Parent session |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW() | Message timestamp |

**SQLAlchemy Model:**

```python
class Message(Base):
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    model_name = Column(String(50), nullable=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    session = relationship("Session", back_populates="messages")
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
    └── 2026_01_28_2132-a6f3e1c568cf_add_auth_and_session_features.py
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
