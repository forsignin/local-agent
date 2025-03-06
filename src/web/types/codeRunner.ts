export type RuntimeType = 'node' | 'python' | 'java' | 'go' | 'rust' | 'custom';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface RuntimeConfig {
  type: RuntimeType;
  version?: string;
  env?: Record<string, string>;
  timeout?: number;
  memory?: number;
}

export interface CodeInput {
  code: string;
  language: string;
  config?: RuntimeConfig;
}

export interface CodeOutput {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration: number;
}

export interface RuntimeInstance {
  id: string;
  type: RuntimeType;
  status: 'ready' | 'busy' | 'error';
  config: RuntimeConfig;
  created_at: string;
  updated_at: string;
}

export interface ExecutionResult {
  id: string;
  status: ExecutionStatus;
  input: CodeInput;
  output?: CodeOutput;
  error?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

export interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  dependencies?: Record<string, string>;
  installed: boolean;
  size?: number;
  installTime?: string;
}

export interface ExecutionState {
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  output?: CodeOutput;
}

export interface CodeRunnerState {
  runtimes: RuntimeInstance[];
  activeRuntime: string | null;
  executions: Map<string, ExecutionState>;
  loading: boolean;
  error: string | null;
} 