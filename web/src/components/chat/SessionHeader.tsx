/**
 * Session Header - Displays AI status and session info
 */
import React from "react";
import { useChatStore } from "../../store/chat.store";

const getPersonaColor = (persona?: string) => {
  switch (persona?.toLowerCase()) {
    case "casual":
      return "#10b981"; // green
    case "technical":
      return "#3b82f6"; // blue
    case "cautious":
      return "#f59e0b"; // yellow
    default:
      return "#6b7280"; // gray
  }
};

export const SessionHeader: React.FC = () => {
  const { sessionId, currentMetadata, createNewSession } = useChatStore();

  const handleNewSession = async () => {
    if (confirm("Create new session? Current conversation will be cleared.")) {
      await createNewSession();
    }
  };

  return (
    <div style={{
      padding: "1rem",
      borderBottom: "1px solid #e5e7eb",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#fff",
    }}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <div>
          <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>Session:</span>
          <span style={{ marginLeft: "0.5rem", fontFamily: "monospace", fontSize: "0.875rem" }}>
            {sessionId ? sessionId.slice(0, 8) : "No session"}
          </span>
        </div>

        {currentMetadata && (
          <>
            {currentMetadata.persona && (
              <div style={{
                padding: "0.25rem 0.75rem",
                borderRadius: "9999px",
                fontSize: "0.875rem",
                fontWeight: "500",
                backgroundColor: getPersonaColor(currentMetadata.persona) + "20",
                color: getPersonaColor(currentMetadata.persona),
              }}>
                {currentMetadata.persona}
              </div>
            )}

            {currentMetadata.context?.confidence !== undefined && (
              <div>
                <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                  Confidence: {(currentMetadata.context.confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}

            {currentMetadata.model && (
              <div>
                <span style={{ color: "#6b7280", fontSize: "0.875rem" }}>
                  Model: {currentMetadata.model}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <button
        onClick={handleNewSession}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "0.375rem",
          cursor: "pointer",
          fontSize: "0.875rem",
          fontWeight: "500",
        }}
      >
        New Session
      </button>
    </div>
  );
};
