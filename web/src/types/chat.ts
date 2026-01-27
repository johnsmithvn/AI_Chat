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
  created_at: string;
}

export interface Context {
  context_type: string;
  confidence: number;
  should_refuse: boolean;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
}

export interface Metadata {
  persona: string;
  context: Context;
  model: string;
  usage: Usage;
  valid: boolean;
  warnings: string[];
}

export interface ChatState {
  sessionId: string | null;
  messages: Message[];
  loading: boolean;
  error: string | null;
}
