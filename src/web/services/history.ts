import api from './api';
import type { HistoryRecord } from '../types/history';

export const fetchHistory = async (type: 'tasks' | 'events') => {
  const response = await api.get(`/history/${type}`);
  return response.data;
}; 