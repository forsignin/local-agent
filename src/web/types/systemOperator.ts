export type ProcessStatus = 'running' | 'stopped' | 'error';

export interface ProcessInfo {
  pid: number;
  name: string;
  command: string;
  status: ProcessStatus;
  cpu: number;
  memory: number;
  startTime: string;
  user: string;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature?: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    readSpeed: number;
    writeSpeed: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
    packetsReceived: number;
    packetsSent: number;
    errors: number;
  };
}

export interface FileSystemOperation {
  id: string;
  type: 'copy' | 'move' | 'delete' | 'create' | 'chmod' | 'chown';
  source?: string;
  target?: string;
  permissions?: string;
  owner?: string;
  group?: string;
  recursive?: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceInfo {
  name: string;
  status: 'active' | 'inactive' | 'failed';
  enabled: boolean;
  description?: string;
  dependencies: string[];
}

export interface SystemOperatorState {
  processes: Map<number, ProcessInfo>;
  metrics: SystemMetrics | null;
  activeOperations: Map<string, FileSystemOperation>;
  services: Map<string, ServiceInfo>;
  selectedProcess: number | null;
  loading: boolean;
  error: string | null;
} 