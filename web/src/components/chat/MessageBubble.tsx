/**
 * Message Bubble - Single message display with Markdown rendering
 */
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import type { Message } from "../../types/chat";
import "./MessageBubble.css";

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
        className={`message-bubble ${isUser ? "user" : "assistant"}`}
        style={{
          maxWidth: "70%",
          padding: "0.75rem 1rem",
          borderRadius: "0.75rem",
          backgroundColor: isUser ? "#3b82f6" : "#f3f4f6",
          color: isUser ? "white" : "#1f2937",
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
      </div>
    </div>
  );
};
