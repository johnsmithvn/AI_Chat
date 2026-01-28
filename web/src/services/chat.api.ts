/**
 * API client for conversation-service
 */
import axios from "axios";
import { API_BASE_URL } from "../config/env";
import type { ChatRequest, ChatResponse, SessionResponse, HistoryResponse, SessionListResponse } from "../types/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
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

  /**
   * List user sessions
   */
  listSessions: async (): Promise<SessionListResponse> => {
    const response = await api.get<SessionListResponse>("/sessions");
    return response.data;
  },

  /**
   * Delete all user sessions
   */
  deleteAllSessions: async (): Promise<{ deleted: number }> => {
    const response = await api.delete<{ deleted: number }>("/sessions");
    return response.data;
  },
};
