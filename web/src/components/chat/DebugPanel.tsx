/**
 * Debug Panel - AI metadata observer
 */
import React from "react";
import { useChatStore } from "../../store/chat.store";

export const DebugPanel: React.FC = () => {
  const { currentMetadata, messages } = useChatStore();

  // Count personas
  const personaCounts = messages
    .filter((m) => m.role === "assistant" && m.persona)
    .reduce((acc, m) => {
      acc[m.persona!] = (acc[m.persona!] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  // Calculate total tokens
  const totalTokens = messages
    .filter((m) => m.role === "assistant")
    .reduce(
      (acc, m) => ({
        prompt: acc.prompt + (m.prompt_tokens || 0),
        completion: acc.completion + (m.completion_tokens || 0),
      }),
      { prompt: 0, completion: 0 }
    );

  return (
    <div
      style={{
        width: "30%",
        borderLeft: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
        padding: "1rem",
        overflowY: "auto",
      }}
    >
      <h3 style={{ marginTop: 0, fontSize: "1.125rem", fontWeight: "600" }}>
        🔬 Debug Panel
      </h3>

      {currentMetadata ? (
        <div>
          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              Current Message
            </h4>
            <div style={{ fontSize: "0.875rem", color: "#4b5563" }}>
              <div style={{ marginBottom: "0.25rem" }}>
                <strong>Persona:</strong> {currentMetadata.persona}
              </div>
              <div style={{ marginBottom: "0.25rem" }}>
                <strong>Context:</strong> {currentMetadata.context.context_type}
              </div>
              <div style={{ marginBottom: "0.25rem" }}>
                <strong>Confidence:</strong>{" "}
                {(currentMetadata.context.confidence * 100).toFixed(1)}%
              </div>
              <div style={{ marginBottom: "0.25rem" }}>
                <strong>Model:</strong> {currentMetadata.model}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              Persona Distribution
            </h4>
            {Object.entries(personaCounts).map(([persona, count]) => (
              <div
                key={persona}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.875rem",
                  marginBottom: "0.25rem",
                }}
              >
                <span>{persona}</span>
                <span style={{ fontWeight: "600" }}>{count}</span>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h4 style={{ fontSize: "0.875rem", fontWeight: "600", marginBottom: "0.5rem" }}>
              Token Usage
            </h4>
            <div style={{ fontSize: "0.875rem", color: "#4b5563" }}>
              <div style={{ marginBottom: "0.25rem" }}>
                <strong>Prompt:</strong> {totalTokens.prompt}
              </div>
              <div style={{ marginBottom: "0.25rem" }}>
                <strong>Completion:</strong> {totalTokens.completion}
              </div>
              <div style={{ marginBottom: "0.25rem" }}>
                <strong>Total:</strong> {totalTokens.prompt + totalTokens.completion}
              </div>
            </div>
          </div>

          {currentMetadata.warnings.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h4
                style={{
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  marginBottom: "0.5rem",
                  color: "#dc2626",
                }}
              >
                ⚠️ Warnings
              </h4>
              <ul style={{ fontSize: "0.875rem", paddingLeft: "1.25rem", margin: 0 }}>
                {currentMetadata.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(currentMetadata, null, 2));
              alert("Metadata copied to clipboard!");
            }}
            style={{
              width: "100%",
              padding: "0.5rem",
              backgroundColor: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Copy Raw JSON
          </button>
        </div>
      ) : (
        <div style={{ color: "#9ca3af", fontSize: "0.875rem", textAlign: "center" }}>
          No metadata yet. Send a message to see AI metadata.
        </div>
      )}
    </div>
  );
};
