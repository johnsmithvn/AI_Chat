/**
 * Message Bubble - Single message display with Markdown rendering
 */
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Message } from "../../types/chat";
import { chatApi } from "../../services/chat.api";
import { useChatStore } from "../../store/chat.store";
import "./MessageBubble.css";

interface MessageBubbleProps {
  message: Message;
  onMistakeToggle?: (messageId: string, isMistake: boolean) => void;
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

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onMistakeToggle }) => {
  const isUser = message.role === "user";
  const [isMistake, setIsMistake] = useState(message.is_mistake || false);
  const [isMarking, setIsMarking] = useState(false);
  const { retryMessage, loading } = useChatStore();
  
  const isError = message.isError;
  const isEmpty = !message.content && !isError;

  const handleToggleMistake = async () => {
    setIsMarking(true);
    try {
      const newState = !isMistake;
      await chatApi.markMistake(message.id, newState);
      setIsMistake(newState);
      onMistakeToggle?.(message.id, newState);
    } catch (error) {
      console.error('Failed to toggle mistake:', error);
    } finally {
      setIsMarking(false);
    }
  };

  const handleRetry = () => {
    if (!loading) {
      retryMessage(message.id);
    }
  };

  // Show loading dots for empty assistant message (not error)
  if (isEmpty && !isUser) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          marginBottom: "1rem",
        }}
      >
        <div
          className="message-bubble assistant loading-bubble"
          style={{
            maxWidth: "70%",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            backgroundColor: "#f3f4f6",
            color: "#1f2937",
          }}
        >
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError && !isUser) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "flex-start",
          marginBottom: "1rem",
        }}
      >
        <div
          className="message-bubble assistant error-bubble"
          style={{
            maxWidth: "70%",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            backgroundColor: "#fef2f2",
            color: "#dc2626",
            border: "1px solid #fca5a5",
          }}
        >
          <div className="error-container">
            <span className="error-icon">⚠️</span>
            <span className="error-text">
              {message.errorMessage || "Failed to get response"}
            </span>
          </div>
          <button
            className="btn-retry"
            onClick={handleRetry}
            disabled={loading}
          >
            🔄 {loading ? "Retrying..." : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: "1rem",
      }}
    >
      <div
        className={`message-bubble ${isUser ? "user" : "assistant"} ${isMistake ? "mistake" : ""}`}
        style={{
          maxWidth: "70%",
          padding: "0.75rem 1rem",
          borderRadius: "0.75rem",
          backgroundColor: isUser ? "#3b82f6" : isMistake ? "#fef2f2" : "#f3f4f6",
          color: isUser ? "white" : "#1f2937",
          border: isMistake ? "2px solid #ef4444" : "none",
        }}
      >
        <div className="message-content">
          {isUser ? (
            // User messages: plain text
            <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {message.content}
            </span>
          ) : (
            // AI messages: render Markdown
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Code blocks with syntax highlighting
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match && !className;
                  
                  return !isInline ? (
                    <SyntaxHighlighter
                      style={oneDark}
                      language={match ? match[1] : "text"}
                      PreTag="div"
                      customStyle={{
                        margin: "0.5rem 0",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                      }}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code
                      className="inline-code"
                      style={{
                        backgroundColor: "#e5e7eb",
                        color: "#1f2937",
                        padding: "0.125rem 0.375rem",
                        borderRadius: "0.25rem",
                        fontSize: "0.875em",
                        fontFamily: "monospace",
                      }}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                // Style other elements
                p: ({ children }) => (
                  <p style={{ margin: "0.5rem 0", lineHeight: "1.6" }}>{children}</p>
                ),
                ul: ({ children }) => (
                  <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>{children}</ol>
                ),
                li: ({ children }) => (
                  <li style={{ margin: "0.25rem 0" }}>{children}</li>
                ),
                h1: ({ children }) => (
                  <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", margin: "0.75rem 0 0.5rem" }}>{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 style={{ fontSize: "1.25rem", fontWeight: "bold", margin: "0.75rem 0 0.5rem" }}>{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "600", margin: "0.5rem 0" }}>{children}</h3>
                ),
                blockquote: ({ children }) => (
                  <blockquote
                    style={{
                      borderLeft: "3px solid #3b82f6",
                      paddingLeft: "1rem",
                      margin: "0.5rem 0",
                      color: "#4b5563",
                      fontStyle: "italic",
                    }}
                  >
                    {children}
                  </blockquote>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#3b82f6", textDecoration: "underline" }}
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => (
                  <strong style={{ fontWeight: "600" }}>{children}</strong>
                ),
                em: ({ children }) => (
                  <em style={{ fontStyle: "italic" }}>{children}</em>
                ),
                table: ({ children }) => (
                  <div style={{ overflowX: "auto", margin: "0.5rem 0" }}>
                    <table style={{ borderCollapse: "collapse", width: "100%" }}>{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th style={{ 
                    border: "1px solid #d1d5db", 
                    padding: "0.5rem", 
                    backgroundColor: "#f3f4f6",
                    fontWeight: "600"
                  }}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td style={{ border: "1px solid #d1d5db", padding: "0.5rem" }}>{children}</td>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
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

        {/* Mistake toggle button for AI messages */}
        {!isUser && (
          <div
            style={{
              marginTop: "0.5rem",
              paddingTop: "0.5rem",
              borderTop: message.persona ? "none" : "1px solid #e5e7eb",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={handleToggleMistake}
              disabled={isMarking}
              style={{
                background: "none",
                border: "none",
                cursor: isMarking ? "wait" : "pointer",
                fontSize: "0.75rem",
                color: isMistake ? "#ef4444" : "#9ca3af",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                padding: "0.25rem 0.5rem",
                borderRadius: "0.25rem",
                transition: "all 0.15s",
              }}
              title={isMistake ? "Unmark as mistake" : "Mark as AI mistake"}
            >
              {isMistake ? "⚠️ Marked as mistake" : "🚫 Mark mistake"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
