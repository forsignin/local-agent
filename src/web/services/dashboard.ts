import api from './api';
import type { DashboardMetrics } from '../types/dashboard';

export const fetchDashboardData = async (type: 'metrics' | 'events') => {
  const response = await api.get(`/dashboard/${type}`);
  return response.data;
}; 