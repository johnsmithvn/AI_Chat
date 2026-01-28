/**
 * Chat Page - Main page with Sidebar + TopBar layout
 */
import React, { useEffect } from "react";
import { useChatStore } from "../store/chat.store";
import Sidebar from "../components/layout/Sidebar";
import TopBar from "../components/layout/TopBar";
import { ChatWindow } from "../components/chat/ChatWindow";
import { DebugPanel } from "../components/chat/DebugPanel";
import './ChatPage.css';

export const ChatPage: React.FC = () => {
  const { error, setError } = useChatStore();

  useEffect(() => {
    // Clear error after 5 seconds
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  return (
    <div className="chat-page">
      <Sidebar />
      
      <div className="chat-main">
        <TopBar />
        
        <div className="chat-content">
          <ChatWindow />
          <DebugPanel />
        </div>
      </div>

      {error && (
        <div className="error-toast">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};
