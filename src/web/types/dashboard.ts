import type { Task } from './task';
import type { Agent } from './agent';
import type { Tool } from './tool';

export interface SystemEvent {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface DashboardMetrics {
  systemStatus: {
    cpu: number;
    memory: number;
    disk: number;
    uptime: number;
  };
  taskMetrics: {
    total: number;
    running: number;
    completed: number;
    failed: number;
    pending: number;
  };
  agentMetrics: {
    total: number;
    active: number;
    idle: number;
  };
  toolMetrics: {
    total: number;
    enabled: number;
    byCategory: Record<string, number>;
  };
  tasks: {
    total: number;
    completed: number;
    failed: number;
    running: number;
    pending: number;
    successRate: number;
    averageCompletionTime: number;
  };
  agents: {
    total: number;
    active: number;
    idle: number;
    error: number;
    utilization: number;
  };
  tools: {
    total: number;
    enabled: number;
    disabled: number;
    mostUsed: Array<{
      id: string;
      name: string;
      usageCount: number;
    }>;
  };
  recentTasks: Task[];
  recentEvents: SystemEvent[];
  activeAgents: Agent[];
  popularTools: Tool[];
}

export interface DashboardState {
  metrics: DashboardMetrics | null;
  events: SystemEvent[];
  loading: boolean;
  error: string | null;
  lastUpdate: string | null;
}

export interface DashboardEvent {
  id: string;
  type: string;
  source: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  metadata?: Record<string, any>;
} 