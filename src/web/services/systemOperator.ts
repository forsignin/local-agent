import api from './api';
import type {
  ProcessInfo,
  SystemMetrics,
  FileSystemOperation,
  ServiceInfo,
} from '../types/systemOperator';

// 进程管理
export const listProcesses = async (): Promise<ProcessInfo[]> => {
  const response = await api.get('/system-operator/processes');
  return response.data;
};

export const getProcessInfo = async (pid: number): Promise<ProcessInfo> => {
  const response = await api.get(`/system-operator/processes/${pid}`);
  return response.data;
};

export const killProcess = async (
  pid: number,
  options?: {
    signal?: 'SIGTERM' | 'SIGKILL';
    force?: boolean;
  }
): Promise<void> => {
  await api.post(`/system-operator/processes/${pid}/kill`, options);
};

// 系统监控
export const getSystemMetrics = async (): Promise<SystemMetrics> => {
  const response = await api.get('/system-operator/metrics');
  return response.data;
};

export const subscribeToMetrics = (
  callback: (metrics: SystemMetrics) => void
): (() => void) => {
  const ws = new WebSocket(
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${
      window.location.host
    }/system-operator/metrics/stream`
  );

  ws.onmessage = (event) => {
    callback(JSON.parse(event.data));
  };

  return () => ws.close();
};

// 文件系统操作
export const startFileOperation = async (
  operation: Omit<FileSystemOperation, 'id' | 'status' | 'progress' | 'createdAt' | 'updatedAt'>
): Promise<{
  operationId: string;
  status: 'pending';
}> => {
  const response = await api.post('/system-operator/fs/operations', operation);
  return response.data;
};

export const getFileOperationStatus = async (
  operationId: string
): Promise<FileSystemOperation> => {
  const response = await api.get(
    `/system-operator/fs/operations/${operationId}`
  );
  return response.data;
};

export const cancelFileOperation = async (operationId: string): Promise<void> => {
  await api.post(`/system-operator/fs/operations/${operationId}/cancel`);
};

export const getFilePermissions = async (
  path: string
): Promise<{
  mode: string;
  owner: string;
  group: string;
}> => {
  const response = await api.get('/system-operator/fs/permissions', {
    params: { path },
  });
  return response.data;
};

export const setFilePermissions = async (
  path: string,
  permissions: {
    mode?: string;
    owner?: string;
    group?: string;
    recursive?: boolean;
  }
): Promise<void> => {
  await api.put('/system-operator/fs/permissions', {
    path,
    ...permissions,
  });
};

// 服务管理
export const listServices = async (): Promise<ServiceInfo[]> => {
  const response = await api.get('/system-operator/services');
  return response.data;
};

export const getServiceInfo = async (name: string): Promise<ServiceInfo> => {
  const response = await api.get(`/system-operator/services/${name}`);
  return response.data;
};

export const startService = async (name: string): Promise<void> => {
  await api.post(`/system-operator/services/${name}/start`);
};

export const stopService = async (name: string): Promise<void> => {
  await api.post(`/system-operator/services/${name}/stop`);
};

export const restartService = async (name: string): Promise<void> => {
  await api.post(`/system-operator/services/${name}/restart`);
};

export const enableService = async (name: string): Promise<void> => {
  await api.post(`/system-operator/services/${name}/enable`);
};

export const disableService = async (name: string): Promise<void> => {
  await api.post(`/system-operator/services/${name}/disable`);
};

// 系统日志
export const getSystemLogs = async (
  options?: {
    service?: string;
    level?: 'error' | 'warning' | 'info' | 'debug';
    since?: string;
    until?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{
  logs: Array<{
    timestamp: string;
    level: string;
    service: string;
    message: string;
    metadata?: Record<string, any>;
  }>;
  total: number;
}> => {
  const response = await api.get('/system-operator/logs', {
    params: options,
  });
  return response.data;
};

// 系统命令执行
export const executeCommand = async (
  command: string,
  options?: {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
    shell?: string;
  }
): Promise<{
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}> => {
  const response = await api.post('/system-operator/execute', {
    command,
    options,
  });
  return response.data;
}; 