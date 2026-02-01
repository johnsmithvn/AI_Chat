/**
 * AnalyticsModal - Token usage analytics display
 */
import { useEffect, useState } from 'react';
import { chatApi } from '../../services/chat.api';
import type { TokenAnalyticsResponse } from '../../types/api';
import './AnalyticsModal.css';

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'sessions' | 'daily';

export default function AnalyticsModal({ isOpen, onClose }: AnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<TokenAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    if (isOpen) {
      loadAnalytics();
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

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await chatApi.getTokenAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Failed to load analytics');
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

  const formatNumber = (num: number) => num.toLocaleString();
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="analytics-modal-backdrop" onClick={handleBackdropClick}>
      <div className="analytics-modal">
        <div className="analytics-modal-header">
          <h2>📊 Token Analytics</h2>
          <button className="analytics-modal-close" onClick={onClose}>×</button>
        </div>

        {loading && (
          <div className="analytics-loading">Loading analytics...</div>
        )}

        {error && (
          <div className="analytics-error">{error}</div>
        )}

        {analytics && !loading && (
          <>
            <div className="analytics-tabs">
              <button 
                className={`analytics-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button 
                className={`analytics-tab ${activeTab === 'sessions' ? 'active' : ''}`}
                onClick={() => setActiveTab('sessions')}
              >
                By Session
              </button>
              <button 
                className={`analytics-tab ${activeTab === 'daily' ? 'active' : ''}`}
                onClick={() => setActiveTab('daily')}
              >
                By Day
              </button>
            </div>

            <div className="analytics-content">
              {activeTab === 'overview' && (
                <div className="analytics-overview">
                  <div className="analytics-stat-grid">
                    <div className="analytics-stat-card">
                      <div className="stat-value">{formatNumber(analytics.overall.total_tokens)}</div>
                      <div className="stat-label">Total Tokens</div>
                    </div>
                    <div className="analytics-stat-card">
                      <div className="stat-value">{formatNumber(analytics.overall.total_prompt_tokens)}</div>
                      <div className="stat-label">Prompt Tokens</div>
                    </div>
                    <div className="analytics-stat-card">
                      <div className="stat-value">{formatNumber(analytics.overall.total_completion_tokens)}</div>
                      <div className="stat-label">Completion Tokens</div>
                    </div>
                    <div className="analytics-stat-card">
                      <div className="stat-value">{formatNumber(analytics.overall.message_count)}</div>
                      <div className="stat-label">AI Messages</div>
                    </div>
                    <div className="analytics-stat-card">
                      <div className="stat-value">{analytics.overall.avg_tokens_per_message.toFixed(1)}</div>
                      <div className="stat-label">Avg Tokens/Message</div>
                    </div>
                    <div className="analytics-stat-card">
                      <div className="stat-value">{analytics.by_session.length}</div>
                      <div className="stat-label">Total Sessions</div>
                    </div>
                  </div>

                  {/* Simple bar chart for tokens breakdown */}
                  <div className="analytics-chart">
                    <h4>Token Distribution</h4>
                    <div className="token-bar">
                      <div 
                        className="token-bar-prompt" 
                        style={{ 
                          width: `${(analytics.overall.total_prompt_tokens / analytics.overall.total_tokens) * 100}%` 
                        }}
                        title={`Prompt: ${formatNumber(analytics.overall.total_prompt_tokens)}`}
                      />
                      <div 
                        className="token-bar-completion" 
                        style={{ 
                          width: `${(analytics.overall.total_completion_tokens / analytics.overall.total_tokens) * 100}%` 
                        }}
                        title={`Completion: ${formatNumber(analytics.overall.total_completion_tokens)}`}
                      />
                    </div>
                    <div className="token-bar-legend">
                      <span className="legend-prompt">■ Prompt ({Math.round((analytics.overall.total_prompt_tokens / analytics.overall.total_tokens) * 100)}%)</span>
                      <span className="legend-completion">■ Completion ({Math.round((analytics.overall.total_completion_tokens / analytics.overall.total_tokens) * 100)}%)</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'sessions' && (
                <div className="analytics-sessions">
                  {analytics.by_session.length === 0 ? (
                    <div className="analytics-empty">No session data available</div>
                  ) : (
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Session</th>
                          <th>Prompt</th>
                          <th>Completion</th>
                          <th>Total</th>
                          <th>Messages</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.by_session.map((session) => (
                          <tr key={session.session_id}>
                            <td className="session-title">
                              {session.session_title || 'Untitled'}
                            </td>
                            <td>{formatNumber(session.prompt_tokens)}</td>
                            <td>{formatNumber(session.completion_tokens)}</td>
                            <td className="total-col">{formatNumber(session.total_tokens)}</td>
                            <td>{session.message_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'daily' && (
                <div className="analytics-daily">
                  {analytics.by_day.length === 0 ? (
                    <div className="analytics-empty">No daily data available</div>
                  ) : (
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Prompt</th>
                          <th>Completion</th>
                          <th>Total</th>
                          <th>Messages</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.by_day.map((day) => (
                          <tr key={day.date}>
                            <td>{formatDate(day.date)}</td>
                            <td>{formatNumber(day.prompt_tokens)}</td>
                            <td>{formatNumber(day.completion_tokens)}</td>
                            <td className="total-col">{formatNumber(day.total_tokens)}</td>
                            <td>{day.message_count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
