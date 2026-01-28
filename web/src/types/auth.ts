/**
 * Authentication types
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  last_login_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UpdateProfileRequest {
  name?: string;
  avatar_url?: string;
}
