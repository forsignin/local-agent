import api from './api';
import type {
  Tool,
  ToolCategory,
  ToolExecution,
  ToolFilter,
  ToolStats,
  ToolParameter,
} from '../types/tool';

// 工具管理
export const createTool = async (data: Partial<Tool>): Promise<Tool> => {
  const response = await api.post('/tools', data);
  return response.data;
};

export const getTool = async (id: string): Promise<Tool> => {
  const response = await api.get(`/tools/${id}`);
  return response.data;
};

export const updateTool = async (id: string, data: Partial<Tool>): Promise<Tool> => {
  const response = await api.put(`/tools/${id}`, data);
  return response.data;
};

export const deleteTool = async (id: string): Promise<void> => {
  await api.delete(`/tools/${id}`);
};

export const listTools = async (filter?: ToolFilter): Promise<Tool[]> => {
  const response = await api.get('/tools', { params: filter });
  return response.data;
};

// 工具执行
export const executeTool = async (
  toolId: string,
  parameters: Record<string, any>,
  context?: {
    taskId?: string;
    agentId?: string;
  }
): Promise<ToolExecution> => {
  const response = await api.post(`/tools/${toolId}/execute`, {
    parameters,
    ...context,
  });
  return response.data;
};

export const getExecution = async (executionId: string): Promise<ToolExecution> => {
  const response = await api.get(`/tools/executions/${executionId}`);
  return response.data;
};

export const listExecutions = async (
  toolId?: string,
  taskId?: string,
  agentId?: string
): Promise<ToolExecution[]> => {
  const response = await api.get('/tools/executions', {
    params: { toolId, taskId, agentId },
  });
  return response.data;
};

// 工具配置
export const validateParameters = async (
  toolId: string,
  parameters: Record<string, any>
): Promise<{
  valid: boolean;
  errors?: Record<string, string>;
}> => {
  const response = await api.post(`/tools/${toolId}/validate`, { parameters });
  return response.data;
};

export const getParameterSchema = async (toolId: string): Promise<ToolParameter[]> => {
  const response = await api.get(`/tools/${toolId}/schema`);
  return response.data;
};

export const updateToolStatus = async (
  toolId: string,
  enabled: boolean
): Promise<Tool> => {
  const response = await api.put(`/tools/${toolId}/status`, { enabled });
  return response.data;
};

// 工具统计
export const getToolStats = async (filter?: ToolFilter): Promise<ToolStats> => {
  const response = await api.get('/tools/stats', { params: filter });
  return response.data;
};

export const getToolUsage = async (
  toolId: string,
  startDate?: string,
  endDate?: string
): Promise<{
  dates: string[];
  counts: number[];
}> => {
  const response = await api.get(`/tools/${toolId}/usage`, {
    params: { startDate, endDate },
  });
  return response.data;
};

// 工具依赖管理
export const installDependencies = async (toolId: string): Promise<Tool> => {
  const response = await api.post(`/tools/${toolId}/dependencies/install`);
  return response.data;
};

export const checkDependencies = async (toolId: string): Promise<{
  satisfied: boolean;
  missing: string[];
}> => {
  const response = await api.get(`/tools/${toolId}/dependencies/check`);
  return response.data;
};

// 工具文档
export const generateDocumentation = async (toolId: string): Promise<string> => {
  const response = await api.post(`/tools/${toolId}/documentation`);
  return response.data;
};

export const getToolExample = async (toolId: string): Promise<{
  parameters: Record<string, any>;
  result: any;
}> => {
  const response = await api.get(`/tools/${toolId}/example`);
  return response.data;
}; 