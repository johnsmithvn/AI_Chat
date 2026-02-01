/**
 * ReplayModal - Session replay with animated message display
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import { chatApi } from '../../services/chat.api';
import type { SessionReplayResponse, ReplayMessage } from '../../types/api';
import './ReplayModal.css';

interface ReplayModalProps {
  isOpen: boolean;
  sessionId: string | null;
  onClose: () => void;
}

type PlayState = 'idle' | 'playing' | 'paused' | 'finished';

export default function ReplayModal({ isOpen, sessionId, onClose }: ReplayModalProps) {
  const [replayData, setReplayData] = useState<SessionReplayResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayedMessages, setDisplayedMessages] = useState<ReplayMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playState, setPlayState] = useState<PlayState>('idle');
  const [speed, setSpeed] = useState(1);
  
  const timerRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load replay data
  useEffect(() => {
    if (isOpen && sessionId) {
      loadReplayData();
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isOpen, sessionId]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages]);

  // Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      } else if (e.key === ' ' && isOpen && replayData) {
        e.preventDefault();
        if (playState === 'playing') {
          handlePause();
        } else if (playState === 'paused' || playState === 'idle') {
          handlePlay();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, playState, replayData]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const loadReplayData = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    setError(null);
    setDisplayedMessages([]);
    setCurrentIndex(0);
    setPlayState('idle');
    
    try {
      const data = await chatApi.getSessionReplay(sessionId);
      setReplayData(data);
    } catch (err) {
      console.error('Failed to load replay:', err);
      setError('Failed to load session replay');
    } finally {
      setLoading(false);
    }
  };

  const playNextMessage = useCallback(() => {
    if (!replayData || currentIndex >= replayData.messages.length) {
      setPlayState('finished');
      return;
    }

    const message = replayData.messages[currentIndex];
    setDisplayedMessages(prev => [...prev, message]);
    setCurrentIndex(prev => prev + 1);

    // Schedule next message
    if (currentIndex + 1 < replayData.messages.length) {
      const nextMessage = replayData.messages[currentIndex + 1];
      const delay = Math.max(nextMessage.delay_ms / speed, 100); // Min 100ms
      timerRef.current = window.setTimeout(playNextMessage, delay);
    } else {
      setPlayState('finished');
    }
  }, [replayData, currentIndex, speed]);

  const handlePlay = () => {
    if (!replayData) return;
    
    if (playState === 'finished') {
      // Restart from beginning
      setDisplayedMessages([]);
      setCurrentIndex(0);
    }
    
    setPlayState('playing');
    
    // Start playback
    if (currentIndex < replayData.messages.length) {
      const message = replayData.messages[currentIndex];
      const delay = currentIndex === 0 ? 0 : Math.max(message.delay_ms / speed, 100);
      timerRef.current = window.setTimeout(playNextMessage, delay);
    }
  };

  const handlePause = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPlayState('paused');
  };

  const handleRestart = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setDisplayedMessages([]);
    setCurrentIndex(0);
    setPlayState('idle');
  };

  const handleClose = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setReplayData(null);
    setDisplayedMessages([]);
    setCurrentIndex(0);
    setPlayState('idle');
    onClose();
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const progress = replayData 
    ? Math.round((displayedMessages.length / replayData.messages.length) * 100) 
    : 0;

  return (
    <div className="replay-modal-backdrop" onClick={handleBackdropClick}>
      <div className="replay-modal">
        <div className="replay-modal-header">
          <h2>▶️ Session Replay</h2>
          <span className="replay-title">{replayData?.title || 'Untitled'}</span>
          <button className="replay-modal-close" onClick={handleClose}>×</button>
        </div>

        {loading && (
          <div className="replay-loading">Loading replay data...</div>
        )}

        {error && (
          <div className="replay-error">{error}</div>
        )}

        {replayData && !loading && (
          <>
            <div className="replay-messages">
              {displayedMessages.map((msg, index) => (
                <div 
                  key={msg.id} 
                  className={`replay-message replay-message-${msg.role}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="replay-message-header">
                    <span className="replay-message-role">
                      {msg.role === 'user' ? '👤 You' : '🤖 AI'}
                    </span>
                    {msg.persona && (
                      <span className="replay-message-persona">{msg.persona}</span>
                    )}
                    {msg.confidence !== undefined && (
                      <span className="replay-message-confidence">
                        {(msg.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div className="replay-message-content">{msg.content}</div>
                  {msg.role === 'assistant' && (msg.prompt_tokens || msg.completion_tokens) && (
                    <div className="replay-message-tokens">
                      Tokens: {(msg.prompt_tokens || 0) + (msg.completion_tokens || 0)}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
              
              {displayedMessages.length === 0 && playState === 'idle' && (
                <div className="replay-empty">
                  Press Play to start replay ({replayData.message_count} messages)
                </div>
              )}
            </div>

            <div className="replay-controls">
              <div className="replay-progress">
                <div 
                  className="replay-progress-bar" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              <div className="replay-buttons">
                <button 
                  className="replay-btn"
                  onClick={handleRestart}
                  title="Restart"
                >
                  ⏮️
                </button>
                
                {playState === 'playing' ? (
                  <button 
                    className="replay-btn replay-btn-primary"
                    onClick={handlePause}
                    title="Pause (Space)"
                  >
                    ⏸️
                  </button>
                ) : (
                  <button 
                    className="replay-btn replay-btn-primary"
                    onClick={handlePlay}
                    title="Play (Space)"
                  >
                    ▶️
                  </button>
                )}
                
                <select 
                  className="replay-speed"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  title="Playback speed"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1x</option>
                  <option value={2}>2x</option>
                  <option value={4}>4x</option>
                  <option value={10}>10x</option>
                </select>
                
                <span className="replay-counter">
                  {displayedMessages.length} / {replayData.message_count}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
