# CHANGELOG

All notable changes to AI Chat 2 project will be documented in this file.

---

## [1.0.3] - 2026-01-31

### Added

#### Frontend
- **ConfirmDialog Component**: Reusable confirmation popup component
  - Supports `default` and `danger` variants
  - Keyboard support (Escape to close)
  - Click outside to dismiss
  - Files: `web/src/components/common/ConfirmDialog.tsx`, `ConfirmDialog.css`

- **InputDialog Component**: Reusable input popup component for rename, etc.
  - Auto-focus input field
  - Enter key to submit
  - File: `web/src/components/common/InputDialog.tsx`

- **Rename Session Feature**: Users can rename conversations
  - Added "Rename" option in session dropdown menu
  - New InputDialog for entering new name
  - Updates session title in database
  - Files changed: `Sidebar.tsx`, `chat.store.ts`, `chat.api.ts`

#### Backend
- **PUT /session/{session_id}**: New endpoint to update session title
  - Validates ownership before update
  - File: `backend/app/api/session.py`
- **SessionUpdate Schema**: Pydantic schema for session update
  - File: `backend/app/schemas/session.py`
- **update_session_title()**: CRUD function for updating session title
  - File: `backend/app/db/crud.py`

### Changed
- **Replaced browser confirm()**: All native `confirm()` dialogs replaced with ConfirmDialog component
  - Delete single session
  - Delete all sessions
  - Better UX with styled dialogs

---

## [1.0.2] - 2026-01-31

### Added

#### Frontend
- **Session Dropdown Menu**: Added 3-dot menu icon on each session for individual actions
  - Hover over session to show ⋮ (vertical ellipsis) icon
  - Click to open dropdown menu with "Delete" option
  - Click outside to close dropdown
  - Files changed: `web/src/components/layout/Sidebar.tsx`, `web/src/components/layout/Sidebar.css`

### Changed
- **Session Delete UX**: Replaced inline `×` button with dropdown menu
  - More consistent with modern chat interfaces (like OpenAI)
  - Expandable for future actions (rename, archive, etc.)

- **Documentation Cleanup**: Consolidated and cleaned up documentation files
  - Removed duplicate `docs/STRUCTURE.md` (content in `CODESTRUCTURE.md`)
  - Archived `TODO.md` and `TODO_V2.md` into `docs/COMPLETED_TASKS.md`
  - Updated `CODESTRUCTURE.md` with latest file structure

---

## [1.0.1] - 2026-01-27

### Fixed

#### Backend
- **CORS Configuration**: Fixed `CORS_ORIGINS` format in `.env` from comma-separated to JSON array format
  - Before: `CORS_ORIGINS=http://localhost:5173,http://localhost:3000`
  - After: `CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]`
  - Resolves JSONDecodeError on startup

- **Metadata Parsing**: Fixed null/missing metadata handling from AI Core
  - All metadata fields now nullable: `persona`, `context`, `model`, `usage`
  - Backend safely handles missing fields with `.get()` fallback
  - Files changed: `backend/app/schemas/common.py`, `backend/app/services/chat_service.py`

- **Model Info Extraction**: Fixed parsing `model_info` structure from AI Core
  - Extracts `model_name` and `usage` from `metadata.model_info` dict
  - Fallback to multiple locations for compatibility
  - File: `backend/app/services/chat_service.py`

- **Timeout Configuration**: Added configurable timeout for AI Core requests
  - Added `AI_CORE_TIMEOUT` to `.env` (default: 120s for LM Studio)
  - Prevents timeout errors with slow LLM responses
  - Files: `backend/.env`, `backend/.env.example`

#### Frontend
- **Null Safety**: Fixed UI crashes when metadata fields are null
  - SessionHeader: Conditional rendering for persona, confidence, model
  - DebugPanel: Display "N/A" for missing values
  - MessageBubble: Safe access with optional chaining
  - Files: `web/src/components/chat/*.tsx`

- **Type Definitions**: Updated TypeScript types to support nullable metadata
  - `Metadata` interface: All fields now `| null` or optional
  - `Context` and `Usage`: All fields optional
  - File: `web/src/types/chat.ts`

- **Store Logic**: Fixed metadata extraction in chat store
  - Safe access with `?.` operator and `|| undefined` fallback
  - File: `web/src/store/chat.store.ts`

### Technical Details

**Root Cause**: AI Core returns incomplete metadata when:
- LLM fails to generate response
- Fallback to simple response without full metadata
- Response structure: `{persona: null, context: {...}, model: null, usage: null}`

**Impact**: 
- Before: Frontend crash with "Cannot read property 'persona' of null"
- After: Graceful degradation with "N/A" display

**Testing**: Verified with multiple scenarios:
- ✅ Full metadata response
- ✅ Partial metadata (missing persona/model)
- ✅ Minimal response (all null)
- ✅ LM Studio slow responses (30-40s)

---

## [1.0.0] - 2026-01-26

### Added
- Initial release
- Backend: FastAPI + PostgreSQL + SQLAlchemy
- Frontend: React + TypeScript + Zustand
- 10 REST API endpoints
- 4 database tables
- Debug panel with metadata visualization
- Session management
- Structured logging with structlog

### Features
- ✅ Chat interface with real-time messaging
- ✅ AI metadata tracking (persona, confidence, context)
- ✅ Token usage statistics
- ✅ Conversation history persistence
- ✅ Session management (create, list, delete)
- ✅ Debug panel for AI behavior analysis

---

**Version Format**: [Major.Minor.Patch]
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes
