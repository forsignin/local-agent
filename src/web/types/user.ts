export type UserRole = 'admin' | 'user' | 'guest';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  settings?: Record<string, any>;
  fullName?: string;
  phone?: string;
  organization?: string;
  bio?: string;
}

export interface UserProfile extends User {
  fullName?: string;
  phone?: string;
  organization?: string;
  bio?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  oauthToken?: string;
  provider?: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
}