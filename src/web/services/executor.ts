import api from './api';
import type {
  Execution,
  ExecutionContext,
  ExecutionResult,
  ExecutionEvent,
  ExecutionLog,
  ExecutionStatus,
} from '../types/executor';

// 执行管理
export const startExecution = async (
  context: ExecutionContext
): Promise<Execution> => {
  const response = await api.post('/executor/executions', context);
  return response.data;
};

export const getExecution = async (id: string): Promise<Execution> => {
  const response = await api.get(`/executor/executions/${id}`);
  return response.data;
};

export const listExecutions = async (
  filter?: {
    taskId?: string;
    planId?: string;
    status?: ExecutionStatus[];
    startDate?: string;
    endDate?: string;
  }
): Promise<Execution[]> => {
  const response = await api.get('/executor/executions', { params: filter });
  return response.data;
};

// 执行控制
export const pauseExecution = async (id: string): Promise<Execution> => {
  const response = await api.post(`/executor/executions/${id}/pause`);
  return response.data;
};

export const resumeExecution = async (id: string): Promise<Execution> => {
  const response = await api.post(`/executor/executions/${id}/resume`);
  return response.data;
};

export const cancelExecution = async (id: string): Promise<Execution> => {
  const response = await api.post(`/executor/executions/${id}/cancel`);
  return response.data;
};

export const retryExecution = async (
  id: string,
  options?: {
    fromStep?: string;
    parameters?: Record<string, any>;
  }
): Promise<Execution> => {
  const response = await api.post(`/executor/executions/${id}/retry`, options);
  return response.data;
};

// 执行监控
export const getExecutionEvents = async (
  executionId: string,
  options?: {
    startTime?: string;
    types?: string[];
    limit?: number;
  }
): Promise<ExecutionEvent[]> => {
  const response = await api.get(`/executor/executions/${executionId}/events`, {
    params: options,
  });
  return response.data;
};

export const getExecutionLogs = async (
  executionId: string,
  options?: {
    startTime?: string;
    level?: string[];
    source?: string[];
    limit?: number;
  }
): Promise<ExecutionLog[]> => {
  const response = await api.get(`/executor/executions/${executionId}/logs`, {
    params: options,
  });
  return response.data;
};

export const streamLogs = (
  executionId: string,
  options?: {
    level?: string[];
    source?: string[];
  }
): EventSource => {
  const params = new URLSearchParams();
  if (options?.level) {
    params.append('level', options.level.join(','));
  }
  if (options?.source) {
    params.append('source', options.source.join(','));
  }
  return new EventSource(
    `/api/executor/executions/${executionId}/logs/stream?${params.toString()}`
  );
};

// 执行结果
export const getExecutionResult = async (
  executionId: string
): Promise<ExecutionResult> => {
  const response = await api.get(`/executor/executions/${executionId}/result`);
  return response.data;
};

export const getExecutionArtifact = async (
  executionId: string,
  artifactName: string
): Promise<Blob> => {
  const response = await api.get(
    `/executor/executions/${executionId}/artifacts/${artifactName}`,
    {
      responseType: 'blob',
    }
  );
  return response.data;
};

// 执行统计
export const getExecutionStats = async (
  filter?: {
    taskId?: string;
    planId?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<{
  total: number;
  completed: number;
  failed: number;
  averageDuration: number;
  resourceUsage: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}> => {
  const response = await api.get('/executor/stats', { params: filter });
  return response.data;
};

// 执行队列管理
export const getExecutionQueue = async (): Promise<{
  pending: number;
  running: number;
  queue: Array<{
    id: string;
    priority: number;
    estimatedStartTime: string;
  }>;
}> => {
  const response = await api.get('/executor/queue');
  return response.data;
};

export const updateExecutionPriority = async (
  executionId: string,
  priority: number
): Promise<void> => {
  await api.put(`/executor/queue/${executionId}/priority`, { priority });
}; 