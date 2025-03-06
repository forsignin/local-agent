import api from './api';
import type {
  TaskPlan,
  PlanNode,
  PlanningContext,
  PlanValidation,
  PlanExecution,
} from '../types/planner';

// 计划生成
export const generatePlan = async (
  taskId: string,
  context: PlanningContext
): Promise<TaskPlan> => {
  const response = await api.post(`/planner/tasks/${taskId}/plan`, context);
  return response.data;
};

export const updatePlan = async (
  planId: string,
  updates: Partial<TaskPlan>
): Promise<TaskPlan> => {
  const response = await api.put(`/planner/plans/${planId}`, updates);
  return response.data;
};

export const getPlan = async (planId: string): Promise<TaskPlan> => {
  const response = await api.get(`/planner/plans/${planId}`);
  return response.data;
};

export const listPlans = async (taskId?: string): Promise<TaskPlan[]> => {
  const response = await api.get('/planner/plans', {
    params: { taskId },
  });
  return response.data;
};

// 节点管理
export const addNode = async (
  planId: string,
  node: Partial<PlanNode>
): Promise<PlanNode> => {
  const response = await api.post(`/planner/plans/${planId}/nodes`, node);
  return response.data;
};

export const updateNode = async (
  planId: string,
  nodeId: string,
  updates: Partial<PlanNode>
): Promise<PlanNode> => {
  const response = await api.put(`/planner/plans/${planId}/nodes/${nodeId}`, updates);
  return response.data;
};

export const deleteNode = async (planId: string, nodeId: string): Promise<void> => {
  await api.delete(`/planner/plans/${planId}/nodes/${nodeId}`);
};

export const reorderNodes = async (
  planId: string,
  nodeIds: string[]
): Promise<TaskPlan> => {
  const response = await api.put(`/planner/plans/${planId}/nodes/reorder`, {
    nodeIds,
  });
  return response.data;
};

// 计划验证
export const validatePlan = async (planId: string): Promise<PlanValidation> => {
  const response = await api.post(`/planner/plans/${planId}/validate`);
  return response.data;
};

export const optimizePlan = async (
  planId: string,
  options: {
    optimizeFor: 'speed' | 'accuracy' | 'cost';
    constraints?: Record<string, any>;
  }
): Promise<TaskPlan> => {
  const response = await api.post(`/planner/plans/${planId}/optimize`, options);
  return response.data;
};

// 计划执行
export const executePlan = async (planId: string): Promise<PlanExecution> => {
  const response = await api.post(`/planner/plans/${planId}/execute`);
  return response.data;
};

export const getPlanExecution = async (executionId: string): Promise<PlanExecution> => {
  const response = await api.get(`/planner/executions/${executionId}`);
  return response.data;
};

export const listPlanExecutions = async (
  planId?: string
): Promise<PlanExecution[]> => {
  const response = await api.get('/planner/executions', {
    params: { planId },
  });
  return response.data;
};

// 计划分析
export const analyzePlan = async (
  planId: string
): Promise<{
  complexity: number;
  bottlenecks: string[];
  risks: Array<{
    nodeId: string;
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  recommendations: string[];
}> => {
  const response = await api.get(`/planner/plans/${planId}/analysis`);
  return response.data;
};

export const getPlanMetrics = async (
  planId: string
): Promise<{
  executionTime: number;
  successRate: number;
  resourceUsage: Record<string, number>;
  costBreakdown: Record<string, number>;
}> => {
  const response = await api.get(`/planner/plans/${planId}/metrics`);
  return response.data;
};

// 计划模板
export const saveAsTemplate = async (
  planId: string,
  templateName: string
): Promise<{
  id: string;
  name: string;
  description: string;
  plan: TaskPlan;
}> => {
  const response = await api.post(`/planner/templates`, {
    planId,
    name: templateName,
  });
  return response.data;
};

export const applyTemplate = async (
  templateId: string,
  taskId: string,
  parameters?: Record<string, any>
): Promise<TaskPlan> => {
  const response = await api.post(`/planner/templates/${templateId}/apply`, {
    taskId,
    parameters,
  });
  return response.data;
}; 