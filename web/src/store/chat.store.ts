/**
 * Chat state management with Zustand
 */
import { create } from "zustand";
import { chatApi } from "../services/chat.api";
import type { Message, ChatState, Metadata, SessionListItem } from "../types/chat";

interface ChatStore extends ChatState {
  currentMetadata: Metadata | null;
  sessions: SessionListItem[];
  currentSessionId: string | null;
  
  // Actions
  sendMessage: (message: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  createSession: () => Promise<void>;
  loadHistory: (sessionId: string) => Promise<void>;
  loadSessions: () => Promise<void>;
  selectSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  deleteAllSessions: () => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  clearSession: () => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessionId: null,
  messages: [],
  loading: false,
  error: null,
  currentMetadata: null,
  sessions: [],
  currentSessionId: null,

  sendMessage: async (message: string) => {
    set({ loading: true, error: null });
    
    try {
      const { sessionId } = get();
      
      // Add user message to UI immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        session_id: sessionId || "",
        role: "user",
        content: message,
        created_at: new Date().toISOString(),
      };
      
      // Add placeholder assistant message
      const placeholderId = Date.now().toString() + "_placeholder";
      const placeholderMessage: Message = {
        id: placeholderId,
        session_id: sessionId || "",
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
      };
      
      set((state) => ({
        messages: [...state.messages, userMessage, placeholderMessage],
      }));

      // Send to backend
      const response = await chatApi.sendMessage(message, sessionId || undefined);

      // Update session ID if new
      if (!sessionId) {
        set({ sessionId: response.session_id });
      }

      // Update placeholder with real response
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === placeholderId
            ? {
                ...m,
                id: Date.now().toString() + "1",
                session_id: response.session_id,
                content: response.response,
                // v2.1: Use persona_used or fallback to legacy persona
                persona: response.metadata.persona_used || response.metadata.persona || undefined,
                tone: response.metadata.tone || undefined,
                behavior: response.metadata.behavior || undefined,
                // v2.1: context_type at top level, fallback to nested
                context_type: response.metadata.context_type || response.metadata.context?.context_type || undefined,
                // v2.1: signal_strength preferred, fallback to confidence
                signal_strength: response.metadata.signal_strength || response.metadata.context?.signal_strength || undefined,
                confidence: response.metadata.confidence || response.metadata.context?.confidence || undefined,
                // v2.1: new fields
                context_clarity: response.metadata.context_clarity ?? response.metadata.context?.context_clarity ?? undefined,
                needs_knowledge: response.metadata.needs_knowledge ?? response.metadata.context?.needs_knowledge ?? undefined,
                model_name: response.metadata.model || undefined,
                prompt_tokens: response.metadata.usage?.prompt_tokens || undefined,
                completion_tokens: response.metadata.usage?.completion_tokens || undefined,
                isError: false,
                errorMessage: undefined,
              }
            : m
        ),
        currentMetadata: response.metadata,
        loading: false,
      }));
      
      // Reload sessions
      get().loadSessions();
    } catch (error: unknown) {
      console.error("Send message error:", error);
      let errorMsg = "Failed to send message";
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        errorMsg = axiosError.response?.data?.detail || "Failed to send message";
      }
      
      // Mark placeholder as error
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id.endsWith("_placeholder")
            ? { ...m, isError: true, errorMessage: errorMsg }
            : m
        ),
        error: errorMsg,
        loading: false,
      }));
    }
  },

  retryMessage: async (messageId: string) => {
    const { messages, sessionId } = get();
    
    // Find the error message and the user message before it
    const errorIndex = messages.findIndex((m) => m.id === messageId);
    if (errorIndex === -1) return;
    
    // Find the last user message before this error
    let userMessage: Message | null = null;
    for (let i = errorIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userMessage = messages[i];
        break;
      }
    }
    
    if (!userMessage) return;

    // Reset error state and set loading
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, isError: false, errorMessage: undefined, content: "" }
          : m
      ),
      loading: true,
      error: null,
    }));

    try {
      const response = await chatApi.sendMessage(userMessage.content, sessionId || undefined);

      // Update with real response
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId
            ? {
                ...m,
                content: response.response,
                // v2.1: Use persona_used or fallback to legacy persona
                persona: response.metadata.persona_used || response.metadata.persona || undefined,
                tone: response.metadata.tone || undefined,
                behavior: response.metadata.behavior || undefined,
                // v2.1: context_type at top level, fallback to nested
                context_type: response.metadata.context_type || response.metadata.context?.context_type || undefined,
                // v2.1: signal_strength preferred, fallback to confidence
                confidence: response.metadata.signal_strength || response.metadata.confidence || response.metadata.context?.confidence || undefined,
                model_name: response.metadata.model || undefined,
                prompt_tokens: response.metadata.usage?.prompt_tokens || undefined,
                completion_tokens: response.metadata.usage?.completion_tokens || undefined,
                isError: false,
                errorMessage: undefined,
              }
            : m
        ),
        currentMetadata: response.metadata,
        loading: false,
      }));

    } catch (error: unknown) {
      console.error("Retry message error:", error);
      let errorMsg = "Failed to send message";
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        errorMsg = axiosError.response?.data?.detail || "Failed to send message";
      }
      
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId
            ? { ...m, isError: true, errorMessage: errorMsg }
            : m
        ),
        loading: false,
        error: errorMsg,
      }));
    }
  },

  createSession: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await chatApi.createSession();
      set({
        sessionId: response.id,
        currentSessionId: response.id,
        messages: [],
        currentMetadata: null,
        loading: false,
      });
      // Reload sessions list
      await get().loadSessions();
    } catch (error: unknown) {
      console.error("Create session error:", error);
      set({
        error: "Failed to create new session",
        loading: false,
      });
    }
  },

  loadSessions: async () => {
    try {
      const response = await chatApi.listSessions();
      set({ sessions: response.sessions });
    } catch (error: unknown) {
      console.error("Load sessions error:", error);
    }
  },

  selectSession: async (sessionId: string) => {
    set({ currentSessionId: sessionId });
    await get().loadHistory(sessionId);
  },

  deleteSession: async (sessionId: string) => {
    try {
      await chatApi.deleteSession(sessionId);
      
      // Remove from list
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== sessionId),
      }));
      
      // If current session deleted, clear
      if (get().currentSessionId === sessionId) {
        get().clearSession();
      }
    } catch (error: unknown) {
      console.error("Delete session error:", error);
      set({ error: "Failed to delete session" });
    }
  },

  deleteAllSessions: async () => {
    try {
      const result = await chatApi.deleteAllSessions();
      console.log(`Deleted ${result.deleted} sessions`);
      
      // Clear all sessions from list
      set({ sessions: [] });
      
      // Clear current session
      get().clearSession();
    } catch (error: unknown) {
      console.error("Delete all sessions error:", error);
      set({ error: "Failed to delete all sessions" });
    }
  },

  renameSession: async (sessionId: string, title: string) => {
    try {
      await chatApi.renameSession(sessionId, title);
      
      // Update session in list
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === sessionId ? { ...s, title } : s
        ),
      }));
    } catch (error: unknown) {
      console.error("Rename session error:", error);
      set({ error: "Failed to rename session" });
    }
  },

  loadHistory: async (sessionId: string) => {
    set({ loading: true, error: null });
    
    try {
      const response = await chatApi.getHistory(sessionId);
      set({
        sessionId: response.session_id,
        messages: response.messages,
        loading: false,
      });
    } catch (error: unknown) {
      console.error("Load history error:", error);
      set({
        error: "Failed to load history",
        loading: false,
      });
    }
  },

  clearSession: () => {
    set({
      sessionId: null,
      messages: [],
      currentMetadata: null,
      error: null,
    });
  },

  setError: (error: string | null) => {
    set({ error });
  },
}));
