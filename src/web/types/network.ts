export interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  params?: Record<string, string>;
  data?: any;
  timeout?: number;
  proxy?: {
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
  };
  maxRedirects?: number;
  validateStatus?: (status: number) => boolean;
  retry?: {
    maxRetries: number;
    retryDelay: number;
    retryCondition?: (error: any) => boolean;
  };
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  timing: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

export interface CrawlerConfig {
  url: string;
  selector?: string;
  waitFor?: string | number;
  screenshot?: boolean;
  javascript?: boolean;
  timeout?: number;
  proxy?: RequestConfig['proxy'];
  headers?: Record<string, string>;
  cookies?: Array<{
    name: string;
    value: string;
    domain: string;
    path?: string;
  }>;
  viewport?: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
    isMobile?: boolean;
  };
  blockResources?: Array<'image' | 'stylesheet' | 'script' | 'font' | 'media'>;
}

export interface CrawlerResult {
  url: string;
  status: number;
  html: string;
  text: string;
  title: string;
  screenshot?: string;
  elements?: Array<{
    selector: string;
    text: string;
    html: string;
    attributes: Record<string, string>;
  }>;
  metrics: {
    navigationStart: number;
    loadEventEnd: number;
    duration: number;
    resourceCount: number;
    scriptCount: number;
    styleCount: number;
    imageCount: number;
  };
}

export interface CacheConfig {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'fifo';
}

export interface NetworkState {
  activeRequests: Map<string, {
    config: RequestConfig;
    startTime: number;
    status: 'pending' | 'completed' | 'failed';
    response?: ResponseData;
    error?: Error;
  }>;
  activeCrawlers: Map<string, {
    config: CrawlerConfig;
    startTime: number;
    status: 'pending' | 'completed' | 'failed';
    result?: CrawlerResult;
    error?: Error;
  }>;
  cacheStats: {
    hits: number;
    misses: number;
    size: number;
  };
  loading: boolean;
  error: string | null;
} 