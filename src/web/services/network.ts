import api from './api';
import type {
  RequestConfig,
  ResponseData,
  CrawlerConfig,
  CrawlerResult,
  CacheConfig,
} from '../types/network';

// HTTP 请求
export const sendRequest = async (
  config: RequestConfig
): Promise<{
  requestId: string;
  status: 'pending';
}> => {
  const response = await api.post('/network/requests', config);
  return response.data;
};

export const getRequestResult = async (requestId: string): Promise<ResponseData> => {
  const response = await api.get(`/network/requests/${requestId}`);
  return response.data;
};

export const cancelRequest = async (requestId: string): Promise<void> => {
  await api.post(`/network/requests/${requestId}/cancel`);
};

// 网页爬虫
export const startCrawler = async (
  config: CrawlerConfig
): Promise<{
  crawlerId: string;
  status: 'pending';
}> => {
  const response = await api.post('/network/crawlers', config);
  return response.data;
};

export const getCrawlerResult = async (crawlerId: string): Promise<CrawlerResult> => {
  const response = await api.get(`/network/crawlers/${crawlerId}`);
  return response.data;
};

export const cancelCrawler = async (crawlerId: string): Promise<void> => {
  await api.post(`/network/crawlers/${crawlerId}/cancel`);
};

// 缓存管理
export const getCacheStats = async (): Promise<{
  hits: number;
  misses: number;
  size: number;
  entries: number;
}> => {
  const response = await api.get('/network/cache/stats');
  return response.data;
};

export const updateCacheConfig = async (config: CacheConfig): Promise<void> => {
  await api.put('/network/cache/config', config);
};

export const clearCache = async (pattern?: string): Promise<void> => {
  await api.post('/network/cache/clear', { pattern });
};

// 代理管理
export const getAvailableProxies = async (): Promise<
  Array<{
    host: string;
    port: number;
    country: string;
    protocol: string;
    anonymity: string;
    speed: number;
    uptime: number;
  }>
> => {
  const response = await api.get('/network/proxies');
  return response.data;
};

export const testProxy = async (proxy: RequestConfig['proxy']): Promise<{
  success: boolean;
  latency: number;
  error?: string;
}> => {
  const response = await api.post('/network/proxies/test', proxy);
  return response.data;
};

// 监控统计
export const getNetworkStats = async (
  timeRange?: {
    start: string;
    end: string;
  }
): Promise<{
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  bandwidthUsage: number;
  topDomains: Array<{
    domain: string;
    requests: number;
    bandwidth: number;
  }>;
  statusCodes: Record<string, number>;
}> => {
  const response = await api.get('/network/stats', {
    params: timeRange,
  });
  return response.data;
};

// 错误处理
export const getErrorLogs = async (
  options?: {
    startTime?: string;
    endTime?: string;
    limit?: number;
    level?: 'error' | 'warning' | 'info';
  }
): Promise<Array<{
  timestamp: string;
  level: string;
  message: string;
  details: any;
}>> => {
  const response = await api.get('/network/errors', {
    params: options,
  });
  return response.data;
}; 