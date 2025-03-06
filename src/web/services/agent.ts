import api from './api';
import type { Agent, AgentType, AgentConfig, AgentMessage, AgentAction } from '../types/agent';

// 代理管理
export const createAgent = async (type: AgentType, config: Partial<AgentConfig>): Promise<Agent> => {
  const response = await api.post('/agents', { type, config });
  return response.data;
};

export const getAgent = async (id: string): Promise<Agent> => {
  const response = await api.get(`/agents/${id}`);
  return response.data;
};

export const updateAgent = async (id: string, data: Partial<Agent>): Promise<Agent> => {
  const response = await api.put(`/agents/${id}`, data);
  return response.data;
};

export const deleteAgent = async (id: string): Promise<void> => {
  await api.delete(`/agents/${id}`);
};

export const listAgents = async (type?: AgentType): Promise<Agent[]> => {
  const response = await api.get('/agents', { params: { type } });
  return response.data;
};

// 代理通信
export const sendMessage = async (agentId: string, content: string, metadata?: Record<string, any>): Promise<AgentMessage> => {
  const response = await api.post(`/agents/${agentId}/messages`, {
    content,
    metadata,
  });
  return response.data;
};

export const getMessages = async (agentId: string, limit: number = 50): Promise<AgentMessage[]> => {
  const response = await api.get(`/agents/${agentId}/messages`, {
    params: { limit },
  });
  return response.data;
};

// 代理动作
export const executeAction = async (
  agentId: string,
  taskId: string,
  type: string,
  input: Record<string, any>
): Promise<AgentAction> => {
  const response = await api.post(`/agents/${agentId}/actions`, {
    taskId,
    type,
    input,
  });
  return response.data;
};

export const getAction = async (agentId: string, actionId: string): Promise<AgentAction> => {
  const response = await api.get(`/agents/${agentId}/actions/${actionId}`);
  return response.data;
};

export const listActions = async (
  agentId: string,
  taskId?: string,
  status?: string
): Promise<AgentAction[]> => {
  const response = await api.get(`/agents/${agentId}/actions`, {
    params: { taskId, status },
  });
  return response.data;
};

// 代理监控
export const getAgentMetrics = async (agentId: string): Promise<Record<string, any>> => {
  const response = await api.get(`/agents/${agentId}/metrics`);
  return response.data;
};

export const getAgentLogs = async (agentId: string, startTime?: string, endTime?: string): Promise<string[]> => {
  const response = await api.get(`/agents/${agentId}/logs`, {
    params: { startTime, endTime },
  });
  return response.data;
};

// 代理配置
export const updateAgentConfig = async (
  agentId: string,
  config: Partial<AgentConfig>
): Promise<Agent> => {
  const response = await api.put(`/agents/${agentId}/config`, config);
  return response.data;
};

export const resetAgent = async (agentId: string): Promise<void> => {
  await api.post(`/agents/${agentId}/reset`);
};

// 代理协作
export const assignTask = async (agentId: string, taskId: string): Promise<void> => {
  await api.post(`/agents/${agentId}/tasks/${taskId}/assign`);
};

export const transferTask = async (
  fromAgentId: string,
  toAgentId: string,
  taskId: string
): Promise<void> => {
  await api.post(`/agents/${fromAgentId}/tasks/${taskId}/transfer`, {
    toAgentId,
  });
};