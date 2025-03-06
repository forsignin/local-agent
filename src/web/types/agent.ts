export type AgentType = 'executor' | 'planner' | 'assistant' | 'custom';

export type AgentStatus = 'idle' | 'busy' | 'error' | 'offline';

export type AgentCapability = 'code_execution' | 'file_processing' | 'network_access' | 'data_analysis' | 'text_processing';

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  stopSequences: string[];
  tools: string[];
}

export interface AgentMetrics {
  tasksCompleted: number;
  successRate: number;
  averageResponseTime: number;
  errorRate: number;
  lastActive: string;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  capabilities: AgentCapability[];
  description: string;
  config: {
    maxConcurrentTasks: number;
    timeout: number;
    retryAttempts: number;
    allowedTools: string[];
    [key: string]: any;
  };
  stats: {
    tasksCompleted: number;
    tasksSuccessful: number;
    tasksFailed: number;
    averageResponseTime: number;
    uptime: number;
    lastActive: string;
  };
  created_at: string;
  updated_at: string;
}

export interface AgentMessage {
  id: string;
  agentId: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AgentAction {
  id: string;
  agentId: string;
  taskId: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  startTime: string;
  endTime?: string;
}

export interface AgentFilter {
  type?: AgentType;
  status?: AgentStatus;
  capability?: AgentCapability;
  search?: string;
}

export interface AgentState {
  agents: Agent[];
  selectedAgent: Agent | null;
  loading: boolean;
  error: string | null;
  filters: AgentFilter;
} 