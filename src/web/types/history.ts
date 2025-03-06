export interface HistoryRecord {
  id: string;
  type: string;
  action: string;
  status: string;
  timestamp: string;
  details: Record<string, any>;
}

export type HistoryType = 'tasks' | 'events'; 