/**
 * Message List - Renders all messages
 */
import React, { useEffect, useRef } from "react";
import { useChatStore } from "../../store/chat.store";
import { MessageBubble } from "./MessageBubble";

export const MessageList: React.FC = () => {
  const { messages, loading } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "1rem",
        backgroundColor: "#fff",
      }}
    >
      {messages.length === 0 ? (
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💬</div>
            <div>Start a conversation</div>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <MessageBubble key={index} message={message} />
          ))}
          {loading && (
            <div style={{ textAlign: "center", color: "#9ca3af", padding: "1rem" }}>
              <div style={{ fontSize: "1.5rem" }}>⏳</div>
              <div style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>AI is thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
};
