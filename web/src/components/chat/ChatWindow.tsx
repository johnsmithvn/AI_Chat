/**
 * Chat Window - Combines MessageList and ChatInput
 */
import React from "react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

export const ChatWindow: React.FC = () => {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <MessageList />
      <ChatInput />
    </div>
  );
};
