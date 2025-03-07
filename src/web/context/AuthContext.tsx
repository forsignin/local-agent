import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { message } from 'antd';
import * as authService from '../services/auth';
import type { User } from '../types/user';

// 定义一个事件总线
export const AuthEvents = {
  onAuthStateChange: (isAuthenticated: boolean) => {
    window.dispatchEvent(new CustomEvent('authStateChange', { 
      detail: { isAuthenticated } 
    }));
  }
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

type AuthAction =
  | { type: 'INIT_START' }
  | { type: 'INIT_SUCCESS'; payload: User }
  | { type: 'INIT_FAILURE' }
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  initialized: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'INIT_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'INIT_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
        initialized: true,
      };
    case 'INIT_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        initialized: true,
      };
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export interface AuthContextType {
  state: AuthState;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: authService.RegisterData) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// 全局事件发布器
const publishAuthState = (isAuthenticated: boolean) => {
  window.dispatchEvent(
    new CustomEvent('authStateChange', {
      detail: { isAuthenticated, timestamp: Date.now() }
    })
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const initializingRef = useRef(false);

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      if (initializingRef.current || state.initialized) {
        return;
      }

      initializingRef.current = true;
      const token = localStorage.getItem('token');

      if (!token) {
        dispatch({ type: 'INIT_FAILURE' });
        publishAuthState(false);
        initializingRef.current = false;
        return;
      }

      try {
        dispatch({ type: 'INIT_START' });
        const user = await authService.getCurrentUser();
        dispatch({ type: 'INIT_SUCCESS', payload: user });
        publishAuthState(true);
      } catch (error) {
        console.error('Failed to get current user:', error);
        dispatch({ type: 'INIT_FAILURE' });
        localStorage.removeItem('token');
        publishAuthState(false);
      } finally {
        initializingRef.current = false;
      }
    };

    initAuth();
  }, []);

  // 监听认证状态变化
  useEffect(() => {
    if (state.initialized) {
      publishAuthState(state.isAuthenticated);
    }
  }, [state.isAuthenticated]);

  const login = async (username: string, password: string) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const { token, user } = await authService.login(username, password);
      localStorage.setItem('token', token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
    } catch (error) {
      console.error('Login failed:', error);
      dispatch({ type: 'LOGIN_FAILURE', payload: '登录失败' });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      message.success('已退出登录');
    } catch (error) {
      console.error('Logout failed:', error);
      // 即使退出失败，也要清除本地状态
      localStorage.removeItem('token');
      dispatch({ type: 'LOGOUT' });
      message.error('退出登录失败');
    }
  };

  const register = async (data: authService.RegisterData) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const { user, token } = await authService.register(data);
      localStorage.setItem('token', token);
      dispatch({ type: 'LOGIN_SUCCESS', payload: user });
      message.success('注册成功');
    } catch (error) {
      console.error('Registration failed:', error);
      dispatch({ type: 'LOGIN_FAILURE', payload: '注册失败' });
      message.error('注册失败');
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      const updatedUser = await authService.updateProfile(data);
      dispatch({ type: 'LOGIN_SUCCESS', payload: updatedUser });
      message.success('个人信息更新成功');
    } catch (error) {
      console.error('Profile update failed:', error);
      dispatch({ type: 'SET_ERROR', payload: '更新失败' });
      message.error('更新失败');
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      await authService.changePassword(oldPassword, newPassword);
      message.success('密码修改成功');
      dispatch({ type: 'CLEAR_ERROR' });
    } catch (error) {
      console.error('Password change failed:', error);
      dispatch({ type: 'SET_ERROR', payload: '密码修改失败' });
      message.error('密码修改失败');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      state, 
      login, 
      logout, 
      register,
      updateProfile,
      changePassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};