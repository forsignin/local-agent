import api from './api';
import type { Task, TaskType, TaskFilter, TaskStats, TaskStep, TaskResult } from '../types/task';
import type { AxiosResponse } from 'axios';

// 任务管理
export const fetchTasks = async (): Promise<Task[]> => {
  const response = await api.get<Task[]>('/tasks');
  return response.data;
};

export const fetchTask = async (id: string): Promise<Task> => {
  const response = await api.get<Task>(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (data: Partial<Task>): Promise<Task> => {
  const response = await api.post<Task>('/tasks', data);
  return response.data;
};

export const updateTask = async (id: string, data: Partial<Task>): Promise<Task> => {
  const response = await api.put<Task>(`/tasks/${id}`, data);
  return response.data;
};

export const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};

export const listTasks = async (filter?: TaskFilter): Promise<Task[]> => {
  const response = await api.get('/tasks', { params: filter });
  return response.data;
};

// 任务执行
export const startTask = async (id: string): Promise<Task> => {
  const response = await api.post(`/tasks/${id}/start`);
  return response.data;
};

export const pauseTask = async (id: string): Promise<Task> => {
  const response = await api.post(`/tasks/${id}/pause`);
  return response.data;
};

export const resumeTask = async (id: string): Promise<Task> => {
  const response = await api.post(`/tasks/${id}/resume`);
  return response.data;
};

export const cancelTask = async (id: string): Promise<Task> => {
  const response = await api.post(`/tasks/${id}/cancel`);
  return response.data;
};

// 任务步骤管理
export const addTaskStep = async (taskId: string, step: Partial<TaskStep>): Promise<TaskStep> => {
  const response = await api.post(`/tasks/${taskId}/steps`, step);
  return response.data;
};

export const updateTaskStep = async (
  taskId: string,
  stepId: string,
  data: Partial<TaskStep>
): Promise<TaskStep> => {
  const response = await api.put(`/tasks/${taskId}/steps/${stepId}`, data);
  return response.data;
};

export const deleteTaskStep = async (taskId: string, stepId: string): Promise<void> => {
  await api.delete(`/tasks/${taskId}/steps/${stepId}`);
};

export const reorderTaskSteps = async (
  taskId: string,
  stepIds: string[]
): Promise<TaskStep[]> => {
  const response = await api.put(`/tasks/${taskId}/steps/reorder`, { stepIds });
  return response.data;
};

// 任务结果管理
export const setTaskResult = async (
  taskId: string,
  result: TaskResult
): Promise<Task> => {
  const response = await api.put(`/tasks/${taskId}/result`, result);
  return response.data;
};

export const getTaskResult = async (taskId: string): Promise<TaskResult> => {
  const response = await api.get(`/tasks/${taskId}/result`);
  return response.data;
};

// 任务统计
export const getTaskStats = async (filter?: TaskFilter): Promise<TaskStats> => {
  const response = await api.get('/tasks/stats', { params: filter });
  return response.data;
};

export const getTaskTimeline = async (taskId: string): Promise<any[]> => {
  const response = await api.get(`/tasks/${taskId}/timeline`);
  return response.data;
};

// 任务分配
export const assignTask = async (taskId: string, agentIds: string[]): Promise<Task> => {
  const response = await api.post(`/tasks/${taskId}/assign`, { agentIds });
  return response.data;
};

export const unassignTask = async (taskId: string, agentIds: string[]): Promise<Task> => {
  const response = await api.post(`/tasks/${taskId}/unassign`, { agentIds });
  return response.data;
};

// 任务依赖管理
export const addTaskDependency = async (
  taskId: string,
  dependencyId: string
): Promise<Task> => {
  const response = await api.post(`/tasks/${taskId}/dependencies`, { dependencyId });
  return response.data;
};

export const removeTaskDependency = async (
  taskId: string,
  dependencyId: string
): Promise<Task> => {
  const response = await api.delete(`/tasks/${taskId}/dependencies/${dependencyId}`);
  return response.data;
}; 