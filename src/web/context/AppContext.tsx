import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import { message } from 'antd';
import { fetchSystemMetrics, fetchAgents, fetchTasks, fetchTools } from '../services/api';
import type { Agent } from '../types/agent';
import type { Task } from '../types/task';
import type { Tool } from '../types/tool';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
  uptime: number;
}

const defaultSystemMetrics: SystemMetrics = {
  cpu: {
    usage: 0,
    cores: 0
  },
  memory: {
    total: 0,
    used: 0,
    free: 0
  },
  disk: {
    total: 0,
    used: 0,
    free: 0
  },
  uptime: 0
};

type Action =
  | { type: 'SET_SYSTEM_METRICS'; payload: SystemMetrics }
  | { type: 'SET_AGENTS'; payload: Agent[] }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'SET_TOOLS'; payload: Tool[] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_AUTHENTICATED'; payload: boolean };

interface AppState {
  systemMetrics: SystemMetrics;
  agents: Agent[];
  tasks: Task[];
  tools: Tool[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AppState = {
  systemMetrics: defaultSystemMetrics,
  agents: [],
  tasks: [],
  tools: [],
  loading: false,
  error: null,
  isAuthenticated: false
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null
});

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_SYSTEM_METRICS':
      return {
        ...state,
        systemMetrics: action.payload,
        loading: false
      };
    case 'SET_AGENTS':
      return {
        ...state,
        agents: action.payload,
        loading: false
      };
    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload,
        loading: false
      };
    case 'SET_TOOLS':
      return {
        ...state,
        tools: action.payload,
        loading: false
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'SET_AUTHENTICATED':
      return {
        ...state,
        isAuthenticated: action.payload
      };
    default:
      return state;
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const lastAuthTimestampRef = useRef(0);

  // 监听认证状态变化
  useEffect(() => {
    const handleAuthChange = (event: CustomEvent<{ isAuthenticated: boolean; timestamp: number }>) => {
      // 防止处理旧的事件
      if (event.detail.timestamp <= lastAuthTimestampRef.current) {
        return;
      }
      
      lastAuthTimestampRef.current = event.detail.timestamp;
      dispatch({ type: 'SET_AUTHENTICATED', payload: event.detail.isAuthenticated });
      
      // 如果是登出，清除所有数据
      if (!event.detail.isAuthenticated) {
        dispatch({ type: 'SET_SYSTEM_METRICS', payload: defaultSystemMetrics });
        dispatch({ type: 'SET_AGENTS', payload: [] });
        dispatch({ type: 'SET_TASKS', payload: [] });
        dispatch({ type: 'SET_TOOLS', payload: [] });
      }
    };

    window.addEventListener('authStateChange', handleAuthChange as EventListener);
    return () => {
      window.removeEventListener('authStateChange', handleAuthChange as EventListener);
    };
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
