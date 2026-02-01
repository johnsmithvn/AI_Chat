/**
 * API request/response types
 */
import type { Metadata, Message, SessionListItem } from "./chat";

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

export interface SessionListResponse {
  sessions: SessionListItem[];
}

// Analytics types
export interface TokenStats {
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  message_count: number;
  avg_tokens_per_message: number;
}

export interface SessionTokenStats {
  session_id: string;
  session_title: string | null;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  message_count: number;
  created_at: string;
}

export interface DailyTokenStats {
  date: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  message_count: number;
}

export interface TokenAnalyticsResponse {
  overall: TokenStats;
  by_session: SessionTokenStats[];
  by_day: DailyTokenStats[];
}

export interface SessionCompareItem {
  session_id: string;
  title: string | null;
  message_count: number;
  total_tokens: number;
  avg_confidence: number | null;
  persona_distribution: Record<string, number>;
  model_used: string | null;
  created_at: string;
  duration_minutes: number;
}

export interface SessionCompareResponse {
  session_1: SessionCompareItem;
  session_2: SessionCompareItem;
}

// Replay types
export interface ReplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  persona?: string;
  context_type?: string;
  confidence?: number;
  model_name?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  created_at: string;
  delay_ms: number;
}

export interface SessionReplayResponse {
  session_id: string;
  title: string | null;
  messages: ReplayMessage[];
  total_duration_ms: number;
  message_count: number;
}

// Mistake types
export interface MarkMistakeRequest {
  is_mistake: boolean;
  note?: string;
}

export interface MistakeMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  persona?: string;
  context_type?: string;
  confidence?: number;
  model_name?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  is_mistake: boolean;
  mistake_note?: string;
  created_at: string;
}

export interface MistakesListResponse {
  mistakes: MistakeMessage[];
  total: number;
}
