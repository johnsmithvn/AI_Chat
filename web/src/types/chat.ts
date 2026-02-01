/**
 * Chat-related types
 */

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  persona?: string;  // Legacy or persona_used
  tone?: string;  // v2.0: casual | technical
  behavior?: string;  // v2.0: normal | cautious
  context_type?: string;
  confidence?: number;  // Legacy
  signal_strength?: number;  // v2.1: replaces confidence
  context_clarity?: boolean;  // v2.1
  needs_knowledge?: boolean;  // v2.1
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
  confidence?: number;  // DEPRECATED: Use signal_strength
  signal_strength?: number;  // v2.1: Keyword signal (NOT probability)
  context_clarity?: boolean;  // v2.1: true=clear, false=conflict
  needs_knowledge?: boolean;  // v2.1
  should_refuse?: boolean;
}

export interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
}

export interface ContentInfo {
  length?: number;
  word_count?: number;
  char_count?: number;
  estimated_read_time?: number;
  has_code_blocks?: boolean;
}

export interface Metadata {
  // v2.1 fields (preferred)
  persona_used?: string | null;  // e.g. "Casual + Cautious"
  tone?: string | null;  // casual | technical
  behavior?: string | null;  // normal | cautious
  context_type?: string | null;  // v2.1: at top level
  needs_knowledge?: boolean | null;
  signal_strength?: number | null;  // v2.1: Keyword signal (NOT probability)
  context_clarity?: boolean | null;  // v2.1: true=clear, false=conflict
  
  // Content metrics (v2.1 flat structure)
  length?: number | null;
  word_count?: number | null;
  estimated_read_time?: number | null;
  has_code_blocks?: boolean | null;
  
  // Legacy fields
  persona: string | null;
  response_mode?: string | null;
  confidence?: number | null;  // DEPRECATED
  context: Context | null;  // Legacy nested object
  
  // Model info
  model: string | null;
  usage: Usage | null;
  content_info?: ContentInfo | null;  // Legacy
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
