/**
 * API client for conversation-service
 */
import axios from "axios";
import { API_BASE_URL } from "../config/env";
import type { ChatRequest, ChatResponse, SessionResponse, HistoryResponse } from "../types/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const chatApi = {
  /**
   * Send a chat message
   */
  sendMessage: async (message: string, sessionId?: string): Promise<ChatResponse> => {
    const payload: ChatRequest = {
      message,
      session_id: sessionId,
    };
    
    const response = await api.post<ChatResponse>("/chat", payload);
    return response.data;
  },

  /**
   * Create new session
   */
  createSession: async (): Promise<SessionResponse> => {
    const response = await api.post<SessionResponse>("/session");
    return response.data;
  },

  /**
   * Get conversation history
   */
  getHistory: async (sessionId: string): Promise<HistoryResponse> => {
    const response = await api.get<HistoryResponse>(`/chat/history/${sessionId}`);
    return response.data;
  },

  /**
   * Delete session
   */
  deleteSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/session/${sessionId}`);
  },
};
