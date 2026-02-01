/**
 * API client for conversation-service
 */
import axios from "axios";
import { API_BASE_URL } from "../config/env";
import type { ChatRequest, ChatResponse, SessionResponse, HistoryResponse, SessionListResponse, TokenAnalyticsResponse, SessionCompareResponse, SessionReplayResponse, MistakeMessage, MistakesListResponse } from "../types/api";

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

  /**
   * Rename session
   */
  renameSession: async (sessionId: string, title: string): Promise<SessionResponse> => {
    const response = await api.put<SessionResponse>(`/session/${sessionId}`, { title });
    return response.data;
  },

  /**
   * Get token analytics
   */
  getTokenAnalytics: async (): Promise<TokenAnalyticsResponse> => {
    const response = await api.get<TokenAnalyticsResponse>("/analytics/tokens");
    return response.data;
  },

  /**
   * Compare two sessions
   */
  compareSessions: async (sessionId1: string, sessionId2: string): Promise<SessionCompareResponse> => {
    const response = await api.post<SessionCompareResponse>("/analytics/compare", {
      session_id_1: sessionId1,
      session_id_2: sessionId2,
    });
    return response.data;
  },

  /**
   * Get session replay data
   */
  getSessionReplay: async (sessionId: string): Promise<SessionReplayResponse> => {
    const response = await api.get<SessionReplayResponse>(`/session/${sessionId}/replay`);
    return response.data;
  },

  /**
   * Mark/unmark message as mistake
   */
  markMistake: async (messageId: string, isMistake: boolean, note?: string): Promise<MistakeMessage> => {
    const response = await api.put<MistakeMessage>(`/message/${messageId}/mistake`, {
      is_mistake: isMistake,
      note: note,
    });
    return response.data;
  },

  /**
   * Get all mistakes
   */
  getMistakes: async (limit?: number): Promise<MistakesListResponse> => {
    const response = await api.get<MistakesListResponse>("/message/mistakes", {
      params: limit ? { limit } : undefined,
    });
    return response.data;
  },
};
