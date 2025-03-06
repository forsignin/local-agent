import type { TaskPlan, PlanNode } from './planner';
import type { Tool } from './tool';
import type { Agent } from './agent';

export type ExecutionStatus = 
  | 'pending'
  | 'preparing'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ExecutionContext {
  taskId: string;
  planId: string;
  nodeId: string;
  agentId: string;
  toolId?: string;
  parameters: Record<string, any>;
  environment: {
    workingDirectory: string;
    variables: Record<string, string>;
    timeout?: number;
    maxRetries?: number;
  };
  resources: {
    cpu?: number;
    memory?: number;
    disk?: number;
    network?: boolean;
  };
}

export interface ExecutionResult {
  success: boolean;
  output: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metrics: {
    startTime: string;
    endTime: string;
    duration: number;
    cpuUsage: number;
    memoryUsage: number;
    networkUsage: number;
  };
  artifacts?: Array<{
    name: string;
    type: string;
    path: string;
    size: number;
    metadata?: Record<string, any>;
  }>;
}

export interface ExecutionEvent {
  id: string;
  executionId: string;
  type: 'start' | 'progress' | 'error' | 'complete' | 'system';
  timestamp: string;
  data: {
    message: string;
    progress?: number;
    status?: ExecutionStatus;
    result?: ExecutionResult;
    error?: any;
  };
}

export interface ExecutionLog {
  id: string;
  executionId: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warning' | 'error';
  source: 'system' | 'agent' | 'tool';
  message: string;
  metadata?: Record<string, any>;
}

export interface Execution {
  id: string;
  taskId: string;
  planId: string;
  nodeId: string;
  status: ExecutionStatus;
  context: ExecutionContext;
  result?: ExecutionResult;
  events: ExecutionEvent[];
  logs: ExecutionLog[];
  children: string[];
  parent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExecutorState {
  executions: Record<string, Execution>;
  activeExecutions: string[];
  executionQueue: string[];
  loading: boolean;
  error: string | null;
} 