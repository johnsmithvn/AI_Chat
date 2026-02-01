/**
 * CompareModal - Compare two sessions side by side
 */
import { useEffect, useState } from 'react';
import { chatApi } from '../../services/chat.api';
import { useChatStore } from '../../store/chat.store';
import type { SessionCompareResponse } from '../../types/api';
import './CompareModal.css';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompareModal({ isOpen, onClose }: CompareModalProps) {
  const { sessions } = useChatStore();
  const [session1Id, setSession1Id] = useState<string>('');
  const [session2Id, setSession2Id] = useState<string>('');
  const [compareData, setCompareData] = useState<SessionCompareResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSession1Id('');
      setSession2Id('');
      setCompareData(null);
      setError(null);
    }
  }, [isOpen]);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleCompare = async () => {
    if (!session1Id || !session2Id) {
      setError('Please select two sessions to compare');
      return;
    }
    if (session1Id === session2Id) {
      setError('Please select two different sessions');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await chatApi.compareSessions(session1Id, session2Id);
      setCompareData(data);
    } catch (err) {
      console.error('Failed to compare sessions:', err);
      setError('Failed to compare sessions');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const renderComparison = (label: string, value1: string | number, value2: string | number, highlight?: boolean) => {
    const v1 = typeof value1 === 'number' ? value1 : 0;
    const v2 = typeof value2 === 'number' ? value2 : 0;
    const diff = v1 - v2;
    
    return (
      <div className="compare-row">
        <div className="compare-cell">{String(value1)}</div>
        <div className="compare-label">{label}</div>
        <div className="compare-cell">{String(value2)}</div>
        {highlight && typeof value1 === 'number' && (
          <div className={`compare-diff ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''}`}>
            {diff > 0 ? `+${diff}` : diff < 0 ? diff : '='}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="compare-modal-backdrop" onClick={handleBackdropClick}>
      <div className="compare-modal">
        <div className="compare-modal-header">
          <h2>⚖️ Compare Sessions</h2>
          <button className="compare-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="compare-content">
          {/* Session selectors */}
          <div className="compare-selectors">
            <div className="compare-selector">
              <label>Session 1</label>
              <select 
                value={session1Id} 
                onChange={(e) => setSession1Id(e.target.value)}
              >
                <option value="">Select session...</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.id === session2Id}>
                    {s.title || 'Untitled'} ({s.message_count} msgs)
                  </option>
                ))}
              </select>
            </div>

            <div className="compare-vs">VS</div>

            <div className="compare-selector">
              <label>Session 2</label>
              <select 
                value={session2Id} 
                onChange={(e) => setSession2Id(e.target.value)}
              >
                <option value="">Select session...</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.id === session1Id}>
                    {s.title || 'Untitled'} ({s.message_count} msgs)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button 
            className="compare-btn"
            onClick={handleCompare}
            disabled={!session1Id || !session2Id || loading}
          >
            {loading ? 'Comparing...' : 'Compare'}
          </button>

          {error && <div className="compare-error">{error}</div>}

          {/* Comparison results */}
          {compareData && (
            <div className="compare-results">
              <div className="compare-headers">
                <div className="compare-header">
                  <h4>{compareData.session_1.title || 'Untitled'}</h4>
                  <span>{formatDate(compareData.session_1.created_at)}</span>
                </div>
                <div className="compare-header">
                  <h4>{compareData.session_2.title || 'Untitled'}</h4>
                  <span>{formatDate(compareData.session_2.created_at)}</span>
                </div>
              </div>

              <div className="compare-table">
                {renderComparison('Messages', compareData.session_1.message_count, compareData.session_2.message_count, true)}
                {renderComparison('Total Tokens', compareData.session_1.total_tokens, compareData.session_2.total_tokens, true)}
                {renderComparison('Avg Confidence', 
                  compareData.session_1.avg_confidence !== null ? `${(compareData.session_1.avg_confidence * 100).toFixed(1)}%` : 'N/A',
                  compareData.session_2.avg_confidence !== null ? `${(compareData.session_2.avg_confidence * 100).toFixed(1)}%` : 'N/A'
                )}
                {renderComparison('Duration', 
                  `${compareData.session_1.duration_minutes.toFixed(1)} min`,
                  `${compareData.session_2.duration_minutes.toFixed(1)} min`
                )}
                {renderComparison('Model', 
                  compareData.session_1.model_used || 'N/A',
                  compareData.session_2.model_used || 'N/A'
                )}
              </div>

              {/* Persona distribution */}
              <div className="compare-personas">
                <h4>Persona Distribution</h4>
                <div className="compare-persona-grid">
                  <div className="compare-persona-list">
                    {Object.entries(compareData.session_1.persona_distribution).map(([persona, count]) => (
                      <div key={persona} className="persona-item">
                        <span>{persona}</span>
                        <span className="persona-count">{count}</span>
                      </div>
                    ))}
                    {Object.keys(compareData.session_1.persona_distribution).length === 0 && (
                      <div className="persona-empty">No persona data</div>
                    )}
                  </div>
                  <div className="compare-persona-list">
                    {Object.entries(compareData.session_2.persona_distribution).map(([persona, count]) => (
                      <div key={persona} className="persona-item">
                        <span>{persona}</span>
                        <span className="persona-count">{count}</span>
                      </div>
                    ))}
                    {Object.keys(compareData.session_2.persona_distribution).length === 0 && (
                      <div className="persona-empty">No persona data</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
