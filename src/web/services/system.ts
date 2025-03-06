import api from './api';
import type { SystemConfig } from '../types/system';

export const fetchSystemConfig = async (): Promise<SystemConfig> => {
  const response = await api.get<SystemConfig>('/system/config');
  return response.data;
};

export const updateSystemConfig = async (config: Partial<SystemConfig>): Promise<SystemConfig> => {
  const response = await api.put<SystemConfig>('/system/config', config);
  return response.data;
}; 