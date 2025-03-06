import type { Task, TaskStep } from './task';
import type { Tool } from './tool';
import type { Agent } from './agent';

export interface PlanNode {
  id: string;
  type: 'task' | 'tool' | 'condition' | 'parallel' | 'sequence';
  label: string;
  description?: string;
  data: {
    taskId?: string;
    toolId?: string;
    agentId?: string;
    parameters?: Record<string, any>;
    condition?: string;
    branches?: PlanNode[][];
  };
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime?: string;
  endTime?: string;
}

export interface TaskPlan {
  id: string;
  taskId: string;
  version: number;
  nodes: PlanNode[];
  edges: Array<{
    source: string;
    target: string;
    label?: string;
  }>;
  metadata: {
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed';
  };
}

export interface PlanningContext {
  task: Task;
  availableTools: Tool[];
  availableAgents: Agent[];
  constraints: {
    maxSteps?: number;
    maxParallel?: number;
    timeLimit?: number;
    resourceLimits?: Record<string, number>;
  };
  preferences: {
    preferredTools?: string[];
    preferredAgents?: string[];
    optimizeFor?: 'speed' | 'accuracy' | 'cost';
  };
}

export interface PlanValidation {
  valid: boolean;
  errors: Array<{
    nodeId: string;
    type: 'error' | 'warning';
    message: string;
  }>;
  warnings: Array<{
    nodeId: string;
    type: 'performance' | 'resource' | 'dependency';
    message: string;
  }>;
  metrics: {
    estimatedDuration: number;
    estimatedCost: number;
    resourceUsage: Record<string, number>;
    complexity: number;
  };
}

export interface PlanExecution {
  id: string;
  planId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  currentNode?: string;
  progress: number;
  startTime: string;
  endTime?: string;
  results: Record<string, any>;
  errors: Record<string, string>;
  logs: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    nodeId?: string;
  }>;
}

export interface PlannerState {
  plans: TaskPlan[];
  selectedPlan: TaskPlan | null;
  executions: PlanExecution[];
  loading: boolean;
  error: string | null;
}