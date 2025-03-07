import api from './api';
import type { DashboardMetrics } from '../types/dashboard';

export const fetchDashboardData = async (type: 'metrics' | 'status' | 'events') => {
  const response = await api.get(`/system/${type}`);
  return response.data;
}; 