export type TaskType = 'code_execution' | 'file_processing' | 'network_access' | 'data_analysis' | 'text_processing' | 'custom';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'paused' | 'stopped';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface TaskStep {
  id: string;
  taskId: string;
  name: string;
  description?: string;
  status: TaskStatus;
  order: number;
  result?: any;
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskResult {
  success: boolean;
  data: any;
  error?: string;
  metrics?: {
    duration: number;
    resourceUsage: {
      cpu: number;
      memory: number;
    };
  };
}

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  description?: string;
  config?: Record<string, any>;
  steps: TaskStep[];
  result?: TaskResult;
  agent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskFilter {
  type?: TaskType[];
  status?: TaskStatus[];
  priority?: TaskPriority[];
  agentId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  failed: number;
  running: number;
  pending: number;
  byType: Record<TaskType, number>;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  averageCompletionTime: number;
  successRate: number;
}

export interface TaskState {
  tasks: Record<string, Task>;
  selectedTask: Task | null;
  filters: TaskFilter;
  stats: TaskStats;
  loading: boolean;
  error: string | null;
}

export type TaskAction =
  | { type: 'SET_TASKS'; payload: Record<string, Task> }
  | { type: 'SELECT_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'CLEAR_ERROR' }; 