export interface User {
    id: string;
    username: string;
    email: string;
    role: 'admin' | 'user' | 'guest';
    permissions: string[];
    created_at: string;
    last_login: string;
  }
  
  export interface LoginCredentials {
    username: string;
    password: string;
    remember?: boolean;
  }
  
  export interface RegisterData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }
  
  export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
  }
  
  export interface AuthContextType {
    state: AuthState;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    updateProfile: (data: Partial<User>) => Promise<void>;
    changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  }