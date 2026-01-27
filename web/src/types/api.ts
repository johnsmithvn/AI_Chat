/**
 * API request/response types
 */
import { Metadata, Message } from "./chat";

export interface ChatRequest {
  message: string;
  session_id?: string;
}

export interface ChatResponse {
  session_id: string;
  response: string;
  metadata: Metadata;
}

export interface SessionResponse {
  id: string;
  user_id: string;
  ai_session_id: string;
  title: string | null;
  created_at: string;
  last_active_at: string;
}

export interface HistoryResponse {
  session_id: string;
  messages: Message[];
}
