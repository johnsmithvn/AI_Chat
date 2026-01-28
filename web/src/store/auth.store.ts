/**
 * Auth store - Zustand
 */
import { create } from 'zustand';
import { authApi } from '../services/auth.api';
import type { User, LoginRequest, RegisterRequest } from '../types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,

  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login(data);
      localStorage.setItem('auth_token', response.access_token);
      set({ user: response.user, token: response.access_token, isLoading: false });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Login failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register(data);
      localStorage.setItem('auth_token', response.access_token);
      set({ user: response.user, token: response.access_token, isLoading: false });
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Registration failed';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      set({ user: null, token: null });
    }
  },

  loadUser: async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      set({ user: null, token: null });
      return;
    }

    try {
      const user = await authApi.getCurrentUser();
      set({ user, token });
    } catch (error) {
      console.error('Load user error:', error);
      localStorage.removeItem('auth_token');
      set({ user: null, token: null });
    }
  },

  clearError: () => set({ error: null }),
}));
