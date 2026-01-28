/**
 * Authentication API service
 */
import axios from 'axios';
import { API_BASE_URL } from '../config/env';
import type { LoginRequest, RegisterRequest, TokenResponse, User, UpdateProfileRequest } from '../types/auth';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
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

export const authApi = {
  /**
   * Register new user
   */
  register: async (data: RegisterRequest): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Login user
   */
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    const response = await api.post<TokenResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Get current user info
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<User> => {
    const response = await api.put<User>('/auth/me', data);
    return response.data;
  },

  /**
   * Logout (client-side token clear)
   */
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('auth_token');
  },
};
