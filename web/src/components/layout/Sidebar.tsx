/**
 * Sidebar - Session list like OpenAI
 */
import { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../store/chat.store';
import ConfirmDialog from '../common/ConfirmDialog';
import InputDialog from '../common/InputDialog';
import ReplayModal from '../analytics/ReplayModal';
import './Sidebar.css';

interface DialogState {
  type: 'delete' | 'deleteAll' | 'rename' | 'replay' | null;
  sessionId?: string;
  sessionTitle?: string;
}

export default function Sidebar() {
  const { sessions, currentSessionId, loadSessions, createSession, selectSession, deleteSession, deleteAllSessions, renameSession } = useChatStore();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogState>({ type: null });
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewChat = async () => {
    await createSession();
  };

  const handleMenuToggle = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === sessionId ? null : sessionId);
  };

  const openDeleteDialog = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setDialog({ type: 'delete', sessionId });
  };

  const openRenameDialog = (sessionId: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setDialog({ type: 'rename', sessionId, sessionTitle: currentTitle });
  };

  const openReplayDialog = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(null);
    setDialog({ type: 'replay', sessionId });
  };

  const openDeleteAllDialog = () => {
    if (sessions.length === 0) return;
    setDialog({ type: 'deleteAll' });
  };

  const closeDialog = () => {
    setDialog({ type: null });
  };

  const handleConfirmDelete = async () => {
    if (dialog.sessionId) {
      await deleteSession(dialog.sessionId);
    }
    closeDialog();
  };

  const handleConfirmDeleteAll = async () => {
    await deleteAllSessions();
    closeDialog();
  };

  const handleConfirmRename = async (newTitle: string) => {
    if (dialog.sessionId) {
      await renameSession(dialog.sessionId, newTitle);
    }
    closeDialog();
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-header">
          <button className="btn-new-chat" onClick={handleNewChat}>
            <span>+</span> New Chat
          </button>
          {sessions.length > 0 && (
            <button className="btn-delete-all" onClick={openDeleteAllDialog} title="Delete all conversations">
              🗑️ Delete All ({sessions.length})
            </button>
          )}
        </div>

        <div className="sidebar-sessions">
          {sessions.length === 0 ? (
            <div className="sidebar-empty">
              No conversations yet
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={`session-item ${currentSessionId === session.id ? 'active' : ''}`}
                onClick={() => selectSession(session.id)}
              >
                <div className="session-title">
                  {session.title || 'New Chat'}
                </div>
                <div className="session-menu-container" ref={openMenuId === session.id ? menuRef : null}>
                  <button
                    className="btn-session-menu"
                    onClick={(e) => handleMenuToggle(session.id, e)}
                    title="Options"
                  >
                    <span className="dots">⋮</span>
                  </button>
                  {openMenuId === session.id && (
                    <div className="session-dropdown">
                      <button
                        className="dropdown-item"
                        onClick={(e) => openRenameDialog(session.id, session.title || '', e)}
                      >
                        <span className="dropdown-icon">✏️</span>
                        Rename
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={(e) => openReplayDialog(session.id, e)}
                      >
                        <span className="dropdown-icon">▶️</span>
                        Replay
                      </button>
                      <button
                        className="dropdown-item dropdown-item-delete"
                        onClick={(e) => openDeleteDialog(session.id, e)}
                      >
                        <span className="dropdown-icon">🗑️</span>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Delete Single Session Dialog */}
      <ConfirmDialog
        isOpen={dialog.type === 'delete'}
        title="Delete Conversation"
        message="Are you sure you want to delete this conversation? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={closeDialog}
      />

      {/* Delete All Sessions Dialog */}
      <ConfirmDialog
        isOpen={dialog.type === 'deleteAll'}
        title="Delete All Conversations"
        message={`Are you sure you want to delete ALL ${sessions.length} conversations? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleConfirmDeleteAll}
        onCancel={closeDialog}
      />

      {/* Rename Session Dialog */}
      <InputDialog
        isOpen={dialog.type === 'rename'}
        title="Rename Conversation"
        placeholder="Enter new name"
        initialValue={dialog.sessionTitle || ''}
        confirmText="Save"
        cancelText="Cancel"
        onConfirm={handleConfirmRename}
        onCancel={closeDialog}
      />

      {/* Replay Session Modal */}
      <ReplayModal
        isOpen={dialog.type === 'replay'}
        sessionId={dialog.sessionId || null}
        onClose={closeDialog}
      />
    </>
  );
}
