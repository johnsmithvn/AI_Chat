/**
 * Chat state management with Zustand
 */
import { create } from "zustand";
import { chatApi } from "../services/chat.api";
import type { Message, ChatState, Metadata } from "../types/chat";

interface ChatStore extends ChatState {
  currentMetadata: Metadata | null;
  
  // Actions
  sendMessage: (message: string) => Promise<void>;
  createNewSession: () => Promise<void>;
  loadHistory: (sessionId: string) => Promise<void>;
  clearSession: () => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessionId: null,
  messages: [],
  loading: false,
  error: null,
  currentMetadata: null,

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
      
      set((state) => ({
        messages: [...state.messages, userMessage],
      }));

      // Send to backend
      const response = await chatApi.sendMessage(message, sessionId || undefined);

      // Update session ID if new
      if (!sessionId) {
        set({ sessionId: response.session_id });
      }

      // Add assistant message
      const assistantMessage: Message = {
        id: Date.now().toString() + "1",
        session_id: response.session_id,
        role: "assistant",
        content: response.response,
        persona: response.metadata.persona || undefined,
        context_type: response.metadata.context?.context_type || undefined,
        confidence: response.metadata.context?.confidence || undefined,
        model_name: response.metadata.model || undefined,
        prompt_tokens: response.metadata.usage?.prompt_tokens || undefined,
        completion_tokens: response.metadata.usage?.completion_tokens || undefined,
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        currentMetadata: response.metadata,
        loading: false,
      }));
    } catch (error: unknown) {
      console.error("Send message error:", error);
      let errorMessage = "Failed to send message";
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string } } };
        errorMessage = axiosError.response?.data?.detail || "Failed to send message";
      }
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  createNewSession: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await chatApi.createSession();
      set({
        sessionId: response.id,
        messages: [],
        currentMetadata: null,
        loading: false,
      });
    } catch (error: unknown) {
      console.error("Create session error:", error);
      set({
        error: "Failed to create new session",
        loading: false,
      });
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
