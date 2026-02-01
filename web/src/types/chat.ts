/**
 * Chat-related types
 */

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  persona?: string;
  context_type?: string;
  confidence?: number;
  model_name?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  is_mistake?: boolean;
  mistake_note?: string;
  created_at: string;
  // Error handling
  isError?: boolean;
  errorMessage?: string;
}

export interface Context {
  context_type?: string;
  confidence?: number;
  should_refuse?: boolean;
}

export interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
}

export interface Metadata {
  persona: string | null;
  context: Context | null;
  model: string | null;
  usage: Usage | null;
  valid: boolean;
  warnings: string[];
}

export interface ChatState {
  sessionId: string | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
}

export interface SessionListItem {
  id: string;
  title: string | null;
  message_count: number;
  last_active_at: string;
  created_at: string;
}
