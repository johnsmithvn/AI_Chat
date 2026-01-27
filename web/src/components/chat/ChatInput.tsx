/**
 * Chat Input - Text input and send button
 */
import React, { useState } from "react";
import { useChatStore } from "../../store/chat.store";

export const ChatInput: React.FC = () => {
  const [input, setInput] = useState("");
  const { sendMessage, loading } = useChatStore();

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    await sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        padding: "1rem",
        borderTop: "1px solid #e5e7eb",
        backgroundColor: "#fff",
        display: "flex",
        gap: "0.75rem",
      }}
    >
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
        disabled={loading}
        style={{
          flex: 1,
          padding: "0.75rem",
          border: "1px solid #d1d5db",
          borderRadius: "0.5rem",
          resize: "none",
          fontFamily: "inherit",
          fontSize: "1rem",
          minHeight: "3rem",
          maxHeight: "8rem",
        }}
      />
      <button
        onClick={handleSend}
        disabled={loading || !input.trim()}
        style={{
          padding: "0.75rem 1.5rem",
          backgroundColor: loading || !input.trim() ? "#9ca3af" : "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "0.5rem",
          cursor: loading || !input.trim() ? "not-allowed" : "pointer",
          fontSize: "1rem",
          fontWeight: "500",
        }}
      >
        Send
      </button>
    </div>
  );
};
