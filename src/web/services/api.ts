import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { SystemMetrics, SystemConfig, SystemStatus } from '../types/system';
import type { SystemEvent, DashboardMetrics } from '../types/dashboard';
import type { Agent, AgentFilter } from '../types/agent';
import type { Task } from '../types/task';
import type { Tool } from '../types/tool';
import type { User, LoginCredentials, RegisterData } from '../types/user';

// 导出 API 基础 URL
export const API_BASE_URL = 'http://localhost:8000';

// 添加一个全局变量来控制是否允许工具相关的 API 调用
let allowToolApiCalls = false;

export const setAllowToolApiCalls = (allow: boolean) => {
  allowToolApiCalls = allow;
};

const api: AxiosInstance = axios.create({
  // 添加 /api 前缀以匹配后端路由
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 拦截工具相关的 API 调用
    const url = config.url || '';
    if (url.includes('/tools') && !allowToolApiCalls) {
      // 对于工具相关的 API 调用，如果不允许，则取消请求
      // 创建一个取消的 Promise
      return new Promise((_, reject) => {
        reject({ 
          message: 'Tool API calls are not allowed',
          config,
          isToolApiBlocked: true
        });
      });
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 如果是我们自己取消的工具 API 调用，则静默处理
    if (error.isToolApiBlocked) {
      // 返回一个空的成功响应，而不是错误
      return Promise.resolve({
        data: error.config.method === 'get' ? [] : {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config,
      });
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// System endpoints
export const fetchSystemMetrics = (): Promise<AxiosResponse<SystemMetrics>> => api.get('/system/metrics');
export const fetchSystemConfig = (): Promise<AxiosResponse<SystemConfig>> => api.get('/system/config');
export const fetchSystemStatus = (): Promise<AxiosResponse<SystemStatus>> => api.get('/system/status');
export const fetchSystemEvents = (): Promise<AxiosResponse<SystemEvent[]>> => api.get('/system/events');

// Dashboard endpoints
export const fetchDashboardMetrics = (): Promise<AxiosResponse<DashboardMetrics>> => api.get('/dashboard/metrics');

// Agent endpoints
export const fetchAgents = (filters?: AgentFilter): Promise<AxiosResponse<Agent[]>> => api.get('/agents', { params: filters });
export const fetchAgentById = (id: string): Promise<AxiosResponse<Agent>> => api.get(`/agents/${id}`);
export const createAgent = (data: Partial<Agent>): Promise<AxiosResponse<Agent>> => api.post('/agents', data);
export const updateAgent = (id: string, data: Partial<Agent>): Promise<AxiosResponse<Agent>> => api.put(`/agents/${id}`, data);
export const deleteAgent = (id: string): Promise<AxiosResponse<void>> => api.delete(`/agents/${id}`);

// Task endpoints
export const fetchTasks = (params?: any): Promise<AxiosResponse<Task[]>> => api.get('/tasks', { params });
export const fetchTaskById = (id: string): Promise<AxiosResponse<Task>> => api.get(`/tasks/${id}`);
export const createTask = (data: Partial<Task>): Promise<AxiosResponse<Task>> => api.post('/tasks', data);
export const updateTask = (id: string, data: Partial<Task>): Promise<AxiosResponse<Task>> => api.put(`/tasks/${id}`, data);
export const deleteTask = (id: string): Promise<AxiosResponse<void>> => api.delete(`/tasks/${id}`);

// Tool endpoints
export const fetchTools = (params?: any): Promise<AxiosResponse<Tool[]>> => api.get('/tools', { params });
export const fetchToolById = (id: string): Promise<AxiosResponse<Tool>> => api.get(`/tools/${id}`);
export const createTool = (data: Partial<Tool>): Promise<AxiosResponse<Tool>> => api.post('/tools', data);
export const updateTool = (id: string, data: Partial<Tool>): Promise<AxiosResponse<Tool>> => api.put(`/tools/${id}`, data);
export const deleteTool = (id: string): Promise<AxiosResponse<void>> => api.delete(`/tools/${id}`);

// Auth endpoints
export const login = (credentials: LoginCredentials): Promise<AxiosResponse<{ token: string; user: User }>> => 
  api.post('/auth/login', credentials);
export const register = (data: RegisterData): Promise<AxiosResponse<{ token: string; user: User }>> => 
  api.post('/auth/register', data);
export const getCurrentUser = (): Promise<AxiosResponse<User>> => api.get('/auth/me');
export const updateProfile = (data: Partial<User>): Promise<AxiosResponse<User>> => api.put('/auth/profile', data);
export const changePassword = (data: { currentPassword: string; newPassword: string }): Promise<AxiosResponse<void>> => 
  api.put('/auth/password', data);

export default api;