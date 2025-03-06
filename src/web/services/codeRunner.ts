import api from './api';
import type {
  RuntimeType,
  RuntimeConfig,
  RuntimeInstance,
  CodeInput,
  CodeOutput,
  PackageInfo,
} from '../types/codeRunner';

// 运行时管理
export const createRuntime = async (config: RuntimeConfig): Promise<RuntimeInstance> => {
  const response = await api.post('/code-runner/runtimes', config);
  return response.data;
};

export const getRuntime = async (id: string): Promise<RuntimeInstance> => {
  const response = await api.get(`/code-runner/runtimes/${id}`);
  return response.data;
};

export const listRuntimes = async (type?: RuntimeType): Promise<RuntimeInstance[]> => {
  const response = await api.get('/code-runner/runtimes', {
    params: { type },
  });
  return response.data;
};

export const updateRuntime = async (
  id: string,
  config: Partial<RuntimeConfig>
): Promise<RuntimeInstance> => {
  const response = await api.put(`/code-runner/runtimes/${id}`, config);
  return response.data;
};

export const deleteRuntime = async (id: string): Promise<void> => {
  await api.delete(`/code-runner/runtimes/${id}`);
};

// 代码执行
export const executeCode = async (
  runtimeId: string,
  input: CodeInput
): Promise<{
  executionId: string;
  status: 'pending' | 'running';
}> => {
  const response = await api.post(`/code-runner/runtimes/${runtimeId}/execute`, input);
  return response.data;
};

export const getExecution = async (
  executionId: string
): Promise<{
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: CodeInput;
  output?: CodeOutput;
  startTime: string;
  endTime?: string;
}> => {
  const response = await api.get(`/code-runner/executions/${executionId}`);
  return response.data;
};

export const cancelExecution = async (executionId: string): Promise<void> => {
  await api.post(`/code-runner/executions/${executionId}/cancel`);
};

export const streamOutput = (
  executionId: string,
  options?: {
    stdout?: boolean;
    stderr?: boolean;
  }
): EventSource => {
  const params = new URLSearchParams(options as Record<string, string>).toString();
  return new EventSource(
    `/api/code-runner/executions/${executionId}/output/stream?${params}`
  );
};

// 包管理
export const installPackage = async (
  runtimeId: string,
  packageName: string,
  version?: string
): Promise<PackageInfo> => {
  const response = await api.post(`/code-runner/runtimes/${runtimeId}/packages`, {
    name: packageName,
    version,
  });
  return response.data;
};

export const uninstallPackage = async (
  runtimeId: string,
  packageName: string
): Promise<void> => {
  await api.delete(`/code-runner/runtimes/${runtimeId}/packages/${packageName}`);
};

export const listPackages = async (runtimeId: string): Promise<PackageInfo[]> => {
  const response = await api.get(`/code-runner/runtimes/${runtimeId}/packages`);
  return response.data;
};

export const updatePackage = async (
  runtimeId: string,
  packageName: string,
  version: string
): Promise<PackageInfo> => {
  const response = await api.put(
    `/code-runner/runtimes/${runtimeId}/packages/${packageName}`,
    { version }
  );
  return response.data;
};

// 运行时监控
export const getRuntimeMetrics = async (
  runtimeId: string
): Promise<Record<string, any>> => {
  const response = await api.get(`/code-runner/runtimes/${runtimeId}/metrics`);
  return response.data;
};

export const getRuntimeLogs = async (
  runtimeId: string,
  options?: {
    startTime?: string;
    endTime?: string;
    limit?: number;
  }
): Promise<Array<{
  timestamp: string;
  level: string;
  message: string;
  metadata?: Record<string, any>;
}>> => {
  const response = await api.get(`/code-runner/runtimes/${runtimeId}/logs`, {
    params: options,
  });
  return response.data;
};

// 文件管理
export const listFiles = async (
  runtimeId: string,
  path?: string
): Promise<Array<{
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  modifiedTime: string;
}>> => {
  const response = await api.get(`/code-runner/runtimes/${runtimeId}/files`, {
    params: { path },
  });
  return response.data;
};

export const readFile = async (
  runtimeId: string,
  path: string
): Promise<{
  content: string;
  encoding: string;
  size: number;
  modifiedTime: string;
}> => {
  const response = await api.get(`/code-runner/runtimes/${runtimeId}/files/read`, {
    params: { path },
  });
  return response.data;
};

export const writeFile = async (
  runtimeId: string,
  path: string,
  content: string | Blob
): Promise<void> => {
  const formData = new FormData();
  formData.append('path', path);
  formData.append('content', content);
  await api.post(`/code-runner/runtimes/${runtimeId}/files/write`, formData);
};

export const deleteFile = async (runtimeId: string, path: string): Promise<void> => {
  await api.delete(`/code-runner/runtimes/${runtimeId}/files`, {
    params: { path },
  });
}; 