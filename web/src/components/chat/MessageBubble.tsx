/**
 * Message Bubble - Single message display
 */
import React from "react";
import type { Message } from "../../types/chat";

interface MessageBubbleProps {
  message: Message;
}

const getPersonaColor = (persona?: string) => {
  switch (persona?.toLowerCase()) {
    case "casual":
      return "#10b981";
    case "technical":
      return "#3b82f6";
    case "cautious":
      return "#f59e0b";
    default:
      return "#6b7280";
  }
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          maxWidth: "70%",
          padding: "0.75rem 1rem",
          borderRadius: "0.75rem",
          backgroundColor: isUser ? "#3b82f6" : "#f3f4f6",
          color: isUser ? "white" : "#1f2937",
        }}
      >
        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {message.content}
        </div>

        {!isUser && message.persona && (
          <div
            style={{
              marginTop: "0.5rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid #e5e7eb",
              fontSize: "0.75rem",
              color: "#6b7280",
              display: "flex",
              gap: "0.75rem",
            }}
          >
            <span
              style={{
                color: getPersonaColor(message.persona),
                fontWeight: "500",
              }}
            >
              {message.persona}
            </span>
            {message.confidence !== undefined && (
              <span>Confidence: {(message.confidence * 100).toFixed(0)}%</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
