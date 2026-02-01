# CHANGELOG

All notable changes to AI Chat 2 project will be documented in this file.

---

## [1.2.0] - 2026-02-01 (AI Core v2.1 Integration)

### Added

#### Backend - AI Core v2.1 Support
- **Database Migration**: Added new columns for v2.1 metadata
  - `signal_strength` (Float) - replaces confidence score
  - `context_clarity` (Integer 0/1) - was context clear?
  - `needs_knowledge` (Integer 0/1) - needs RAG?
  - File: `migrations/versions/2026_02_01_2230-c8d5e3f7a2b4_add_signal_strength_columns.py`

- **SQLAlchemy Model**: Property converters for Integer↔Boolean
  - `context_clarity` and `needs_knowledge` stored as Integer (0/1) in DB
  - Python properties convert to/from Boolean for Pydantic
  - File: `backend/app/db/models.py`

- **Schemas**: Updated with v2.1 fields
  - `MessageCreate`, `MessageResponse` include new fields
  - `MetadataSchema` supports both legacy and v2.1 fields
  - Files: `backend/app/schemas/chat.py`, `backend/app/schemas/common.py`

#### Frontend - v2.1 Display
- **MessageBubble**: Shows v2.1 metadata indicators
  - Signal strength display (replaces confidence)
  - "⚠️ Unclear context" warning when context_clarity=false
  - "📚 Needs knowledge" indicator when needs_knowledge=true
  - File: `web/src/components/chat/MessageBubble.tsx`

- **DebugPanel**: Enhanced metadata display
  - All v2.1 fields with proper labels
  - File: `web/src/components/chat/DebugPanel.tsx`

- **Types & Store**: Updated for v2.1
  - `Message` interface includes signal_strength, context_clarity, needs_knowledge
  - Fallback logic for backward compatibility
  - Files: `web/src/types/chat.ts`, `web/src/store/chat.store.ts`

### Fixed

- **DELETE /sessions route**: Fixed 405 Method Not Allowed error
  - Route was `/session` (empty string after prefix), frontend called `/sessions`
  - Changed `@router.delete("")` to `@router.delete("s")`
  - File: `backend/app/api/session.py`

- **Metadata extraction**: Simplified for flat v2.1 structure
  - Removed obsolete `model_info` nested object handling
  - Model and usage now at top-level of metadata
  - File: `backend/app/services/chat_service.py`

### Changed

- **Backward Compatibility**: Legacy fields still supported
  - `confidence` → `signal_strength` (with fallback)
  - `persona` → `persona_used` (with fallback)
  - Analytics endpoints support both old and new field names

---

## [1.1.1] - 2026-01-31

### Added

#### Frontend - Error Handling & Retry
- **MessageBubble**: Error state display with retry functionality
  - Shows error message when API call fails (red background, warning icon)
  - "Retry" button to resend the failed message
  - Loading dots animation while waiting for response
  - Shake animation on error
  - File: `web/src/components/chat/MessageBubble.tsx`

- **Chat Store**: Added `retryMessage()` action
  - Finds the original user message before the error
  - Resends to API and updates response
  - Handles error state transitions
  - File: `web/src/store/chat.store.ts`

- **Message Type**: Added error fields
  - `isError?: boolean` - indicates error state
  - `errorMessage?: string` - error description
  - File: `web/src/types/chat.ts`

### Changed
- **sendMessage()**: Now creates placeholder assistant message immediately
  - Shows loading dots while waiting for response
  - Updates placeholder with real response or error state
  - Better UX with immediate feedback

- **MessageBubble.css**: Added new styles
  - `.error-bubble` with shake animation
  - `.btn-retry` button with hover effects
  - `.loading-dots` with bouncing animation

---

## [1.1.0] - 2026-01-31 (Phase 6: Advanced Features)

### Added

#### Backend - Analytics API
- **GET /analytics/tokens**: Token usage analytics endpoint
  - Overall stats (total tokens, message count, avg per message)
  - By session breakdown
  - By day breakdown (last 30 days)
  - File: `backend/app/api/analytics.py`

- **POST /analytics/compare**: Compare two sessions endpoint
  - Side-by-side session comparison
  - Token stats, confidence, persona distribution
  - Duration calculation
  - File: `backend/app/api/analytics.py`

- **GET /session/{id}/replay**: Session replay endpoint
  - Returns messages with timing delays
  - Calculated delay between messages (capped at 10s)
  - File: `backend/app/api/session.py`
  - Schema: `backend/app/schemas/replay.py`

- **PUT /message/{id}/mistake**: Mark message as AI mistake
  - Toggle mistake flag with optional note
  - File: `backend/app/api/message.py`

- **GET /message/mistakes**: Get all marked mistakes
  - Lists all messages marked as mistakes for user
  - File: `backend/app/api/message.py`

#### Backend - Database
- **Migration**: Added `is_mistake` and `mistake_note` columns to messages table
  - File: `migrations/versions/2026_01_31_1000-b7c4d2e8f9a1_add_is_mistake_column.py`

- **New CRUD functions**:
  - `get_message()`, `mark_message_mistake()`, `get_user_mistakes()`, `check_message_ownership()`
  - File: `backend/app/db/crud.py`

#### Frontend - Analytics Components
- **AnalyticsModal**: Token usage analytics display
  - Overview with stat cards and token distribution bar
  - By Session tab with sortable table
  - By Day tab with usage history
  - Files: `web/src/components/analytics/AnalyticsModal.tsx`, `AnalyticsModal.css`

- **ReplayModal**: Session replay with animated playback
  - Play/Pause/Restart controls
  - Adjustable speed (0.5x - 10x)
  - Progress bar and message counter
  - Keyboard shortcuts (Space to play/pause, Escape to close)
  - Files: `web/src/components/analytics/ReplayModal.tsx`, `ReplayModal.css`

- **CompareModal**: Compare two sessions side-by-side
  - Session selector dropdowns
  - Comparison table (messages, tokens, confidence, duration, model)
  - Persona distribution comparison
  - Files: `web/src/components/analytics/CompareModal.tsx`, `CompareModal.css`

#### Frontend - Mark AI Mistakes
- **MessageBubble**: Added "Mark mistake" button on AI messages
  - Visual indicator for marked messages (red border, light red background)
  - Toggle to mark/unmark mistakes
  - File: `web/src/components/chat/MessageBubble.tsx`

#### Frontend - UI Integration
- **TopBar**: Added Analytics and Compare buttons
  - Quick access to analytics and session comparison
  - File: `web/src/components/layout/TopBar.tsx`, `TopBar.css`

- **Sidebar**: Added Replay option in session dropdown
  - Replay button in session menu
  - File: `web/src/components/layout/Sidebar.tsx`

#### API Types
- New types: `TokenAnalyticsResponse`, `SessionCompareResponse`, `SessionReplayResponse`, `MistakesListResponse`
- File: `web/src/types/api.ts`

### Changed
- **chat.api.ts**: Added new API methods
  - `getTokenAnalytics()`, `compareSessions()`, `getSessionReplay()`, `markMistake()`, `getMistakes()`

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
