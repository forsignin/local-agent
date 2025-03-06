export interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
  };
  uptime: number;
}

export interface SystemConfig {
  maxConcurrentTasks: number;
  maxAgents: number;
  maxTools: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  notificationChannels?: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
  };
  backupSettings?: {
    enabled: boolean;
    interval: number;
    retention: number;
    path: string;
  };
}

export interface SystemStatus {
  status: 'healthy' | 'degraded' | 'error';
  version: string;
  startTime: string;
  lastUpdate: string;
  components: {
    [key: string]: {
      status: 'up' | 'down';
      message?: string;
    };
  };
} 