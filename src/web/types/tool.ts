export type ToolCategory =
  | 'code_execution'
  | 'file_processing'
  | 'data_analysis'
  | 'text_processing'
  | 'custom';

export type ToolPermission = 'read' | 'write' | 'execute' | 'network' | 'system';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
  enum?: any[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => boolean;
  };
}

export interface ToolResult {
  type: string;
  schema: Record<string, any>;
  example?: any;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  type: string;
  category: ToolCategory;
  config: Record<string, any>;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type ToolExecution = {
  id: string;
  tool_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  input: Record<string, any>;
  output: Record<string, any>;
  error?: string;
  created_at: string;
  updated_at: string;
};

export type ToolFilter = {
  category?: ToolCategory;
  enabled?: boolean;
  search?: string;
};

export type ToolStats = {
  total: number;
  enabled: number;
  byCategory: Record<ToolCategory, number>;
  topUsed: Tool[];
  averageSuccessRate: number;
};

export type ToolState = {
  tools: Tool[];
  selectedTool: Tool | null;
  executions: ToolExecution[];
  filter: ToolFilter;
  stats: ToolStats;
  loading: boolean;
  error: string | null;
}; 