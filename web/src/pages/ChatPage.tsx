/**
 * Chat Page - Main page with AI LAB layout
 */
import React, { useEffect } from "react";
import { useChatStore } from "../store/chat.store";
import { SessionHeader } from "../components/chat/SessionHeader";
import { ChatWindow } from "../components/chat/ChatWindow";
import { DebugPanel } from "../components/chat/DebugPanel";

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
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f9fafb",
      }}
    >
      <SessionHeader />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <ChatWindow />
        <DebugPanel />
      </div>

      {error && (
        <div
          style={{
            position: "fixed",
            bottom: "1rem",
            right: "1rem",
            padding: "1rem",
            backgroundColor: "#fee2e2",
            color: "#dc2626",
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            maxWidth: "20rem",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
};
