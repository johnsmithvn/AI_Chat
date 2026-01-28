/**
 * Sidebar - Session list like OpenAI
 */
import { useEffect } from 'react';
import { useChatStore } from '../../store/chat.store';
import './Sidebar.css';

export default function Sidebar() {
  const { sessions, currentSessionId, loadSessions, createSession, selectSession, deleteSession, deleteAllSessions } = useChatStore();

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleNewChat = async () => {
    await createSession();
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      await deleteSession(sessionId);
    }
  };

  const handleDeleteAll = async () => {
    if (sessions.length === 0) return;
    
    if (confirm(`Delete ALL ${sessions.length} conversations? This cannot be undone!`)) {
      await deleteAllSessions();
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <button className="btn-new-chat" onClick={handleNewChat}>
          <span>+</span> New Chat
        </button>
        {sessions.length > 0 && (
          <button className="btn-delete-all" onClick={handleDeleteAll} title="Delete all conversations">
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
              <button
                className="btn-delete-session"
                onClick={(e) => handleDeleteSession(session.id, e)}
                title="Delete"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
